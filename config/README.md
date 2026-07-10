# Network configuration

- `config/mainnet` contains production Mainnet settings.
- `config/devnet` contains Devnet testing settings.
- Root-level config JSON files are intentionally not used.
- Select a network with `--network mainnet|devnet` or `NETWORK=mainnet|devnet`.
- Do not copy Devnet configuration over Mainnet configuration.
- Use `npm run ui` (or `npm run ui:mainnet`) for Mainnet.
- Use `npm run ui:devnet` for Devnet.
- `./ui.sh` starts the Mainnet UI.
- `./ui.sh --dev-net` starts the Devnet UI.
- `config/<network>/cnft-config.json` stores the active Merkle Tree for cNFT minting.
- If `cnft-config.json` is missing, the Java launcher creates the Merkle Tree automatically when `--mint-cnft` or `--mint-all` is used.
- Devnet runs may use two wallets: a Devnet wallet for Solana minting and a funded storage wallet for Irys uploads.
