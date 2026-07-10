# Transmedia NFT Pipeline

A blockchain-based framework for transmedia digital content distribution using **Solana NFTs**, **compressed NFTs**, and **Irys decentralized storage**.

The project demonstrates how digital media assets can be uploaded to decentralized storage, represented by NFTs or compressed NFTs on Solana, transferred between wallets, and used as programmable access keys for protected content.

The project supports both:

```text
Command-line scripts
Local web interface
```

---

## Features

Implemented features:

```text
Irys asset upload
Irys metadata upload
NFT-compatible metadata generation
Standard Solana NFT minting
Standard NFT ownership check
Standard NFT transfer
Standard NFT token-gated access
Merkle Tree creation for compressed NFTs
Compressed NFT minting
Compressed NFT minting into collection
Compressed NFT asset ID discovery
Compressed NFT ownership check through Helius DAS
Compressed NFT token-gated access
Local web UI
Devnet / Mainnet configuration separation
```

---

## Thesis Context

This project is part of a master thesis:

```text
Blockchain-based framework for transmedia digital content distribution using Solana NFTs and Irys decentralized storage.
```

The implemented proof-of-concept demonstrates two ownership-based access models:

```text
Standard NFT = baseline ownership and transfer model
Compressed NFT = scalable distribution model for large transmedia collections
```

Simplified architecture:

```text
Digital asset
↓
Irys upload
↓
Metadata generation
↓
Metadata upload to Irys
↓
Solana NFT or compressed NFT
↓
Ownership verification
↓
Token-gated protected content
```

---

## Requirements

Install the following software before running the project:

```text
Java JDK 17 or newer
Node.js 20 or newer
npm
Git
Linux, macOS, WSL, or Git Bash
```

You will also need:

```text
Solana wallet JSON file
SOL for transaction fees
Irys-compatible funded wallet for uploads
Solana RPC endpoint
Helius RPC endpoint for compressed NFT DAS queries
```

---

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Cl0uss/Master-Thesis.git
cd Master-Thesis
npm install
```

Run TypeScript check:

```bash
npm run typecheck
```

---

## Network Configuration

The project separates Mainnet and Devnet configuration.

```text
config/
    README.md
    mainnet/
        app-config.json
        collection-config.json
        rpc-config.example.json
        rpc-config.json          # local secret, ignored by Git
    devnet/
        app-config.json
        collection-config.json
        cnft-config.json
        rpc-config.example.json
        rpc-config.json          # local secret, ignored by Git
```

Real RPC files are intentionally ignored by Git:

```text
config/mainnet/rpc-config.json
config/devnet/rpc-config.json
```

Use the example files as templates:

```text
config/mainnet/rpc-config.example.json
config/devnet/rpc-config.example.json
```

Example RPC config:

```json
{
  "rpcUrl": "https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY"
}
```

---

## Helius RPC

A dedicated RPC provider is recommended because public Solana RPC endpoints can timeout or rate-limit requests.

Helius is used in this project for:

```text
Solana RPC access
compressed NFT indexing
DAS getAsset calls
cNFT ownership verification
```

Example Devnet RPC:

```text
https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY
```

Example Mainnet RPC:

```text
https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY
```

Never commit real API keys to Git.

---

## Wallet Configuration

Wallet JSON files are used to sign:

```text
Irys uploads
NFT minting
NFT transfers
cNFT minting
Merkle Tree creation
collection creation
```

Keep wallet files private.

Never upload wallet JSON files to GitHub.

Runtime wallet uploads are stored locally in:

```text
.runtime/wallets/
```

This directory must not be committed.

---

## Input Files

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

Audio and PDF files can optionally use a cover image located in:

```text
rawFiles/covers/
```

The cover image must have the same base filename as the original asset. If no
cover image is present, the pipeline continues and uses the uploaded asset URI
as the metadata image field.

Example:

```text
rawFiles/song.mp3
rawFiles/covers/song.png

rawFiles/book.pdf
rawFiles/covers/book.png
```

---

## Local Web Interface

Start the UI on Mainnet config:

```bash
npm run ui:mainnet
# or
./ui.sh
```

Start the UI on Devnet config:

```bash
npm run ui:devnet
# or
./ui.sh --dev-net
```

Default UI address:

```text
http://localhost:5174
```

If the port is already in use:

```bash
fuser -k 5174/tcp
npm run ui:devnet
```

Or run with another port:

```bash
PORT=5175 npm run ui:devnet
```

The web interface supports:

```text
asset upload
Mainnet wallet JSON upload
Devnet mint wallet JSON upload
Devnet Irys storage wallet JSON upload
optional cover image upload
standard pipeline on the selected network
standard NFT transfer
standard NFT access check
Merkle Tree creation
network collection creation
cNFT mint
cNFT mint into collection
cNFT access check
protected content display
```

In Mainnet mode the UI shows one wallet input, used for Solana minting and
storage unless a configured storage wallet is used by the command. In Devnet
mode the UI shows two wallet inputs: one Devnet wallet for Solana minting and
Merkle Tree ownership, and one funded storage wallet for Irys uploads.

---

## Standard NFT Flow

The standard NFT flow demonstrates the baseline ownership model.

```text
Asset upload
↓
Metadata generation
↓
Metadata upload
↓
Standard NFT mint
↓
Owner check
↓
NFT transfer
↓
Old owner loses access
↓
New owner gains access
```

Run standard pipeline without minting:

```bash
./launch <filename> --network devnet
```

Run standard pipeline with minting:

```bash
./launch <filename> --mint --network devnet
```

Run the main pipeline and mint a compressed NFT into the configured collection:

```bash
./launch <filename> --mint-cnft --network mainnet
```

Run the full main pipeline with both a standard NFT and a compressed NFT:

```bash
./launch <filename> --mint-all --network mainnet
```

Compressed NFT minting requires a Merkle Tree config for the selected network:

```text
config/<network>/cnft-config.json
```

When `--mint-cnft` or `--mint-all` is used, the main pipeline creates this Merkle Tree automatically if it is missing. The tree is created with the same wallet used for minting, so the wallet can act as the tree creator/delegate.

Use a custom wallet:

```bash
./launch <filename> --wallet path/to/wallet.json --mint-all --network mainnet
```

`--wallet` controls Solana minting and cNFT tree ownership. Irys uploads stay on the funded storage wallet from `config/mainnet/app-config.json` unless a separate storage wallet is explicitly provided:

```bash
./launch <filename> --wallet path/to/devnet-wallet.json --storage-wallet path/to/funded-storage-wallet.json --mint-all --network devnet
```

After a successful run, the pipeline writes a links report:

```text
out/pipeline-links/latest-links.txt
out/pipeline-links/<timestamp>-<network>-<asset>-links.txt
```

The report includes Irys asset and metadata URIs, NFT and cNFT addresses,
transactions, explorer links, Merkle Tree details, network, and wallet paths.

---

## Standard NFT Ownership Check

Check standard NFT ownership:

```bash
npx tsx scripts/checkNftOwner.ts <mintAddress> --network devnet
```

Example:

```bash
npx tsx scripts/checkNftOwner.ts Hc9WRxQkUKGhFAvrs12aJxtjLNrwJt6QyF7xXwTTUf5B --network devnet
```

---

## Standard NFT Transfer

Transfer a standard NFT:

```bash
npx tsx scripts/transferNft.ts <mintAddress> <destinationWallet> --network devnet
```

Specify the owner wallet manually:

```bash
npx tsx scripts/transferNft.ts <mintAddress> <destinationWallet> <wallet-json-path> --network devnet
```

Example:

```bash
npx tsx scripts/transferNft.ts \
  Hc9WRxQkUKGhFAvrs12aJxtjLNrwJt6QyF7xXwTTUf5B \
  5ajD9h5dx52yGkXeCKJ6hmjsS4W7UrcPdPtULxryT2eu \
  /home/user/Desktop/thesis-wallet/thesis-wallet-devnet.json \
  --network devnet
```

---

## Standard NFT Token-Gated Access

The backend verifies ownership before returning protected content. This is a proof-of-concept verifier: the demo request submits a public wallet address, and the backend checks whether that address owns the required NFT. A production version should first authenticate the wallet with a signed nonce, then run the same ownership check.

API endpoint:

```text
POST /api/access/check-nft
```

Example:

```bash
curl -X POST http://localhost:5174/api/access/check-nft \
  -H 'Content-Type: application/json' \
  -d '{
    "walletAddress":"WALLET_ADDRESS",
    "mintAddress":"NFT_MINT_ADDRESS"
  }'
```

Protected content endpoint:

```text
POST /api/protected/content
```

Standard NFT minting assigns the NFT to the configured collection and verifies that collection by default. The Java launcher no longer allows unverified collection minting silently; if collection verification fails, the mint command fails so the demo does not present an unverified NFT as part of the official collection.

---

## Compressed NFT Flow

The compressed NFT flow demonstrates scalable content distribution.

```text
Merkle Tree
↓
cNFT collection
↓
cNFT mint into collection
↓
assetId discovery
↓
DAS ownership check
↓
token-gated cNFT access
```

Compressed NFTs are intended for large transmedia collections:

```text
images
songs
chapters
cards
bonus materials
collectible fragments
atomic content items
```

---

## Create Merkle Tree

Create a Merkle Tree on Devnet:

```bash
npx tsx scripts/createMerkleTree.ts --network devnet
```

The Merkle Tree address is stored in:

```text
config/devnet/cnft-config.json
```

---

## Create Collection

Create a collection NFT for the selected network if a collection is not already configured:

```bash
npx tsx scripts/createDevnetCollectionNft.ts --network mainnet
```

The collection address is stored in:

```text
config/<network>/collection-config.json
```

---

## Mint cNFT

Mint a compressed NFT:

```bash
npx tsx scripts/mintCompressedNft.ts \
  <metadataUri> \
  "Compressed NFT Name" \
  "SYMBOL" \
  --network devnet
```

---

## Mint cNFT Into Collection

Mint a compressed NFT into the configured Devnet collection:

```bash
npx tsx scripts/mintCompressedNftToCollection.ts \
  <metadataUri> \
  "Collection cNFT Name" \
  "SYMBOL" \
  --network devnet
```

The script prints:

```text
CNFT_MINT_STATUS=success
ASSET_ID=<cNFT_ASSET_ID>
MERKLE_TREE=<MERKLE_TREE_ADDRESS>
LEAF_INDEX=<LEAF_INDEX>
OWNER=<OWNER_WALLET>
COLLECTION_MINT_ADDRESS=<COLLECTION_MINT>
TRANSACTION_SIGNATURE=<TRANSACTION_SIGNATURE>
METADATA_URI=<METADATA_URI>
```

---

## cNFT Ownership Check

Check compressed NFT ownership through Helius DAS:

```bash
npx tsx scripts/checkCompressedNftOwner.ts \
  <CNFT_ASSET_ID> \
  <WALLET_ADDRESS> \
  --network devnet
```

Example:

```bash
npx tsx scripts/checkCompressedNftOwner.ts \
  67vUJ3wSxfWRusp4Tshu53iovWMhg5nXQ9ECXrPpR9gs \
  DXuExAoMpdKvYPKizMAJUm8uRvrtUTaYTkyjw698P1AC \
  --network devnet
```

Expected positive result:

```text
CNFT_ACCESS_STATUS=granted
ALLOWED=true
IS_COMPRESSED=true
```

Expected negative result:

```text
CNFT_ACCESS_STATUS=denied
ALLOWED=false
IS_COMPRESSED=true
```

---

## cNFT Token-Gated Access

The backend checks compressed NFT ownership before returning protected cNFT content.

API endpoint:

```text
POST /api/access/check-cnft
```

Example:

```bash
curl -X POST http://localhost:5174/api/access/check-cnft \
  -H 'Content-Type: application/json' \
  -d '{
    "walletAddress":"WALLET_ADDRESS",
    "assetId":"CNFT_ASSET_ID"
  }'
```

Protected cNFT content endpoint:

```text
POST /api/protected/cnft-content
```

---

## Demo Flow Documentation

The verified demo flow is documented in:

```text
docs/demo-flow.md
```

It includes:

```text
standard NFT mint address
standard NFT transfer transaction
old owner / new owner access result
cNFT asset ID
cNFT mint transaction
Merkle Tree
cNFT collection
positive and negative cNFT access tests
```

---

## Project Structure

```text
config/
    README.md
    mainnet/
        app-config.json
        collection-config.json
        rpc-config.example.json
        rpc-config.json
    devnet/
        app-config.json
        collection-config.json
        cnft-config.json
        rpc-config.example.json
        rpc-config.json

docs/
    demo-flow.md
    network-config.md

metadata/
    Generated NFT metadata

rawFiles/
    Source media files

rawFiles/covers/
    Optional cover images

scripts/
    TypeScript scripts and utilities

scripts/ui/
    UI HTML, command runner, HTTP helpers

src/
    Java launcher application

out/pipeline-links/
    Successful pipeline link reports

.runtime/
    Temporary runtime files and uploaded wallets
```

---

## Useful Commands

Typecheck:

```bash
npm run typecheck
```

Run UI on Devnet:

```bash
npm run ui:devnet
```

Run UI on Mainnet:

```bash
npm run ui:mainnet
```

Check current UI config:

```bash
curl http://localhost:5174/api/config
```

Check standard NFT owner:

```bash
npx tsx scripts/checkNftOwner.ts <mintAddress> --network devnet
```

Check cNFT owner:

```bash
npx tsx scripts/checkCompressedNftOwner.ts <assetId> <walletAddress> --network devnet
```

---

## Troubleshooting

### Port Already in Use

If port `5174` is already in use:

```bash
fuser -k 5174/tcp
npm run ui:devnet
```

Or use another port:

```bash
PORT=5175 npm run ui:devnet
```

---

### Insufficient SOL

If minting fails with:

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

Use a dedicated RPC provider such as Helius.

---

### NFT Not Visible in Wallet

Some wallets take time to index newly minted NFTs.

Verify ownership manually:

```bash
npx tsx scripts/checkNftOwner.ts <mintAddress> --network devnet
```

or view the mint address in Solana Explorer.

---

### cNFT Not Visible in Explorer Immediately

Compressed NFTs may take time to appear in explorers or wallets.

Use the DAS ownership check:

```bash
npx tsx scripts/checkCompressedNftOwner.ts <assetId> <walletAddress> --network devnet
```

---

### Optional Cover Image

Audio and PDF assets can use a cover image, but it is not required. If no cover
image is found, the pipeline continues and uses the uploaded asset URI as the
metadata image field.

Example:

```text
rawFiles/lecture.pdf
rawFiles/covers/lecture.png
```

---

## Security

Keep local credentials and wallet files outside version control. Do not publish:

```text
config/mainnet/rpc-config.json
config/devnet/rpc-config.json
.runtime/wallets/*.json
*.json wallet files
private keys
seed phrases
real API keys
```

If a wallet JSON or RPC API key is exposed:

```text
replace the API key immediately
move funds to a new wallet if necessary
remove the secret from Git history if it was committed
```

---

## Current Technical Status

Implemented and verified:

```text
Irys asset upload
Irys metadata upload
standard NFT minting
standard NFT transfer
standard NFT ownership check
standard NFT token-gated access
Merkle Tree creation
compressed NFT minting
compressed NFT minting into collection
compressed NFT asset ID discovery
compressed NFT ownership check through Helius DAS
compressed NFT token-gated access
local UI for standard NFT and cNFT flows
Devnet / Mainnet config separation
Devnet two-wallet flow for Solana minting and Irys storage
automatic links report generation after successful pipeline runs
RPC secrets kept local to the demo environment
royalty split encoded as 5% total seller fee with 80/20 creator shares
standard NFT collection verification enforced by the Java pipeline
```

Remaining improvements:

```text
add optional wallet signature authentication before ownership checks
add UI copy buttons
add final thesis screenshots
polish final thesis demo scenario
```
