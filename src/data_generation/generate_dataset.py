"""Generate reproducible synthetic BTC-SCOPE V1 datasets.

The output intentionally simplifies Bitcoin's UTXO model into one directed
wallet-to-wallet transfer per row. It is for model prototyping, not blockchain
forensics or claims about real-world wallet attribution.
"""

from __future__ import annotations

import argparse
import csv
import ipaddress
import json
import random
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable


COUNTRIES = ("IN", "US", "DE", "SG", "NL", "GB", "JP", "CA", "CH", "AE")
SCRIPT_TYPES = ("P2WPKH", "P2PKH", "P2TR")
WALLET_TYPES = ("personal", "exchange", "merchant", "service")
SCENARIOS = ("normal", "fan_in", "fan_out", "layering", "peel_chain")
SCENARIO_RATIOS = {"normal": 0.72, "fan_in": 0.08, "fan_out": 0.08, "layering": 0.07, "peel_chain": 0.05}
ANOMALOUS_WALLET_RATIO = 0.08
BASE_TIME = datetime(2026, 1, 1, tzinfo=timezone.utc)


@dataclass(frozen=True)
class NetworkIdentity:
    ip: str
    asn: str
    country: str


class DatasetGenerator:
    def __init__(self, wallet_count: int, transaction_count: int, seed: int) -> None:
        if wallet_count < 200:
            raise ValueError("wallet_count must be at least 200")
        if transaction_count < 100:
            raise ValueError("transaction_count must be at least 100")
        self.wallet_count = wallet_count
        self.transaction_count = transaction_count
        self.rng = random.Random(seed)
        self.wallets = [f"W{i:06d}" for i in range(1, wallet_count + 1)]
        anomaly_count = max(16, round(wallet_count * ANOMALOUS_WALLET_RATIO))
        selected = self.rng.sample(self.wallets, anomaly_count)
        self.scenario_wallets: dict[str, list[str]] = {}
        for index, scenario in enumerate(("fan_in", "fan_out", "layering", "peel_chain")):
            start = index * anomaly_count // 4
            end = (index + 1) * anomaly_count // 4
            self.scenario_wallets[scenario] = selected[start:end]
        self.normal_wallets = [wallet for wallet in self.wallets if wallet not in selected]
        self.identities = self._make_identities(max(100, wallet_count // 8))
        self.wallet_identity = {
            wallet: self.rng.choice(self.identities) for wallet in self.wallets
        }
        self.transactions: list[dict[str, object]] = []
        self.observations: list[dict[str, object]] = []
        self.labels: list[dict[str, object]] = []
        self.wallet_scenarios: dict[str, str] = {wallet: "normal" for wallet in self.wallets}
        for scenario, wallets in self.scenario_wallets.items():
            for wallet in wallets:
                self.wallet_scenarios[wallet] = scenario
        # Legitimate exchanges, merchants, and services can be highly active.
        # They introduce benign high-velocity behaviour into the normal class.
        active_count = max(1, round(len(self.normal_wallets) * 0.08))
        batch_count = max(1, round(len(self.normal_wallets) * 0.02))
        self.benign_active_wallets = self.rng.sample(self.normal_wallets, active_count)
        remaining_normals = [wallet for wallet in self.normal_wallets if wallet not in self.benign_active_wallets]
        self.benign_batch_wallets = self.rng.sample(remaining_normals, batch_count)
        self.tx_number = 0
        self.obs_number = 0
        self.base_tx_time = BASE_TIME
        self.tx_scenarios: dict[str, str] = {}

    def _make_identities(self, count: int) -> list[NetworkIdentity]:
        identities: list[NetworkIdentity] = []
        for index in range(count):
            # Documentation-reserved ranges avoid fabricating public IPs.
            block = 1 + (index // 254) % 3
            host = 1 + index % 254
            identities.append(NetworkIdentity(
                ip=str(ipaddress.IPv4Address(f"198.51.{block}.{host}")),
                asn=f"AS{12000 + index}",
                country=COUNTRIES[index % len(COUNTRIES)],
            ))
        return identities

    def _timestamp(self, min_minutes_after_previous: int = 1) -> datetime:
        self.base_tx_time += timedelta(minutes=self.rng.randint(min_minutes_after_previous, min_minutes_after_previous + 30))
        return self.base_tx_time

    @staticmethod
    def _iso(value: datetime) -> str:
        return value.isoformat().replace("+00:00", "Z")

    def _amount(self, minimum: float = 0.001, maximum: float = 5.0) -> float:
        return round(self.rng.uniform(minimum, maximum), 8)

    def _add_transaction(self, sender: str, receiver: str, scenario: str, timestamp: datetime, amount: float | None = None) -> None:
        if sender == receiver:
            raise ValueError("sender and receiver must differ")
        self.tx_number += 1
        txid = f"TX{self.tx_number:08d}"
        amount = self._amount() if amount is None else round(amount, 8)
        fee = round(max(0.000001, amount * self.rng.uniform(0.00002, 0.0003)), 8)
        self.transactions.append({
            "txid": txid,
            "timestamp": self._iso(timestamp),
            "input_wallet": sender,
            "output_wallet": receiver,
            "amount_btc": f"{amount:.8f}",
            "fee_btc": f"{fee:.8f}",
            "script_type": self.rng.choices(SCRIPT_TYPES, weights=(70, 20, 10))[0],
        })
        self.tx_scenarios[txid] = scenario
        self._add_observation(txid, timestamp, sender)
        if scenario != "normal":
            self.labels.append({
                "entity_id": txid,
                "entity_type": "transaction",
                "scenario": scenario,
                "start_time": self._iso(timestamp),
                "end_time": self._iso(timestamp),
            })

    def _add_observation(self, txid: str, timestamp: datetime, sender: str) -> None:
        self.obs_number += 1
        source = self.wallet_identity[sender]
        destination = self.rng.choice(self.identities)
        self.observations.append({
            "observation_id": f"OBS{self.obs_number:08d}",
            "timestamp": self._iso(timestamp + timedelta(seconds=self.rng.randint(0, 90))),
            "txid": txid,
            "src_ip": source.ip,
            "dst_ip": destination.ip,
            "src_port": self.rng.randint(1024, 65535),
            "dst_port": 8333,
            "asn": source.asn,
            "country": source.country,
        })

    def _normal(self) -> None:
        # Normal wallets are heterogeneous: most are ordinary peers, while
        # legitimate services and merchants have heavy, bursty activity.
        # Occasional anomalous-wallet background transfers avoid isolation.
        roll = self.rng.random()
        if roll < 0.10:
            sender = self.rng.choice(self.benign_batch_wallets)
            receiver_count = self.rng.randint(3, 6)
            receivers: set[str] = set()
            while len(receivers) < receiver_count:
                receiver = self.rng.choice(self.normal_wallets)
                if receiver != sender:
                    receivers.add(receiver)
            start = self._timestamp()
            for receiver in receivers:
                self._add_transaction(
                    sender, receiver, "normal",
                    start + timedelta(minutes=self.rng.randint(0, 12)),
                    self._amount(0.01, 2.0),
                )
            return
        if roll < 0.50:
            sender = self.rng.choice(self.benign_active_wallets)
            receiver = self.rng.choice(self.normal_wallets)
            while receiver == sender:
                receiver = self.rng.choice(self.normal_wallets)
        elif roll < 0.65:
            sender = self.rng.choice(self.benign_batch_wallets)
            receiver = self.rng.choice(self.normal_wallets)
            while receiver == sender:
                receiver = self.rng.choice(self.normal_wallets)
        else:
            population = self.normal_wallets if roll < 0.92 else self.wallets
            sender, receiver = self.rng.sample(population, 2)
        self._add_transaction(sender, receiver, "normal", self._timestamp())

    def _fan_in(self) -> None:
        pool = self.scenario_wallets["fan_in"]
        target = self.rng.choice(pool)
        sender_count = min(len(pool) - 1, self.rng.randint(4, 8))
        senders = self.rng.sample([w for w in pool if w != target], sender_count)
        start = self._timestamp()
        for sender in senders:
            self._add_transaction(sender, target, "fan_in", start + timedelta(minutes=self.rng.randint(0, 15)))

    def _fan_out(self) -> None:
        pool = self.scenario_wallets["fan_out"]
        source = self.rng.choice(pool)
        receiver_count = min(len(pool) - 1, self.rng.randint(4, 8))
        receivers = self.rng.sample([w for w in pool if w != source], receiver_count)
        start = self._timestamp()
        total = self._amount(0.5, 12.0)
        for receiver in receivers:
            self._add_transaction(source, receiver, "fan_out", start + timedelta(minutes=self.rng.randint(0, 15)), total / len(receivers))

    def _layering(self) -> None:
        pool = self.scenario_wallets["layering"]
        chain = self.rng.sample(pool, min(len(pool), self.rng.randint(4, 7)))
        start = self._timestamp()
        amount = self._amount(1.0, 10.0)
        for index, (sender, receiver) in enumerate(zip(chain, chain[1:])):
            amount *= self.rng.uniform(0.965, 0.995)
            self._add_transaction(sender, receiver, "layering", start + timedelta(minutes=2 * index), amount)

    def _peel_chain(self) -> None:
        pool = self.scenario_wallets["peel_chain"]
        chain = self.rng.sample(pool, min(len(pool), self.rng.randint(4, 7)))
        start = self._timestamp()
        amount = self._amount(2.0, 15.0)
        for index, (sender, receiver) in enumerate(zip(chain, chain[1:])):
            amount *= self.rng.uniform(0.78, 0.92)
            self._add_transaction(sender, receiver, "peel_chain", start + timedelta(minutes=3 * index), amount)

    def generate(self) -> None:
        builders = {"normal": self._normal, "fan_in": self._fan_in, "fan_out": self._fan_out, "layering": self._layering, "peel_chain": self._peel_chain}
        targets = {scenario: round(self.transaction_count * ratio) for scenario, ratio in SCENARIO_RATIOS.items()}
        targets["normal"] += self.transaction_count - sum(targets.values())
        produced: Counter[str] = Counter()
        while len(self.transactions) < self.transaction_count:
            available = [name for name in SCENARIOS if produced[name] < targets[name]]
            if not available:
                available = ["normal"]
            scenario = self.rng.choice(available)
            before = len(self.transactions)
            builders[scenario]()
            produced[scenario] += len(self.transactions) - before
        self.transactions = self.transactions[:self.transaction_count]
        valid_txids = {row["txid"] for row in self.transactions}
        self.observations = [row for row in self.observations if row["txid"] in valid_txids]
        self.labels = [row for row in self.labels if row["entity_type"] != "transaction" or row["entity_id"] in valid_txids]

    def ground_truth_rows(self) -> list[dict[str, object]]:
        wallet_labels = [{
            "entity_id": wallet,
            "entity_type": "wallet",
            "scenario": scenario,
            "start_time": self._iso(BASE_TIME),
            "end_time": self._iso(self.base_tx_time),
        } for wallet, scenario in self.wallet_scenarios.items()]
        return [*wallet_labels, *self.labels]

    def wallet_rows(self) -> list[dict[str, object]]:
        return [{
            "wallet_id": wallet,
            "created_at": self._iso(BASE_TIME - timedelta(days=self.rng.randint(1, 365))),
            "wallet_type": self.rng.choices(WALLET_TYPES, weights=(70, 10, 15, 5))[0],
            "ground_truth": self.wallet_scenarios[wallet],
        } for wallet in self.wallets]

    def ip_link_rows(self) -> list[dict[str, object]]:
        seen: dict[tuple[str, str], list[datetime]] = defaultdict(list)
        tx_senders = {row["txid"]: row["input_wallet"] for row in self.transactions}
        for observation in self.observations:
            seen[(str(tx_senders[observation["txid"]]), str(observation["src_ip"]))].append(
                datetime.fromisoformat(str(observation["timestamp"]).replace("Z", "+00:00"))
            )
        return [{
            "wallet_id": wallet,
            "ip": ip,
            "first_seen": self._iso(min(times)),
            "last_seen": self._iso(max(times)),
            "observation_count": len(times),
        } for (wallet, ip), times in sorted(seen.items())]


def write_csv(path: Path, rows: list[dict[str, object]], fields: list[str]) -> None:
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate BTC-SCOPE synthetic CSV data.")
    parser.add_argument("--output-dir", type=Path, default=Path("data/raw"))
    parser.add_argument("--wallet-count", type=int, default=5_000)
    parser.add_argument("--transaction-count", type=int, default=20_000)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    generator = DatasetGenerator(args.wallet_count, args.transaction_count, args.seed)
    generator.generate()
    datasets = {
        "wallets.csv": (generator.wallet_rows(), ["wallet_id", "created_at", "wallet_type", "ground_truth"]),
        "transactions.csv": (generator.transactions, ["txid", "timestamp", "input_wallet", "output_wallet", "amount_btc", "fee_btc", "script_type"]),
        "network_observations.csv": (generator.observations, ["observation_id", "timestamp", "txid", "src_ip", "dst_ip", "src_port", "dst_port", "asn", "country"]),
        "wallet_ip_links.csv": (generator.ip_link_rows(), ["wallet_id", "ip", "first_seen", "last_seen", "observation_count"]),
        "ground_truth.csv": (generator.ground_truth_rows(), ["entity_id", "entity_type", "scenario", "start_time", "end_time"]),
    }
    for filename, (rows, fields) in datasets.items():
        write_csv(args.output_dir / filename, rows, fields)
    summary = {
        "seed": args.seed,
        "wallet_count": args.wallet_count,
        "transaction_count": len(generator.transactions),
        "network_observation_count": len(generator.observations),
        "wallet_ip_link_count": len(generator.ip_link_rows()),
        "ground_truth_count": len(generator.ground_truth_rows()),
        "wallet_scenario_distribution": dict(Counter(generator.wallet_scenarios.values())),
        "transaction_scenario_distribution": dict(Counter(
            generator.tx_scenarios[str(row["txid"])] for row in generator.transactions
        )),
    }
    (args.output_dir / "generation_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
