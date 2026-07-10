import fs from "node:fs";
import path from "node:path";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
    generateSigner,
    keypairIdentity,
    createSignerFromKeypair
} from "@metaplex-foundation/umi";

import { mplBubblegum, createTree } from "@metaplex-foundation/mpl-bubblegum";
import {
    getNetworkConfigDirectory,
    getNetworkFromArgs,
    loadAppConfig,
    loadRpcConfig,
    removeNetworkArgs,
    resolveConfigPath
} from "./config.js";

async function main(): Promise<void> {

    const cliArgs = process.argv.slice(2);
    const network = getNetworkFromArgs(cliArgs, "devnet");
    const positionalArgs = removeNetworkArgs(cliArgs);
    const appConfig = loadAppConfig(network);
    const rpcUrl = loadRpcConfig(network).rpcUrl;
    const walletPath = positionalArgs[0]
        ? resolveConfigPath(positionalArgs[0])
        : resolveConfigPath(appConfig.walletPath);

    console.log("[cNFT] Network:", network);
    console.log("[cNFT] Using RPC:", rpcUrl);
    console.log("[cNFT] Using wallet:", walletPath);

    const umi =
        createUmi(rpcUrl)
            .use(mplBubblegum());

    const secretKey =
        JSON.parse(
            fs.readFileSync(walletPath, "utf8")
        );

    const keypair =
        umi.eddsa.createKeypairFromSecretKey(
            new Uint8Array(secretKey)
        );

    const signer =
        createSignerFromKeypair(
            umi,
            keypair
        );

    umi.use(
        keypairIdentity(signer)
    );

    const merkleTree =
        generateSigner(umi);

    console.log(
        "[cNFT] Creating Merkle Tree..."
    );

    const builder =
        await createTree(umi, {
            merkleTree,
            maxDepth: 14,
            maxBufferSize: 64
        });

    await builder.sendAndConfirm(umi);

    const configPath =
        path.join(
            process.cwd(),
            getNetworkConfigDirectory(network),
            "cnft-config.json"
        );

    const config = {
        network,
        merkleTree:
            merkleTree.publicKey.toString(),
        createdAt:
            new Date().toISOString()
    };

    fs.writeFileSync(
        configPath,
        JSON.stringify(
            config,
            null,
            2
        )
    );

    console.log(
        "[cNFT] Merkle Tree created."
    );

    console.log(
        "Merkle Tree:",
        merkleTree.publicKey.toString()
    );

    console.log(
        "Config saved:",
        configPath
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
