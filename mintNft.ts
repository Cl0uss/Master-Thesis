import fs from "node:fs";

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

async function main(): Promise<void> {
    const metadataUri = process.argv[2];
    const walletPath = process.argv[3];

    if (!metadataUri || !walletPath) {
        console.error(
            "Usage: npx tsx mintNft.ts <metadataUri> <walletPath>"
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

    const mint = generateSigner(umi);

    const result = await createNft(umi, {
        mint,
        name: "Bonk Audio NFT",
        symbol: "TMDC",
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(5),
        isMutable: true
    }).sendAndConfirm(umi);

    console.log("NFT minted successfully.");
    console.log("Mint address:", mint.publicKey);
    console.log("Transaction signature:", result.signature);
}

main().catch((error) => {
    console.error("NFT mint failed:");
    console.error(error);
    process.exit(1);
});