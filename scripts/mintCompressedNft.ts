import fs from "node:fs";
import bs58 from "bs58";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
    createSignerFromKeypair,
    keypairIdentity,
    none,
    publicKey,
    some
} from "@metaplex-foundation/umi";

import {
    findLeafAssetIdPda,
    mintV1,
    mplBubblegum,
    parseLeafFromMintV1Transaction,
    TokenProgramVersion,
    TokenStandard
} from "@metaplex-foundation/mpl-bubblegum";

import {
    getNetworkFromArgs,
    loadAppConfig,
    loadCnftConfig,
    loadRpcConfig,
    removeNetworkArgs,
    resolveConfigPath
} from "./config.js";

async function main(): Promise<void> {
    const cliArgs = process.argv.slice(2);
    const network = getNetworkFromArgs(cliArgs, "devnet");
    const positionalArgs = removeNetworkArgs(cliArgs);

    const metadataUri = positionalArgs[0];
    const appConfig = loadAppConfig(network);
    const name = positionalArgs[1] ?? "Compressed NFT";
    const symbol = positionalArgs[2] ?? appConfig.symbol;

    if (!metadataUri) {
        console.error(
            "Usage: npx tsx scripts/mintCompressedNft.ts <metadataUri> [name] [symbol] [--network devnet|mainnet]"
        );
        process.exit(1);
    }

    const rpcUrl = loadRpcConfig(network).rpcUrl;
    const walletPath = resolveConfigPath(appConfig.walletPath);
    const cnftConfig = loadCnftConfig(network);
    const merkleTree = publicKey(cnftConfig.merkleTree);

    console.log("[cNFT] Network:", network);
    console.log("[cNFT] Using RPC:", rpcUrl);
    console.log("[cNFT] Using wallet:", walletPath);
    console.log("[cNFT] Merkle Tree:", cnftConfig.merkleTree);
    console.log("[cNFT] Metadata URI:", metadataUri);

    const umi = createUmi(rpcUrl).use(mplBubblegum());

    const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf8"));

    const keypair = umi.eddsa.createKeypairFromSecretKey(
        new Uint8Array(secretKey)
    );

    const signer = createSignerFromKeypair(umi, keypair);
    umi.use(keypairIdentity(signer));

    const result = await mintV1(umi, {
        leafOwner: umi.identity.publicKey,
        leafDelegate: umi.identity.publicKey,
        merkleTree,
        payer: umi.identity,
        treeCreatorOrDelegate: umi.identity,
        metadata: {
            name,
            symbol,
            uri: metadataUri,
            sellerFeeBasisPoints: appConfig.sellerFeePercent * 100,
            primarySaleHappened: false,
            isMutable: true,
            editionNonce: none(),
            tokenStandard: some(TokenStandard.NonFungible),
            collection: none(),
            uses: none(),
            tokenProgramVersion: TokenProgramVersion.Original,
            creators: [
                {
                    address: umi.identity.publicKey,
                    verified: false,
                    share: 100
                }
            ]
        }
    }).sendAndConfirm(umi);

    const signature = bs58.encode(result.signature);

    console.log("[cNFT] Mint transaction confirmed.");
    console.log("[cNFT] Parsing minted leaf from transaction...");

    const leaf = await parseLeafFromMintV1Transaction(umi, result.signature);

    const assetId = findLeafAssetIdPda(umi, {
        merkleTree,
        leafIndex: leaf.nonce
    })[0];

    console.log("[cNFT] Mint completed.");
    console.log("Transaction:", signature);
    console.log("Asset ID:", assetId);

    const clusterQuery = network === "devnet" ? "?cluster=devnet" : "";

    console.log(`Explorer: https://explorer.solana.com/tx/${signature}${clusterQuery}`);
    console.log(`Asset Explorer: https://explorer.solana.com/address/${assetId}${clusterQuery}`);

    console.log(`CNFT_MINT_STATUS=success`);
    console.log(`ASSET_ID=${assetId}`);
    console.log(`MERKLE_TREE=${merkleTree}`);
    console.log(`LEAF_INDEX=${leaf.nonce}`);
    console.log(`OWNER=${umi.identity.publicKey}`);
    console.log(`TRANSACTION_SIGNATURE=${signature}`);
    console.log(`METADATA_URI=${metadataUri}`);
}

main().catch((error) => {
    console.error("[cNFT] Mint failed:");
    console.error(error);
    process.exit(1);
});