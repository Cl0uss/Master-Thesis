# Demo Flow: Solana NFT and cNFT Token-Gated Access

This document describes the verified technical demo flow for the master thesis project:

**Blockchain-based framework for transmedia digital content distribution using Solana NFTs and Irys decentralized storage.**

The demo shows how digital content can be stored on decentralized storage, represented by Solana NFTs or compressed NFTs, transferred between wallets, and used as an access key for protected content.

---

## 1. Environment

The demo was executed on **Solana Devnet**.

### Devnet RPC

The project uses a local `rpc-config.json` file for RPC access.

Example path:

```text
config/devnet/rpc-config.json
```

The real RPC configuration is intentionally excluded from Git because it may contain private API keys.

Template files should be used instead:

```text
config/devnet/rpc-config.example.json
config/mainnet/rpc-config.example.json
```

### Devnet UI

The local UI is started with:

```bash
npm run ui:devnet
```

The UI runs at:

```text
http://localhost:5174
```

---

## 2. Wallets Used in the Demo

### Original Devnet Owner Wallet

```text
DXuExAoMpdKvYPKizMAJUm8uRvrtUTaYTkyjw698P1AC
```

This wallet was used to mint NFTs and cNFTs.

### Second Test Wallet

```text
5ajD9h5dx52yGkXeCKJ6hmjsS4W7UrcPdPtULxryT2eu
```

This wallet was used to test transfer and negative access-control cases.

---

## 3. Standard NFT Demo Flow

The standard NFT flow demonstrates basic token ownership, NFT transfer, and token-gated access.

### Standard NFT Mint Address

```text
Hc9WRxQkUKGhFAvrs12aJxtjLNrwJt6QyF7xXwTTUf5B
```

### Explorer Link

```text
https://explorer.solana.com/address/Hc9WRxQkUKGhFAvrs12aJxtjLNrwJt6QyF7xXwTTUf5B?cluster=devnet
```

---

## 4. Standard NFT Transfer

The standard NFT was transferred from the original owner wallet to the second wallet.

### Previous Owner

```text
DXuExAoMpdKvYPKizMAJUm8uRvrtUTaYTkyjw698P1AC
```

### New Owner

```text
5ajD9h5dx52yGkXeCKJ6hmjsS4W7UrcPdPtULxryT2eu
```

### Transfer Transaction

```text
4xuY63K1ukZ88UvEcszhq3t6VvAYaht8BHi6t6iMn2zVTwnjtCNpi3ikBjcfWPVAPAhyr8WuA3Ex3JvY7JC3Rhdy
```

### Transfer Transaction Explorer Link

```text
https://explorer.solana.com/tx/4xuY63K1ukZ88UvEcszhq3t6VvAYaht8BHi6t6iMn2zVTwnjtCNpi3ikBjcfWPVAPAhyr8WuA3Ex3JvY7JC3Rhdy?cluster=devnet
```

---

## 5. Standard NFT Access Test

After the transfer, the access-control logic was tested.

### Old Wallet Access

Wallet:

```text
DXuExAoMpdKvYPKizMAJUm8uRvrtUTaYTkyjw698P1AC
```

Expected result:

```text
Access Denied
```

Reason:

```text
The old wallet no longer owns the NFT.
```

### New Wallet Access

Wallet:

```text
5ajD9h5dx52yGkXeCKJ6hmjsS4W7UrcPdPtULxryT2eu
```

Expected result:

```text
Access Granted
```

Reason:

```text
The new wallet owns the NFT after transfer.
```

### Standard NFT Access Logic

The backend checks NFT ownership before returning protected content.

Simplified flow:

```text
Wallet Address
+
NFT Mint Address
↓
Backend ownership check
↓
If wallet owns NFT:
    return protected content
Else:
    deny access
```

This proves the basic thesis concept:

```text
NFT ownership = access right
```

---

## 6. Compressed NFT Demo Flow

The compressed NFT flow demonstrates scalable NFT-based access for large transmedia collections.

Compressed NFTs are used because they are more suitable for high-volume assets such as:

```text
images
songs
chapters
bonus items
collectible fragments
atomic transmedia assets
```

---

## 7. cNFT Mint Into Collection

A compressed NFT was minted into a Devnet collection.

### cNFT Asset ID

```text
67vUJ3wSxfWRusp4Tshu53iovWMhg5nXQ9ECXrPpR9gs
```

### cNFT Explorer Link

```text
https://explorer.solana.com/address/67vUJ3wSxfWRusp4Tshu53iovWMhg5nXQ9ECXrPpR9gs?cluster=devnet
```

### cNFT Mint Transaction

```text
3UKGpFax9GRkh5gv217PtcagD82RbTLW5Ucbx6ghuhkXv656pA7M2XQhWoojGBPqUSQsUKLzD9n3U9mMKE6Bus4k
```

### cNFT Mint Transaction Explorer Link

```text
https://explorer.solana.com/tx/3UKGpFax9GRkh5gv217PtcagD82RbTLW5Ucbx6ghuhkXv656pA7M2XQhWoojGBPqUSQsUKLzD9n3U9mMKE6Bus4k?cluster=devnet
```

### Merkle Tree

```text
9sAC54uk87BbXemuNCmhQMm9LEQBcQ1qsAxB4mzdKVj5
```

### Leaf Index

```text
3
```

### cNFT Collection Mint

```text
UwFdA9sFvxuMjpJoa8oaEC4CnP5oCygtaLFLBhZYF51
```

### cNFT Metadata URI

```text
https://gateway.irys.xyz/2V81SVtAZhza1DeoniPv24UVp6KDxvXFoSKR4tYQBPg3
```

---

## 8. cNFT Ownership Check

The compressed NFT ownership check uses **Helius DAS**.

The backend calls:

```text
getAsset
```

and reads:

```text
ownership.owner
compression.compressed
compression.tree
compression.leaf_id
content.metadata
content.json_uri
```

---

## 9. cNFT Positive Access Test

### Wallet

```text
DXuExAoMpdKvYPKizMAJUm8uRvrtUTaYTkyjw698P1AC
```

### cNFT Asset ID

```text
67vUJ3wSxfWRusp4Tshu53iovWMhg5nXQ9ECXrPpR9gs
```

### Result

```text
CNFT_ACCESS_STATUS=granted
ALLOWED=true
IS_COMPRESSED=true
OWNER=DXuExAoMpdKvYPKizMAJUm8uRvrtUTaYTkyjw698P1AC
```

This confirms that the real owner wallet can access protected cNFT content.

---

## 10. cNFT Negative Access Test

### Wallet

```text
5ajD9h5dx52yGkXeCKJ6hmjsS4W7UrcPdPtULxryT2eu
```

### cNFT Asset ID

```text
67vUJ3wSxfWRusp4Tshu53iovWMhg5nXQ9ECXrPpR9gs
```

### Result

```text
CNFT_ACCESS_STATUS=denied
ALLOWED=false
OWNER=DXuExAoMpdKvYPKizMAJUm8uRvrtUTaYTkyjw698P1AC
```

This confirms that a wallet which does not own the cNFT cannot access protected cNFT content.

---

## 11. UI Demo

The local UI supports the following actions:

```text
Standard NFT pipeline
Standard NFT transfer
Standard NFT access check
cNFT mint
cNFT mint into collection
cNFT access check
Protected content display
```

### Standard NFT Access UI

Input:

```text
Wallet Address
NFT Mint Address
```

Output:

```text
Access Granted
Access Denied
Protected Content
```

### Compressed NFT Access UI

Input:

```text
Wallet Address
cNFT Asset ID
```

Output:

```text
cNFT Access Granted
cNFT Access Denied
Protected cNFT Content
```

---

## 12. Final Demonstrated Architecture

The implemented proof-of-concept demonstrates two levels of NFT-based content access.

### Standard NFT Layer

Used for:

```text
baseline ownership model
NFT transfer demo
simple proof-of-concept token-gated access
proof of ownership-based content rights
```

Flow:

```text
NFT mint
↓
NFT ownership check
↓
NFT transfer
↓
old owner loses access
↓
new owner gains access
```

### Compressed NFT Layer

Used for:

```text
scalable transmedia content distribution
large collections
many images / songs / chapters / fragments
low-cost mass minting
```

Flow:

```text
Irys metadata URI
↓
cNFT mint into collection
↓
assetId discovery
↓
DAS ownership check
↓
protected cNFT access
```

---

## 13. Thesis Conclusion From the Demo

The demo proves the core idea of the thesis:

```text
Blockchain ownership can be used as a programmable access-control mechanism for decentralized digital content.
```

The standard NFT implementation validates the basic ownership and transfer model.

The compressed NFT implementation extends the same idea to a scalable model suitable for large transmedia content collections.

Final concept:

```text
Standard NFT = baseline proof-of-ownership access model
Compressed NFT = scalable distribution model for many transmedia assets
Irys = decentralized content and metadata storage
Solana = ownership and access-control layer
Backend = proof-of-concept verifier that checks blockchain ownership before serving protected content
```

---

## 14. Technical Status

Implemented and verified:

```text
Irys asset upload
Irys metadata upload
Standard NFT mint
Standard NFT transfer
Standard NFT owner check
Standard NFT token-gated access
Merkle Tree creation
Automatic Merkle Tree config creation from the main launcher
cNFT mint
cNFT mint into collection
cNFT Asset ID discovery
cNFT owner check through Helius DAS
cNFT token-gated access
UI for standard NFT flow
UI for cNFT flow
UI network separation for Mainnet and Devnet
Devnet two-wallet flow for Solana minting and Irys storage
Optional cover images for audio and document assets
Successful pipeline links report in out/pipeline-links
Devnet / Mainnet config separation
RPC secrets kept local to the demo environment
Royalty split encoded as 5% total seller fee with 80/20 creator shares
Standard NFT collection verification enforced by the Java pipeline
```

Current end-to-end Devnet launcher example:

```bash
./launch <filename> \
  --wallet .runtime/wallets/thesis-wallet-devnet.json \
  --storage-wallet .runtime/wallets/thesis-wallet.json \
  --mint \
  --mint-cnft \
  --network devnet
```

After a successful run, the generated links are saved in:

```text
out/pipeline-links/latest-links.txt
```

Remaining technical improvements:

```text
Add optional wallet signature authentication before ownership checks
Add final thesis screenshots
```
