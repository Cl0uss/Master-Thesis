# Master's Thesis Manuscript

**Title:** Blockchain-Based Framework for Transmedia Digital Content Distribution Using Solana NFTs and Irys Decentralized Storage  
**Student:** Niko Kasradze  
**Degree:** Master's Thesis  
**Repository / Prototype:** Master-Thesis  

---

# 1. First Page: Final Mark Form

This page is reserved for the official final mark form included in the annex provided by the university/supervisor.

> Insert the official final mark form here before exporting the final manuscript to PDF.

---

# 2. Index

1. First Page: Final Mark Form  
2. Index  
3. Summary  
   3.1. Resumen en espanol  
   3.2. Summary in English  
4. Body of the Master's Thesis  
   4.1. Introduction  
   4.2. State of the Art  
   4.3. Description  
   4.4. Experiments  
   4.5. Budget  
5. References  
6. Annexes  

---

# 3. Summary

## 3.1. Resumen en espanol

Este Trabajo Fin de Master presenta un marco basado en blockchain para la distribucion de contenido digital transmedia mediante NFTs y NFTs comprimidos en Solana, junto con almacenamiento descentralizado en Irys/Arweave. El objetivo principal es demostrar como diferentes tipos de activos digitales, como libros, imagenes y musica, pueden publicarse como elementos verificables, transferibles y utilizables como claves de acceso a contenido protegido.

El prototipo desarrollado automatiza el flujo completo de publicacion: preparacion del archivo, calculo de integridad mediante SHA-256, generacion de metadatos compatibles con Metaplex, subida del activo y de los metadatos a Irys, creacion de NFTs estandar, creacion de arboles Merkle para NFTs comprimidos, minteo de cNFTs dentro de una coleccion y verificacion de propiedad mediante RPC y Helius DAS. Tambien se implementa una interfaz web local para ejecutar los procesos principales y probar el acceso condicionado por propiedad.

La solucion diferencia entre NFTs estandar, adecuados para activos principales como el libro o paquetes de alto valor, y NFTs comprimidos, adecuados para colecciones grandes de imagenes, canciones o fragmentos transmedia. Los experimentos en Devnet validan el minteo, la verificacion de coleccion, la transferencia de propiedad y el control de acceso basado en la posesion del NFT o cNFT. El resultado es una prueba de concepto funcional que demuestra la viabilidad tecnica de usar Solana como capa de propiedad y verificacion para la distribucion programable de contenido digital.

## 3.2. Summary in English

This Master's Thesis presents a blockchain-based framework for transmedia digital content distribution using Solana NFTs, compressed NFTs, and decentralized storage through Irys/Arweave. The main objective is to demonstrate how different digital assets, such as books, images, and music, can be published as verifiable and transferable blockchain assets that also act as access keys for protected content.

The implemented prototype automates the full publication workflow: source asset preparation, SHA-256 integrity calculation, Metaplex-compatible metadata generation, asset and metadata upload to Irys, standard NFT minting, Merkle tree creation for compressed NFTs, cNFT minting into a collection, and ownership verification through Solana RPC and Helius DAS. A local web interface is also provided to execute the main flows and test token-gated access.

The system distinguishes between standard NFTs, which are suitable for core assets such as a book or high-value bundles, and compressed NFTs, which are better suited for large sets of images, songs, chapters, or collectible fragments. Devnet experiments validate NFT minting, collection verification, ownership transfer, and access control based on NFT or cNFT ownership. The result is a functional proof of concept showing that Solana can be used as an ownership and verification layer for programmable digital content distribution.

---

# 4. Body of the Master's Thesis

## 4.1. Introduction

Digital content distribution has traditionally depended on centralized platforms that control hosting, access, visibility, monetization, and user identity. This model is convenient, but it creates several limitations for authors and audiences. Creators often depend on platform-specific rules, payment systems, and recommendation mechanisms, while users usually receive only a platform-bound license rather than a portable proof of ownership or access.

Transmedia projects amplify this problem because they are not limited to one file or one medium. A single creative work may include a book, images, music, chapters, bonus materials, collectible items, and future extensions. Managing these assets as a coherent digital collection requires a structure that supports hierarchy, authenticity, ownership, transferability, and controlled access.

Blockchain technology offers a possible alternative by representing digital ownership through tokens. In particular, non-fungible tokens can provide a public and verifiable record of ownership for unique or semi-unique digital assets. However, blockchain systems should not store large media files directly on-chain because this is inefficient and expensive. A practical architecture therefore needs to combine on-chain ownership with decentralized off-chain storage.

This thesis explores such a hybrid approach using Solana as the blockchain layer, Metaplex metadata conventions for NFT representation, compressed NFTs for scalable distribution, and Irys/Arweave for decentralized storage. The proposed framework is designed for a manageable thesis scope: a book, images, and music files grouped under a single collection and distributed through standard NFTs and compressed NFTs.

The main research question is:

> Can Solana NFTs and compressed NFTs be used as a practical framework for publishing, organizing, transferring, and controlling access to transmedia digital content?

The objectives of the work are:

- Define a structured NFT publication model for transmedia assets.
- Generate standardized metadata compatible with Metaplex conventions.
- Store source assets and metadata through decentralized storage.
- Mint standard NFTs for core assets and compressed NFTs for scalable collections.
- Group assets under a verified collection.
- Demonstrate ownership checks, transfer, and token-gated access.
- Estimate implementation and deployment costs.

The contribution of this thesis is a working proof-of-concept pipeline that connects digital asset preparation, decentralized storage, NFT minting, collection verification, and ownership-based access control.

## 4.2. State of the Art

### Blockchain and Digital Ownership

A blockchain is a distributed ledger that stores transactions in a verifiable and tamper-resistant way. In the context of digital media, blockchain systems can be used to represent ownership, provenance, and transfer history. Instead of relying only on a platform database, ownership can be checked through public network state.

NFTs extend this idea by representing unique digital assets. Unlike fungible tokens, where every unit is equivalent, NFTs can point to specific metadata and media resources. This makes them suitable for digital collectibles, art, membership passes, and access rights.

### Solana

Solana is a high-throughput blockchain designed for low transaction fees and fast confirmation. These properties make it relevant for media distribution scenarios where many assets may need to be minted or transferred. Solana accounts and programs provide the base execution model, while token standards and NFT metadata are commonly implemented through ecosystem protocols.

### Metaplex NFT Metadata

Metaplex provides widely used conventions and programs for NFTs on Solana. A typical NFT includes an on-chain mint and metadata account, while the metadata URI points to an off-chain JSON file. This JSON file usually includes fields such as name, symbol, description, image, animation URL, attributes, seller fee basis points, and creator shares.

This separation between on-chain ownership and off-chain metadata is central to the architecture of this thesis. The blockchain proves ownership, while the metadata describes the asset and links to decentralized storage.

### Decentralized Storage: Arweave and Irys

Large media files are not stored directly on-chain. Arweave provides persistent decentralized storage, and Irys acts as an upload and payment layer that can publish data to Arweave-compatible storage. In this project, both original assets and generated metadata JSON files are uploaded to Irys, and their gateway URLs are then used in NFT metadata.

### Compressed NFTs

Compressed NFTs reduce the cost of minting large numbers of NFTs by using Merkle tree compression. Instead of creating the same amount of on-chain account data as standard NFTs, compressed NFTs rely on compressed state and indexing services. This makes them suitable for high-volume collections such as image sets, songs, chapters, cards, or bonus fragments.

The trade-off is that cNFT ownership checks usually require specialized indexing support. In this prototype, Helius DAS is used to retrieve compressed NFT data and verify ownership.

### Token-Gated Access

Token-gated access is an access-control model where a user receives protected content only if they own a specific token. In this thesis prototype, the backend checks whether a submitted wallet address owns a required standard NFT or compressed NFT. This demonstrates the concept of blockchain ownership as an access key. A production system should add wallet signature authentication before returning protected content.

## 4.3. Description

### System Overview

The implemented system is a local proof-of-concept pipeline for publishing transmedia content as Solana NFTs and compressed NFTs. It combines Java scripts, TypeScript scripts, Solana RPC access, Irys uploads, Metaplex NFT minting, Helius DAS ownership checks, and a local web interface.

The high-level workflow is:

```text
Digital asset
-> integrity hash and MIME detection
-> Metaplex-compatible metadata JSON
-> upload asset to Irys
-> upload metadata to Irys
-> mint NFT or cNFT on Solana
-> assign asset to collection
-> verify ownership
-> return protected content if ownership is valid
```

### Asset Model

The publication model separates assets into several conceptual tiers:

- Core assets: high-value or central items, such as a book.
- Bundle assets: grouped content, such as chapters or media packs.
- Atomic assets: individual images, songs, or fragments.

Standard NFTs are used for important core assets or assets where wallet compatibility and prestige are more important. Compressed NFTs are used for larger datasets where minting cost and scalability are more important.

### Metadata Generation

The Java pipeline generates metadata JSON files compatible with common Metaplex conventions. Metadata includes:

- asset name and symbol;
- description;
- image or animation URL;
- seller fee basis points;
- content attributes;
- hierarchy level;
- access tier;
- original filename;
- MIME type;
- file size;
- SHA-256 hash;
- creator royalty split.

The current royalty model uses a total seller fee of 5%, distributed through creator shares as 80% for the main creator and 20% for the student. This represents the required 4% and 1% split within the 5% total royalty.

### Decentralized Storage

Original assets and metadata files are uploaded to Irys. The resulting gateway URLs are inserted into metadata or used directly by minting scripts. Audio and document files use a cover image for the metadata image field, while the original file is linked through `animation_url` or `external_url`.

### Standard NFT Pipeline

The standard NFT pipeline is executed through the `launch` script. It performs the following steps:

1. Load the selected network configuration.
2. Validate the input file.
3. Detect MIME type and category.
4. Calculate SHA-256 hash and file size.
5. Upload the original asset to Irys.
6. Upload a cover image if required.
7. Generate metadata JSON.
8. Upload metadata JSON to Irys.
9. Mint a standard NFT when `--mint` is provided.
10. Assign the NFT to the configured collection.
11. Verify the collection on-chain.

Collection verification uses a collection authority record and retry logic because newly created metadata may not be immediately available through the RPC path used by the verification instruction.

### Compressed NFT Pipeline

The compressed NFT pipeline includes:

1. Merkle tree creation.
2. cNFT minting.
3. cNFT minting into a collection.
4. Asset ID discovery through transaction parsing or Helius DAS fallback.
5. Ownership verification through DAS `getAsset`.

Compressed NFTs are used to demonstrate scalability for larger transmedia collections.

### Ownership Verification

Standard NFT ownership is checked through Solana token accounts. The script finds the token account holding one unit of the NFT mint and reads the owner of that token account.

Compressed NFT ownership is checked through Helius DAS. The backend retrieves the asset by asset ID and reads fields such as owner, compression status, tree, leaf index, metadata name, symbol, and metadata URI.

### Local Web Interface

The local UI exposes the main flows through HTTP endpoints and a browser interface. It supports asset upload, optional wallet upload, standard NFT pipeline execution, transfer, access checks, Merkle tree creation, cNFT minting, and protected content display.

The UI is designed for local demonstration. It is not intended to be exposed publicly without authentication, file-upload hardening, and wallet signature login.

### Security Model

The implemented token-gated access model is a proof of concept. It checks ownership for a submitted wallet address. For a production system, the backend should require a wallet signature challenge:

1. The backend creates a one-time nonce.
2. The wallet signs the nonce.
3. The backend verifies the signature.
4. The backend checks NFT or cNFT ownership.
5. Protected content is returned only if both checks pass.

## 4.4. Experiments

### Experiment Environment

The experiments were executed on Solana Devnet. Devnet was selected because it allows testing minting, transfers, collection verification, and access control without spending mainnet SOL for transaction fees. Irys uploads use the configured local storage wallet.

The implementation was tested with:

- Java JDK 17 or newer;
- Node.js 20 or newer;
- TypeScript scripts executed with `tsx`;
- Solana RPC through Helius;
- Irys decentralized upload service;
- local browser UI.

### Experiment 1: Metadata Generation and Irys Upload

A small image file was processed through the Java pipeline. The system detected its MIME type, calculated SHA-256 integrity data, generated metadata JSON, uploaded the asset to Irys, and uploaded the metadata file to Irys.

Result:

- Asset upload completed successfully.
- Metadata upload completed successfully.
- Generated metadata contained the expected content fields and creator royalty split.

### Experiment 2: Standard NFT Minting and Collection Verification

A standard NFT was minted on Devnet using an already uploaded metadata URI. The NFT was assigned to the configured collection and verified on-chain.

Observed result:

```text
MINT_ADDRESS=A3E5ckqX8Y9rRwQ12H5FW2159kLtmc2wPDPqhKqsigYy
TRANSACTION_SIGNATURE=57iukjivuAXeSTaJS8qvvKzhFtPX7AwHTcoAjWEQXP5e4iP9h1fAwxj8e6YRHwEuoJtFLbQuSc1pWqyYR8ZSYFuV
COLLECTION_MINT_ADDRESS=UwFdA9sFvxuMjpJoa8oaEC4CnP5oCygtaLFLBhZYF51
COLLECTION_VERIFICATION_SIGNATURE=5NnYLNdvdKiFdJMWcNcc6w14H8ZcCqX8qeMFmqkW5gxMy8L91LxTXDTcZ9yrwvJkRDZ9rjcxGKkoEeFPC6njTVaC
COLLECTION_VERIFICATION_STATUS=verified
NFT_MINT_STATUS=success
```

The experiment revealed that collection verification may fail immediately after minting because the fresh metadata state is not always ready for the verification instruction. This was solved by adding retry and backoff logic.

### Experiment 3: Standard NFT Ownership Check

The ownership check script was executed against the newly minted NFT.

Observed result:

```text
Mint: A3E5ckqX8Y9rRwQ12H5FW2159kLtmc2wPDPqhKqsigYy
Owner: DXuExAoMpdKvYPKizMAJUm8uRvrtUTaYTkyjw698P1AC
```

This confirms that the system can resolve the current NFT owner on Devnet.

### Experiment 4: Transfer and Access Change

The standard NFT transfer flow demonstrates that access rights follow ownership. After transfer, the previous owner should lose access and the new owner should gain access. This validates the thesis concept that NFT ownership can act as a programmable access right.

### Experiment 5: Compressed NFT Minting and Access Check

A compressed NFT was minted into a collection and checked through Helius DAS. The DAS response provided the owner, compression status, Merkle tree, leaf index, and metadata URI. A positive ownership case returned access granted, while a different wallet returned access denied.

### Experiment Results Summary

The experiments show that:

- assets can be uploaded to decentralized storage;
- metadata can be generated automatically;
- standard NFTs can be minted and verified inside a collection;
- ownership can be resolved after minting and transfer;
- compressed NFTs can represent scalable transmedia items;
- token-gated access can be demonstrated through backend ownership checks.

The main limitation is that the current access-control demo verifies ownership of a submitted public wallet address but does not yet authenticate wallet control through a signed challenge.

## 4.5. Budget

The budget is divided into development costs, storage costs, and blockchain transaction costs. Devnet testing is free in terms of real SOL fees, but mainnet deployment requires funded wallets for transaction fees and storage uploads.

### Development Environment

| Item | Cost |
| --- | ---: |
| Java JDK | 0 EUR |
| Node.js and npm | 0 EUR |
| Git | 0 EUR |
| Solana tooling / SDK libraries | 0 EUR |
| Local development machine | Existing equipment |

### Devnet Testing

| Item | Estimated Cost |
| --- | ---: |
| Devnet SOL transaction fees | 0 EUR |
| Devnet NFT mint testing | 0 EUR |
| Devnet cNFT testing | 0 EUR |

### Mainnet Prototype Scope

| Item | Estimated Cost |
| --- | ---: |
| Standard NFT minting for core assets | Low, depends on number of NFTs |
| cNFT minting for images/songs | Very low per item |
| Irys/Arweave storage uploads | Depends on file size |
| RPC provider | Free tier or paid plan depending on usage |
| Total thesis-scope estimate | Approximately 5-10 EUR |

### Full Project Estimate

For a larger deployment with a book, multiple images, songs, bundles, and collection assets, the expected cost remains moderate because compressed NFTs reduce large-scale minting costs. A reasonable estimate for a small full project is approximately 15-30 EUR plus storage costs, depending on final file sizes and network conditions.

---

# 5. References

[1] Solana Documentation. Solana blockchain documentation and developer guides.  
[2] Metaplex Documentation. Token Metadata and Bubblegum compressed NFT documentation.  
[3] Irys Documentation. Decentralized data upload and storage documentation.  
[4] Helius Documentation. DAS API documentation for compressed NFT indexing and ownership checks.  
[5] Arweave Documentation. Permanent decentralized storage documentation.  

---

# 6. Annexes

## Annex A: Final Mark Form

Insert the official final mark form provided by the university/supervisor.

## Annex B: Demo Commands

```bash
npm run typecheck
javac -d /tmp/master-thesis-out $(find src -name "*.java")
./launch pic.webp --mint --network devnet
npx tsx scripts/checkNftOwner.ts A3E5ckqX8Y9rRwQ12H5FW2159kLtmc2wPDPqhKqsigYy --network devnet
```

## Annex C: Repository Structure

```text
config/                  Network-specific runtime configuration
rawFiles/                Source media assets
metadata/                Generated NFT metadata JSON files
src/                     Java pipeline implementation
scripts/                 TypeScript Solana, Irys, cNFT, and UI scripts
docs/                    Technical documentation and demo flow
```
