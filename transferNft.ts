import fs from "node:fs";
import bs58 from "bs58";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
    fetchDigitalAsset,
    mplTokenMetadata,
    transferV1
} from "@metaplex-foundation/mpl-token-metadata";
import {
    createSignerFromKeypair,
    keypairIdentity,
    publicKey
} from "@metaplex-foundation/umi";

async function main(): Promise<void> {
    const mintAddress = process.argv[2];
    const destinationWallet = process.argv[3];
    const walletPath = process.argv[4];

    if (!mintAddress || !destinationWallet || !walletPath) {
        console.error(
            "Usage: npx tsx transferNft.ts <mintAddress> <destinationWallet> <walletPath>"
        );
        process.exit(1);
    }

    const umi = createUmi("https://api.mainnet-beta.solana.com")
        .use(mplTokenMetadata());

    const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf8"));

    const keypair = umi.eddsa.createKeypairFromSecretKey(
        new Uint8Array(secretKey)
    );

    const signer = createSignerFromKeypair(umi, keypair);
    umi.use(keypairIdentity(signer));

    const mint = publicKey(mintAddress);
    const destination = publicKey(destinationWallet);

    const asset = await fetchDigitalAsset(umi, mint);

    const result = await transferV1(umi, {
        mint,
        authority: umi.identity,
        tokenOwner: umi.identity.publicKey,
        destinationOwner: destination,
        tokenStandard: asset.metadata.tokenStandard.value
    }).sendAndConfirm(umi);

    const signature = bs58.encode(result.signature);

    console.log("NFT transferred successfully.");
    console.log("Mint address:", mintAddress);
    console.log("New owner:", destinationWallet);
    console.log("Transaction:", signature);
    console.log(`Explorer: https://explorer.solana.com/tx/${signature}`);
}

main().catch((error) => {
    console.error("NFT transfer failed:");
    console.error(error);
    process.exit(1);
});