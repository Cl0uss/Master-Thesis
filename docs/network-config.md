# Network configuration

Solana configuration is separated by network:

```text
config/
  mainnet/
    app-config.json
    rpc-config.json
    collection-config.json
  devnet/
    app-config.json
    rpc-config.json
    collection-config.json
    cnft-config.json
```

`config/mainnet` and `config/devnet` are the only active configuration locations. Old root config files were removed to prevent network confusion, and all scripts use network-aware loading. Network selection accepts `--network devnet`, `--network=devnet`, `--network mainnet`, or `--network=mainnet`. The `NETWORK` environment variable is also supported. The command-line launcher and UI default to Mainnet unless Devnet is selected explicitly.

## UI

Start the Mainnet UI (the default):

```bash
npm run ui
# or
npm run ui:mainnet
# or
./ui.sh
```

Start the Devnet UI:

```bash
npm run ui:devnet
# or
./ui.sh --dev-net
```

The selected network controls the UI ownership-check RPC and the Solana configuration passed to NFT/cNFT commands.

In Mainnet mode, the UI shows one wallet field. In Devnet mode, the UI shows two wallet fields:

```text
Solana Devnet wallet: signs NFT, cNFT, and Merkle Tree transactions
Irys storage wallet: funds and signs Irys uploads
```

The standard pipeline keeps Irys storage separate from Solana minting. This allows Devnet mint tests to use a Devnet wallet while Irys uploads continue to use a funded storage wallet.

## Devnet examples

Mint a standard NFT on Devnet:

```bash
npx tsx scripts/mintNft.ts \
  "https://gateway.irys.xyz/AGbT7cyTbatEXWzysVTnDX1mopd759V1wMiLW5mADUKe" \
  "Devnet Meme NFT" \
  --network devnet
```

Check standard NFT ownership on Devnet:

```bash
npx tsx scripts/checkNftOwner.ts \
  B4fnb5tN46DNq9q4T67VdNwsjSJrFvkAEHe2R7TCvR77 \
  --network devnet
```

The older positional RPC override remains supported:

```bash
npx tsx scripts/checkNftOwner.ts <mintAddress> <rpcUrl>
```

## Safety notes

Do not copy configuration files between networks. Edit the file inside the intended network directory instead.

Devnet uses the Helius RPC because the public Devnet RPC was unreliable for this project:

```text
https://devnet.helius-rpc.com/?api-key=74a97a81-9a82-4498-be23-d0b6b2207eca
```

Irys decentralized storage upload is network-independent for this thesis demo. It may require a real funded wallet and should not be confused with Solana Devnet mint testing. Solana minting and ownership checks can be tested on Devnet while Irys continues to use a real funded wallet for storage.

When `--mint-cnft` or `--mint-all` is used, the Java launcher checks for:

```text
config/<network>/cnft-config.json
```

If the file is missing, the launcher creates a Merkle Tree automatically with the selected Solana mint wallet and writes the config file. On Mainnet this requires enough SOL to pay for Merkle Tree account creation.

Successful launcher runs write a link report to:

```text
out/pipeline-links/latest-links.txt
```
