import fs from "node:fs";
import bs58 from "bs58";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
    createNft,
    mplTokenMetadata
} from "@metaplex-foundation/mpl-token-metadata";
import {
    createSignerFromKeypair,
    generateSigner,
    keypairIdentity,
    percentAmount
} from "@metaplex-foundation/umi";

import { loadConfig, loadRpcConfig, resolveConfigPath } from "./config.js";

// Mints one NFT on Solana from an uploaded metadata URI.
async function main(): Promise<void> {
    const config = loadConfig();
    const rpcConfig = loadRpcConfig();
    const metadataUri = process.argv[2];
    const nftName = process.argv[3];
    const walletPath = process.argv[4] ?? resolveConfigPath(config.walletPath);
    const symbol = process.argv[5] ?? config.symbol;
    const rpcUrl = process.argv[6] ?? rpcConfig.rpcUrl;
    const sellerFeePercent = Number(process.argv[7] ?? config.sellerFeePercent);

    if (!metadataUri || !nftName) {
        console.error(
            "Usage: npx tsx scripts/mintNft.ts <metadataUri> <nftName> [walletPath] [symbol] [rpcUrl] [sellerFeePercent]"
        );
        process.exit(1);
    }

    console.error(`[Solana] RPC URL: ${rpcUrl}`);
    console.error(`[Solana] Reading wallet: ${walletPath}`);
    // Configure Umi with the selected Solana RPC and token metadata program.
    const umi = createUmi(rpcUrl).use(mplTokenMetadata());

    const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf8"));

    // Build the signing identity from the local wallet secret key.
    const keypair = umi.eddsa.createKeypairFromSecretKey(
        new Uint8Array(secretKey)
    );

    const signer = createSignerFromKeypair(umi, keypair);
    umi.use(keypairIdentity(signer));

    // Generate the mint account that will identify the new NFT.
    const mint = generateSigner(umi);

    console.error(`[Solana] Creating NFT: ${nftName} (${symbol})`);
    console.error(`[Solana] Seller fee: ${sellerFeePercent}%`);
    console.error(`[Solana] Metadata URI: ${metadataUri}`);
    // Submit and confirm the Metaplex create NFT transaction.
    const result = await createNft(umi, {
        mint,
        name: nftName,
        symbol,
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(sellerFeePercent),
        isMutable: true
    }).sendAndConfirm(umi);

    const signature = bs58.encode(result.signature);

    // Print machine-readable result lines for NftMinter.java to parse.
    console.error("[Solana] Mint transaction confirmed.");
    console.log(`MINT_ADDRESS=${mint.publicKey}`);
    console.log(`TRANSACTION_SIGNATURE=${signature}`);
}

main().catch((error) => {
    console.error("NFT mint failed:");
    console.error(error);
    process.exit(1);
});
