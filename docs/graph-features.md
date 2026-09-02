# Graph features

`src.graph.build_graph_features` builds a directed multi-transaction graph from `transactions.csv`. It never reads ground truth.

| Feature | Definition |
|---|---|
| `in_degree` / `out_degree` | Number of incoming / outgoing transaction edges, including repeated wallet pairs. |
| `total_degree` | `in_degree + out_degree`. |
| `unique_in_neighbors` / `unique_out_neighbors` | Distinct predecessor / successor wallets. |
| `neighbor_count` | Distinct wallets connected in either direction. |
| `in_out_degree_ratio` | Smoothed `(in_degree + 1) / (out_degree + 1)`; safe for sources and sinks. |
| `two_hop_neighbors` | Distinct wallets reachable through two outbound transaction edges. |
| `average_sent_amount` / `average_received_amount` | Mean amount over outbound / inbound edges; zero when absent. |
| `max_sent_amount` / `max_received_amount` | Maximum outbound / inbound amount; zero when absent. |
| `fan_in_score` | `unique_in_neighbors × log(1 + in_degree)`; high when many wallets converge. |
| `fan_out_score` | `unique_out_neighbors × log(1 + out_degree)`; high when one wallet disperses widely. |
| `chain_score` | `two_hop_neighbors × min(in_degree,out_degree)/max(in_degree,out_degree)`; high for balanced flow-through wallets with downstream reach. |
