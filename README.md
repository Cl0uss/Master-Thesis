# Master Thesis - Transmedia Digital Content NFT Pipeline

This project is part of the master thesis:

> A Blockchain-Based Framework for the Distribution, Ownership, and Monetization of Transmedia Digital Content

The application prepares NFT-compatible metadata for digital media, uploads files and metadata to Irys decentralized storage, and can optionally mint and transfer NFTs on Solana.

## What The Project Does

The pipeline can:

- read a media file from `rawFiles/`
- detect its MIME type and content category
- calculate SHA-256 for integrity metadata
- upload the original asset to Irys
- upload a cover image for audio/document assets when required
- generate NFT-compatible JSON metadata in `metadata/`
- upload that metadata JSON to Irys
- optionally mint an NFT on Solana
- check the current owner of an NFT mint
- transfer an existing NFT to another wallet
- run the same workflow from a simple local web UI

## Requirements

Install these before running the project:

- Java JDK 17 or newer
- Node.js 20 or newer
- npm
- Git Bash, WSL, Linux, or macOS shell if you want to use `./launch` and `./ui`
- a Solana wallet keypair JSON file
- enough SOL in the wallet for Irys funding, minting, and transaction fees
- internet access to Irys and Solana RPC

The Solana CLI is not required for this project, because the scripts use Node.js libraries. It is still useful for checking balances and wallets manually.

## Installation

From the project root:

```bash
npm install
```

Check that Java and Node are available:

```bash
java -version
node -v
npm -v
```

## Project Structure

```text
config/
  app-config.json        Main configuration file

rawFiles/
  ...                    Source media files used as pipeline input

rawFiles/covers/
  ...                    Cover images for audio and document NFTs

metadata/
  ...                    Generated NFT metadata JSON files

scripts/
  uploadToIrys.ts        Uploads one file to Irys
  mintNft.ts             Mints an NFT from an uploaded metadata URI
  transferNft.ts         Transfers an existing NFT to another wallet
  checkNftOwner.ts       Finds or verifies the current NFT owner
  estimateCost.ts        Estimates upload/mint cost
  irysBalance.ts         Shows Irys balance for the wallet
  uiServer.ts            Local web UI server
  config.ts              Shared TypeScript config loader

src/
  Main.java              Main Java pipeline entry point
  functions/             Java helper classes

launch                  CLI launcher for the Java pipeline
ui                      Local UI launcher
.runtime/               Local runtime uploads, ignored by git
```

## Configuration

Main runtime settings are stored in:

```text
config/app-config.json
```

Important fields:

```json
{
  "creatorWallet": "Creator public wallet address",
  "walletPath": "Default path to the wallet keypair JSON",
  "secondWallet": "Optional second wallet used for transfer tests",
  "symbol": "NFT symbol",
  "sellerFeePercent": 5,
  "network": "mainnet-beta",
  "rpcUrl": "https://api.mainnet-beta.solana.com",
  "rawFilesDirectory": "rawFiles",
  "metadataDirectory": "metadata",
  "coverDirectory": "rawFiles/covers",
  "coverExtension": ".png"
}
```

`walletPath` points to the default owner wallet JSON. You can override it from the CLI with `--wallet` or upload a wallet JSON through the UI.

`rpcUrl` controls which Solana RPC endpoint is used for minting, owner checks, and transfers. The public endpoint `https://api.mainnet-beta.solana.com` may be slow or unstable. For reliable minting and transfers, use a dedicated mainnet RPC provider such as Helius, QuickNode, Alchemy, or another Solana RPC service.

## Wallet Safety

The wallet JSON file is a secret keypair. Anyone who has this file can sign transactions from that wallet.

Keep it private. Do not commit it to git. The UI stores uploaded wallet files under:

```text
.runtime/wallets/
```

The `.runtime/` directory is ignored by git.

## Input Files

Put source media files into:

```text
rawFiles/
```

Examples:

```text
rawFiles/pic.webp
rawFiles/bonk.mp3
rawFiles/book.pdf
```

For image files, the image itself is used as the NFT image.

For audio and document files, the pipeline also needs a cover image in:

```text
rawFiles/covers/
```

The cover filename must match the source base name and use the configured cover extension.

Example for `rawFiles/bonk.mp3`:

```text
rawFiles/covers/bonk.png
```

Example for `rawFiles/book.pdf`:

```text
rawFiles/covers/book.png
```

## CLI Usage

Run the pipeline without minting:

```bash
./launch <filename>
```

Example:

```bash
./launch pic.webp
```

This will:

1. upload the asset to Irys
2. generate metadata JSON in `metadata/`
3. upload the metadata JSON to Irys
4. print the asset URI and metadata URI
5. skip NFT minting

Run the pipeline and mint an NFT:

```bash
./launch <filename> --mint
```

Example:

```bash
./launch pic.webp --mint
```

Use a specific wallet JSON:

```bash
./launch <filename> --wallet <wallet-json-path>
```

Example:

```bash
./launch pic.webp --wallet .runtime/wallets/thesis-wallet.json
```

Use a specific wallet and mint:

```bash
./launch pic.webp --wallet .runtime/wallets/thesis-wallet.json --mint
```

## Web UI Usage

Start the local UI server:

```bash
./ui
```

By default it runs at:

```text
http://localhost:5174
```

If port `5174` is already busy, run with another port:

```bash
PORT=5175 ./ui
```

The UI allows you to:

- choose an asset file from your computer
- choose a wallet JSON file from your computer
- upload an optional cover image
- run the pipeline
- optionally mint the NFT
- check the current owner of an NFT mint
- transfer an NFT to another wallet
- see command output directly in the browser log area

The UI does not use an external backend service. It runs locally and calls the same scripts from this repository.

## Useful Scripts

Upload one file to Irys:

```bash
npx tsx scripts/uploadToIrys.ts <filePath> [walletPath]
```

Estimate cost:

```bash
npx tsx scripts/estimateCost.ts <filePath> [walletPath]
```

Check Irys balance:

```bash
npx tsx scripts/irysBalance.ts [walletPath]
```

Check current NFT owner by mint address:

```bash
npx tsx scripts/checkNftOwner.ts <mintAddress> [rpcUrl]
```

Check whether a specific wallet owns an NFT:

```bash
npx tsx scripts/checkNftOwner.ts <mintAddress> <walletAddress> [rpcUrl]
```

Transfer an NFT:

```bash
npx tsx scripts/transferNft.ts <mintAddress> <destinationWallet> [walletPath] [rpcUrl]
```

Example:

```bash
npx tsx scripts/transferNft.ts 9CLFdnBhLAWUdCmPc9GpJHieb45neuFbsPQBBZJ6jnrR EfNeambEcj1aGKfKzKpYdcdxXuzDkgAdwgQDSZfpXHSa .runtime/wallets/thesis-wallet.json https://api.mainnet-beta.solana.com
```

## Irys Funding

Before uploading, the Irys script:

1. reads the wallet JSON
2. checks the file size
3. requests the upload price from Irys
4. checks the current Irys balance
5. funds only the missing amount if the balance is too low
6. uploads the file

Funding comes from the Solana wallet keypair used by the script. The wallet must have enough SOL to pay for Irys funding and Solana transaction fees.

## NFT Owner And Transfer Workflow

Before transferring an NFT, check who owns it:

```bash
npx tsx scripts/checkNftOwner.ts <mintAddress>
```

The output shows:

```text
NFT found.
Owner: <owner-wallet-address>
Token account: <token-account-address>
Amount: 1
```

The `Owner` address should match the public key of the wallet JSON that will sign the transfer.

Then transfer the NFT:

```bash
npx tsx scripts/transferNft.ts <mintAddress> <destinationWallet> <walletPath> <rpcUrl>
```

`destinationWallet` must be a public Solana wallet address. It is not a JSON file.

`walletPath` must point to the owner wallet JSON. This file signs the transfer transaction.

## Windows Notes

The `launch` and `ui` files are shell scripts, so they work directly on Linux, macOS, WSL, and Git Bash.

On Windows without Git Bash or WSL, run the equivalent commands manually.

Compile and run the Java pipeline:

```bash
mkdir out
javac -d out src/Main.java src/functions/*.java
java -cp out Main pic.webp
```

Start the UI:

```bash
npm run ui
```

## Troubleshooting

### Solana RPC timeout or socket error

Errors like these usually mean the Solana RPC endpoint is slow, overloaded, or closed the connection:

```text
HeadersTimeoutError
UND_ERR_HEADERS_TIMEOUT
UND_ERR_SOCKET: other side closed
```

If the log stops at:

```text
[Transfer] Fetching NFT metadata from Solana RPC...
```

then the transfer has not started yet. The script is waiting for NFT metadata from the RPC endpoint.

Fix: use a dedicated mainnet RPC URL instead of the public endpoint.

### NFT does not appear in a wallet app

The NFT may still exist on-chain even if a wallet UI does not display it immediately. Check the mint address with:

```bash
npx tsx scripts/checkNftOwner.ts <mintAddress>
```

Also open the mint address in Solana Explorer.

### Audio or PDF upload stops because cover is missing

For audio and document assets, add a cover image with the same base name:

```text
rawFiles/song.mp3
rawFiles/covers/song.png
```

### Wallet file not found

Use `--wallet` or upload the wallet through the UI:

```bash
./launch pic.webp --wallet .runtime/wallets/thesis-wallet.json
```

### Irys funding takes time

Funding is an on-chain Solana transaction. It may take longer if the Solana RPC endpoint is slow. The script prints whether funding was needed and shows the transaction result.

## Validation Commands

TypeScript check:

```bash
npx tsc --noEmit
```

Java compile check:

```bash
javac -d out $(find src -name "*.java")
```

## Current Limitations

- The default RPC endpoint is public and can be unstable.
- The project currently uses a local wallet JSON file instead of browser wallet signing.
- The UI is a local helper interface, not a production hosted web application.
- NFT visibility depends on wallet/indexer support and may not appear instantly in wallet apps.
