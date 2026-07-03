# Network configuration

- `config/mainnet` contains production Mainnet settings.
- `config/devnet` contains Devnet testing settings.
- Root-level config JSON files are intentionally not used.
- Select a network with `--network mainnet|devnet` or `NETWORK=mainnet|devnet`.
- Do not copy Devnet configuration over Mainnet configuration.
- Use `npm run ui` (or `npm run ui:mainnet`) for Mainnet.
- Use `npm run ui:devnet` for Devnet.
