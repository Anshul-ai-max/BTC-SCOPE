"""Train a reproducible, label-free Isolation Forest anomaly model."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


RANDOM_STATE = 42
VALID_RISK_BANDS = {"high", "medium", "low"}


def load_model_data(path: Path) -> tuple[list[str], list[str], np.ndarray]:
    with path.open(newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        fields = reader.fieldnames or []
        if "wallet_id" not in fields:
            raise ValueError("model features must contain wallet_id")
        feature_names = [field for field in fields if field != "wallet_id"]
        wallets, values = [], []
        for row in reader:
            wallets.append(row["wallet_id"])
            converted = []
            for feature in feature_names:
                try:
                    converted.append(float(row[feature]))
                except (TypeError, ValueError):
                    converted.append(float("nan"))
            values.append(converted)
    matrix = np.asarray(values, dtype=float)
    return wallets, feature_names, np.nan_to_num(matrix, nan=0.0, posinf=0.0, neginf=0.0)


def fit_and_score(matrix: np.ndarray) -> tuple[Pipeline, np.ndarray]:
    pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("isolation_forest", IsolationForest(
            n_estimators=200, contamination=0.08, random_state=RANDOM_STATE, n_jobs=-1,
        )),
    ])
    pipeline.fit(matrix)
    # Higher values mean more anomalous, unlike sklearn's decision_function.
    return pipeline, -pipeline.decision_function(matrix)


def risk_bands(scores: np.ndarray) -> list[str]:
    order = np.argsort(-scores, kind="stable")
    high_count = max(1, round(len(scores) * 0.05))
    medium_count = max(high_count, round(len(scores) * 0.20))
    bands = ["low"] * len(scores)
    for index in order[:medium_count]:
        bands[int(index)] = "medium"
    for index in order[:high_count]:
        bands[int(index)] = "high"
    return bands


def main() -> None:
    parser = argparse.ArgumentParser(description="Train BTC-SCOPE Isolation Forest.")
    parser.add_argument("--input", type=Path, default=Path("data/processed/model_features.csv"))
    parser.add_argument("--model-output", type=Path, default=Path("models/isolation_forest.joblib"))
    parser.add_argument("--scores-output", type=Path, default=Path("data/processed/ml_anomaly_scores.csv"))
    args = parser.parse_args()
    wallets, feature_names, matrix = load_model_data(args.input)
    pipeline, scores = fit_and_score(matrix)
    args.model_output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"pipeline": pipeline, "feature_names": feature_names}, args.model_output)
    bands = risk_bands(scores)
    args.scores_output.parent.mkdir(parents=True, exist_ok=True)
    with args.scores_output.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["wallet_id", "anomaly_score", "risk_band"])
        writer.writeheader()
        writer.writerows({"wallet_id": wallet, "anomaly_score": f"{score:.8f}", "risk_band": band} for wallet, score, band in zip(wallets, scores, bands))
    print(f"Trained Isolation Forest on {len(wallets)} wallets × {len(feature_names)} features")
    print(f"Saved model to {args.model_output}; scores to {args.scores_output}")


if __name__ == "__main__":
    main()
