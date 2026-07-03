# Transmedia NFT Pipeline

A blockchain-based application for storing digital assets on Irys, generating NFT metadata, minting NFTs on Solana, and transferring NFT ownership.

The project supports both a command-line interface and a local web interface.

---

# Features

* Upload digital assets to Irys
* Generate NFT-compatible metadata
* Mint NFTs on Solana
* Transfer NFT ownership
* Check NFT ownership
* Automatic Irys funding
* Web interface for local use
* Command-line interface

---

# Requirements

Install the following software before running the project:

* Java JDK 17 or newer
* Node.js 20 or newer
* npm
* Git Bash, WSL, Linux, or macOS (for `./launch` and `./ui`)

You will also need:

* a Solana wallet JSON file
* enough SOL to pay for uploads and transaction fees
* a Solana RPC endpoint

---

# Installation

Clone the repository and install all Node.js dependencies.

```bash
git clone https://github.com/Cl0uss/Master-Thesis.git
cd Master-Thesis
npm install
```

---

# RPC Configuration

The application requires a Solana RPC endpoint for minting NFTs, checking ownership, and transferring NFTs.

The public Solana RPC endpoint is intended for development and may occasionally return timeout or rate-limit errors. A dedicated RPC provider is recommended.

## Creating a Free Helius RPC

1. Visit:

```text
https://www.helius.dev
```

2. Create a free account.
3. Create a new application.
4. Select **Solana Mainnet**.
5. Copy the generated RPC URL.

It will look similar to:

```text
https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

Open the RPC file for the network you want to configure:

```text
config/mainnet/rpc-config.json
config/devnet/rpc-config.json
```

Set its RPC URL:

```json
{
    "rpcUrl": "https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY"
}
```

Network RPC config files are ignored by Git, so API keys remain private.

---

# Wallet Configuration

The wallet JSON file is used to sign uploads, NFT minting, and NFT transfers.

Keep this file private.

Never upload it to GitHub or share it with anyone.

The wallet can be provided:

* through the web interface
* with the `--wallet` command-line option

Example:

```bash
./launch picture.webp --wallet .runtime/wallets/thesis-wallet.json --mint
```

---

# Input Files

Place source files inside:

```text
rawFiles/
```

Supported formats:

| Type      | Formats                          |
| --------- | -------------------------------- |
| Images    | `.png`, `.jpg`, `.jpeg`, `.webp` |
| Audio     | `.mp3`, `.wav`                   |
| Documents | `.pdf`                           |

Audio and PDF files require a cover image located in:

```text
rawFiles/covers/
```

The cover image must have the same filename as the original asset.

Example:

```text
rawFiles/song.mp3
rawFiles/covers/song.png

rawFiles/book.pdf
rawFiles/covers/book.png
```

---

# Web Interface

Start the local web interface:

```bash
./ui
```

Then open:

```text
http://localhost:5174
```

If the default port is already in use:

```bash
PORT=5175 ./ui
```

The interface allows you to:

* upload media files
* upload a wallet JSON
* upload cover images
* estimate upload costs
* upload assets to Irys
* mint NFTs
* check NFT ownership
* transfer NFTs

---

# Command Line

Generate metadata without minting:

```bash
./launch <filename>
```

Example:

```bash
./launch picture.webp
```

Generate metadata and mint an NFT:

```bash
./launch picture.webp --mint
```

Use a custom wallet:

```bash
./launch picture.webp --wallet path/to/wallet.json
```

Mint using a custom wallet:

```bash
./launch picture.webp --wallet path/to/wallet.json --mint
```

---

# Utility Scripts

Estimate upload cost:

```bash
npx tsx scripts/estimateCost.ts <file>
```

Check Irys balance:

```bash
npx tsx scripts/irysBalance.ts
```

Check NFT ownership:

```bash
npx tsx scripts/checkNftOwner.ts <mintAddress>
```

Transfer an NFT:

```bash
npx tsx scripts/transferNft.ts <mintAddress> <destinationWallet>
```

Specify the owner wallet manually:

```bash
npx tsx scripts/transferNft.ts <mintAddress> <destinationWallet> <wallet-json-path>
```

---

# Project Structure

```text
config/
    README.md
    mainnet/
        app-config.json
        rpc-config.json
        collection-config.json
    devnet/
        app-config.json
        rpc-config.json
        collection-config.json
        cnft-config.json

metadata/
    Generated NFT metadata

rawFiles/
    Source media files

rawFiles/covers/
    Cover images

scripts/
    TypeScript utilities

src/
    Java application

.runtime/
    Temporary runtime files
```

---

# Troubleshooting

### Insufficient SOL

If minting fails with a message similar to:

```text
Transfer: insufficient lamports
```

add more SOL to the signing wallet and try again.

---

### RPC Errors

Errors such as:

```text
429 Too Many Requests
HeadersTimeoutError
UND_ERR_SOCKET
fetch failed
```

usually indicate an overloaded or slow RPC endpoint.

Using a dedicated RPC provider such as Helius is recommended.

---

### NFT Not Visible

Some wallet applications take time to index newly minted NFTs.

If the NFT is not immediately visible, verify it using:

```bash
npx tsx scripts/checkNftOwner.ts <mintAddress>
```

or view the mint address in Solana Explorer.

---

### Missing Cover Image

Audio and PDF assets require a cover image.

Example:

```text
rawFiles/lecture.pdf
rawFiles/covers/lecture.png
```

---

# Security

Do not publish:

```text
config/mainnet/rpc-config.json
config/devnet/rpc-config.json
.runtime/wallets/*.json
```

If your wallet JSON or RPC API key is exposed, replace the API key immediately and move funds to a new wallet if necessary.
