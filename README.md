# Master Thesis – Transmedia Digital Content Metadata Generator

This project is part of the master's thesis:

> A Blockchain-Based Framework for the Distribution, Ownership, and Monetization of Transmedia Digital Content

The application generates NFT-compatible metadata for digital assets and uploads media files to decentralized storage using Irys.

## Requirements

* Java 17+
* Node.js 20+
* npm

## Installation

Install Node.js dependencies:

```bash
npm install
```

## Project Structure

```text
metadata/      Generated metadata JSON files
rawFiles/      Source media files
src/           Java source code
scripts/       TypeScript scripts for Irys and Solana
```

## Generate Metadata

Place a file inside:

```text
rawFiles/
```

Run:

```bash
./launch <filename>
```

Example:

```bash
./launch bonk.mp3
./launch meme.jpeg
```

Generated metadata will be saved in:

```text
metadata/
```

## Upload File to Irys

```bash
npx tsx scripts/uploadToIrys.ts <filePath> <walletPath>
```

Example:

```bash
npx tsx scripts/uploadToIrys.ts rawFiles/bonk.mp3 ~/Desktop/thesis-wallet/thesis-wallet.json
```

The command returns a permanent Irys URL:

```text
https://gateway.irys.xyz/<transaction-id>
```

## Current Features

* SHA-256 file hashing
* MIME type detection
* Automatic metadata generation
* Audio and image support
* NFT-compatible metadata structure
* Solana wallet integration
* Decentralized file storage through Irys

```
```
