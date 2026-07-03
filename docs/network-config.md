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

`config/mainnet` and `config/devnet` are the only active configuration locations. Old root config files were removed to prevent network confusion, and all scripts use network-aware loading. Network selection accepts `--network devnet`, `--network=devnet`, `--network mainnet`, or `--network=mainnet`. The `NETWORK` environment variable is also supported. Standard NFT scripts and the UI default to Mainnet; cNFT scripts default to Devnet.

## UI

Start the Mainnet UI (the default):

```bash
npm run ui
# or
npm run ui:mainnet
```

Start the Devnet UI:

```bash
npm run ui:devnet
```

The selected network controls the UI ownership-check RPC and the Solana configuration passed to NFT/cNFT commands. The standard pipeline keeps Irys storage separate: unless a wallet is explicitly uploaded, Irys uses the real funded Mainnet-compatible wallet, while Solana minting uses the selected network wallet.

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

There is currently no `config/mainnet/cnft-config.json`. A cNFT command explicitly targeting Mainnet will stop with a clear missing-config error until a Mainnet Merkle tree is intentionally configured.
