import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getNftOwner } from "./checkNftOwner.js";
import {
    getNetworkFromArgs,
    loadAppConfig,
    loadRpcConfig,
    resolveConfigPath
} from "./config.js";
import { getHtml } from "./ui/html.js";
import { runCommand } from "./ui/commandRunner.js";
import {
    readRequestBody,
    sanitizeFilename,
    sendJson
} from "./ui/httpHelpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const port = Number(process.env.PORT ?? 5174);
const network = getNetworkFromArgs(process.argv.slice(2));

type CompressedNftAccessResult = {
    allowed: boolean;
    owner: string;
    assetId: string;
    walletAddress: string;
    isCompressed: boolean;
    tree: string;
    leafId: string;
    name: string;
    symbol: string;
    metadataUri: string;
};

type HeliusAssetResponse = {
    result?: {
        id?: string;
        content?: {
            json_uri?: string;
            metadata?: {
                name?: string;
                symbol?: string;
            };
        };
        ownership?: {
            owner?: string;
        };
        compression?: {
            compressed?: boolean;
            tree?: string;
            leaf_id?: number;
        };
    };
    error?: {
        code: number;
        message: string;
    };
};

function ensureDirectory(directoryPath: string): void {
    fs.mkdirSync(directoryPath, { recursive: true });
}

function parseJsonBody(buffer: Buffer): Record<string, unknown> {
    if (buffer.length === 0) {
        return {};
    }

    return JSON.parse(buffer.toString("utf8"));
}

function getStringField(
    body: Record<string, unknown>,
    key: string,
    fallback = ""
): string {
    const value = body[key];
    return typeof value === "string" ? value : fallback;
}

function getBooleanField(
    body: Record<string, unknown>,
    key: string,
    fallback = false
): boolean {
    const value = body[key];
    return typeof value === "boolean" ? value : fallback;
}

function isProbablyPublicKey(value: string): boolean {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

async function verifyStandardNftAccess(
    walletAddress: string,
    mintAddress: string
): Promise<{
    allowed: boolean;
    owner: string;
}> {
    const owner = await getNftOwner(mintAddress, { network });

    return {
        allowed: owner === walletAddress,
        owner
    };
}

async function getHeliusAsset(assetId: string): Promise<HeliusAssetResponse> {
    const rpcUrl = loadRpcConfig(network).rpcUrl;

    const response = await fetch(rpcUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "ui-check-cnft-owner",
            method: "getAsset",
            params: {
                id: assetId
            }
        })
    });

    if (!response.ok) {
        throw new Error(
            `Helius DAS request failed with HTTP ${response.status}: ${await response.text()}`
        );
    }

    return (await response.json()) as HeliusAssetResponse;
}

async function verifyCompressedNftAccess(
    walletAddress: string,
    assetId: string
): Promise<CompressedNftAccessResult> {
    if (!isProbablyPublicKey(assetId)) {
        throw new Error(
            "Invalid cNFT Asset ID. Use only the cNFT asset address, not a Solana Explorer URL."
        );
    }

    if (!isProbablyPublicKey(walletAddress)) {
        throw new Error(
            "Invalid wallet address. Use only the wallet public key, not a Solana Explorer URL."
        );
    }

    const asset = await getHeliusAsset(assetId);

    if (asset.error) {
        throw new Error(`Helius DAS error ${asset.error.code}: ${asset.error.message}`);
    }

    if (!asset.result) {
        throw new Error("Helius DAS returned no asset result.");
    }

    const owner = asset.result.ownership?.owner;

    if (!owner) {
        throw new Error("Could not determine cNFT owner from DAS response.");
    }

    const isCompressed = asset.result.compression?.compressed === true;

    return {
        allowed: owner === walletAddress,
        owner,
        assetId,
        walletAddress,
        isCompressed,
        tree: asset.result.compression?.tree ?? "",
        leafId: asset.result.compression?.leaf_id?.toString() ?? "",
        name: asset.result.content?.metadata?.name ?? "",
        symbol: asset.result.content?.metadata?.symbol ?? "",
        metadataUri: asset.result.content?.json_uri ?? ""
    };
}

function buildProtectedDemoContent(
    walletAddress: string,
    mintAddress: string,
    owner: string
): Record<string, unknown> {
    return {
        title: "Protected Thesis Content",
        subtitle: "Token-gated access demo for standard Solana NFT holders.",
        nft: {
            walletAddress,
            mintAddress,
            owner
        },
        sections: [
            {
                title: "Full Book Access",
                body:
                    "This section represents the full book/PDF content. In the final project, the public UI may show only a preview, while this protected area is available only to NFT holders."
            },
            {
                title: "Music / Image Bundle Access",
                body:
                    "This section represents additional transmedia assets such as songs, images, or chapter bundles connected to the NFT collection."
            },
            {
                title: "Access Logic",
                body:
                    "The backend re-checks NFT ownership before returning protected content. The user interface alone does not unlock the content."
            }
        ]
    };
}

function buildProtectedCompressedNftContent(
    access: CompressedNftAccessResult
): Record<string, unknown> {
    return {
        title: "Protected cNFT Thesis Content",
        subtitle: "Token-gated access demo for compressed NFT holders.",
        cnft: {
            walletAddress: access.walletAddress,
            assetId: access.assetId,
            owner: access.owner,
            tree: access.tree,
            leafId: access.leafId,
            name: access.name,
            symbol: access.symbol,
            metadataUri: access.metadataUri
        },
        sections: [
            {
                title: "Compressed NFT Access",
                body:
                    "This content is unlocked because the requested wallet owns the compressed NFT asset."
            },
            {
                title: "Scalable Distribution Model",
                body:
                    "Compressed NFTs are used as a scalable model for distributing many transmedia items such as images, music, chapters, or collectible fragments."
            },
            {
                title: "DAS Ownership Verification",
                body:
                    "The backend verifies compressed NFT ownership through the Helius DAS getAsset method before returning protected content."
            }
        ]
    };
}

async function handleUpload(
    request: http.IncomingMessage,
    response: http.ServerResponse,
    url: URL
): Promise<void> {
    const config = loadAppConfig(network);
    const kind = url.searchParams.get("kind") ?? "";
    const originalFilename = url.searchParams.get("filename") ?? "upload.bin";
    const filename = sanitizeFilename(originalFilename);
    const assetFilename = sanitizeFilename(url.searchParams.get("assetFilename") ?? "");
    const body = await readRequestBody(request);

    if (!body.length) {
        sendJson(response, { error: "Uploaded file is empty." }, 400);
        return;
    }

    let outputPath: string;
    let returnedFilename = filename;

    if (kind === "asset") {
        const rawFilesDirectory = path.resolve(projectRoot, config.rawFilesDirectory);
        ensureDirectory(rawFilesDirectory);
        outputPath = path.join(rawFilesDirectory, filename);
    } else if (kind === "cover") {
        if (!assetFilename) {
            sendJson(response, { error: "Missing assetFilename for cover upload." }, 400);
            return;
        }

        const coverDirectory = path.resolve(projectRoot, config.coverDirectory);
        ensureDirectory(coverDirectory);

        const assetBaseName = path.basename(
            assetFilename,
            path.extname(assetFilename)
        );

        returnedFilename = `${assetBaseName}${config.coverExtension}`;
        outputPath = path.join(coverDirectory, returnedFilename);
    } else if (kind === "wallet") {
        const walletDirectory = path.resolve(projectRoot, ".runtime", "wallets");
        ensureDirectory(walletDirectory);
        outputPath = path.join(walletDirectory, filename);
    } else {
        sendJson(response, { error: `Unsupported upload kind: ${kind}` }, 400);
        return;
    }

    fs.writeFileSync(outputPath, body);

    sendJson(response, {
        kind,
        filename: returnedFilename,
        path: outputPath
    });
}

async function handleRun(
    request: http.IncomingMessage,
    response: http.ServerResponse
): Promise<void> {
    const body = parseJsonBody(await readRequestBody(request));
    const filename = sanitizeFilename(getStringField(body, "filename"));
    const walletPath = getStringField(body, "walletPath");
    const storageWalletPath = getStringField(body, "storageWalletPath");
    const networkOverride = getStringField(body, "network").trim();
    const shouldMint = getBooleanField(body, "mint");
    const shouldMintCompressedNft = getBooleanField(body, "mintCompressedNft");

    if (!filename) {
        sendJson(response, { error: "Missing filename." }, 400);
        return;
    }

    if (networkOverride && networkOverride !== "devnet" && networkOverride !== "mainnet") {
        sendJson(response, { error: `Unsupported network override: ${networkOverride}` }, 400);
        return;
    }

    const args = ["./launch", filename];

    if (walletPath) {
        args.push("--wallet", walletPath);
    }

    if (storageWalletPath) {
        args.push("--storage-wallet", storageWalletPath);
    }

    if (shouldMint) {
        args.push("--mint");
    }

    if (shouldMintCompressedNft) {
        args.push("--mint-cnft");
    }

    const selectedNetwork = networkOverride || network;

    args.push("--network", selectedNetwork);

    runCommand(response, args, "Main pipeline", projectRoot);
}

async function handleCnftCommand(
    request: http.IncomingMessage,
    response: http.ServerResponse,
    scriptName: string,
    label: string,
    needsMetadata = false
): Promise<void> {
    const body = parseJsonBody(await readRequestBody(request));
    const args = ["npx", "tsx", `scripts/${scriptName}`];

    if (needsMetadata) {
        const metadataUri = getStringField(body, "metadataUri").trim();
        const name = getStringField(body, "name", "Compressed NFT").trim();

        if (!metadataUri) {
            sendJson(response, { error: "Missing metadataUri." }, 400);
            return;
        }

        args.push(metadataUri);

        if (name) {
            args.push(name);
        }
    }

    args.push("--network", network);

    runCommand(response, args, label, projectRoot);
}

async function handleCheckNftAccess(
    request: http.IncomingMessage,
    response: http.ServerResponse
): Promise<void> {
    const body = parseJsonBody(await readRequestBody(request));

    const walletAddress = getStringField(body, "walletAddress").trim();
    const mintAddress = getStringField(body, "mintAddress").trim();

    if (!walletAddress) {
        sendJson(response, { error: "Missing walletAddress." }, 400);
        return;
    }

    if (!mintAddress) {
        sendJson(response, { error: "Missing mintAddress." }, 400);
        return;
    }

    const access = await verifyStandardNftAccess(
        walletAddress,
        mintAddress
    );

    sendJson(response, {
        allowed: access.allowed,
        owner: access.owner,
        walletAddress,
        mintAddress,
        content: access.allowed
            ? {
                  title: "Protected Thesis Content",
                  message: "Access granted. This wallet owns the required NFT.",
                  demoEndpoint: "/api/protected/content"
              }
            : null
    });
}

async function handleCheckCompressedNftAccess(
    request: http.IncomingMessage,
    response: http.ServerResponse
): Promise<void> {
    const body = parseJsonBody(await readRequestBody(request));

    const walletAddress = getStringField(body, "walletAddress").trim();
    const assetId = getStringField(body, "assetId").trim();

    if (!walletAddress) {
        sendJson(response, { error: "Missing walletAddress." }, 400);
        return;
    }

    if (!assetId) {
        sendJson(response, { error: "Missing assetId." }, 400);
        return;
    }

    const access = await verifyCompressedNftAccess(walletAddress, assetId);

    sendJson(response, {
        allowed: access.allowed,
        owner: access.owner,
        walletAddress,
        assetId,
        isCompressed: access.isCompressed,
        tree: access.tree,
        leafId: access.leafId,
        name: access.name,
        symbol: access.symbol,
        metadataUri: access.metadataUri,
        content: access.allowed
            ? {
                  title: "Protected cNFT Thesis Content",
                  message: "Access granted. This wallet owns the required compressed NFT.",
                  demoEndpoint: "/api/protected/cnft-content"
              }
            : null
    });
}

async function handleProtectedContent(
    request: http.IncomingMessage,
    response: http.ServerResponse
): Promise<void> {
    const body = parseJsonBody(await readRequestBody(request));

    const walletAddress = getStringField(body, "walletAddress").trim();
    const mintAddress = getStringField(body, "mintAddress").trim();

    if (!walletAddress) {
        sendJson(response, { error: "Missing walletAddress." }, 400);
        return;
    }

    if (!mintAddress) {
        sendJson(response, { error: "Missing mintAddress." }, 400);
        return;
    }

    const access = await verifyStandardNftAccess(
        walletAddress,
        mintAddress
    );

    if (!access.allowed) {
        sendJson(
            response,
            {
                allowed: false,
                error: "Access denied. This wallet does not own the required NFT.",
                owner: access.owner,
                walletAddress,
                mintAddress
            },
            403
        );

        return;
    }

    sendJson(response, {
        allowed: true,
        owner: access.owner,
        walletAddress,
        mintAddress,
        content: buildProtectedDemoContent(
            walletAddress,
            mintAddress,
            access.owner
        )
    });
}

async function handleProtectedCompressedNftContent(
    request: http.IncomingMessage,
    response: http.ServerResponse
): Promise<void> {
    const body = parseJsonBody(await readRequestBody(request));

    const walletAddress = getStringField(body, "walletAddress").trim();
    const assetId = getStringField(body, "assetId").trim();

    if (!walletAddress) {
        sendJson(response, { error: "Missing walletAddress." }, 400);
        return;
    }

    if (!assetId) {
        sendJson(response, { error: "Missing assetId." }, 400);
        return;
    }

    const access = await verifyCompressedNftAccess(walletAddress, assetId);

    if (!access.allowed) {
        sendJson(
            response,
            {
                allowed: false,
                error: "Access denied. This wallet does not own the required compressed NFT.",
                owner: access.owner,
                walletAddress,
                assetId
            },
            403
        );

        return;
    }

    sendJson(response, {
        allowed: true,
        owner: access.owner,
        walletAddress,
        assetId,
        isCompressed: access.isCompressed,
        tree: access.tree,
        leafId: access.leafId,
        name: access.name,
        symbol: access.symbol,
        metadataUri: access.metadataUri,
        content: buildProtectedCompressedNftContent(access)
    });
}

async function handleTransferNft(
    request: http.IncomingMessage,
    response: http.ServerResponse
): Promise<void> {
    const body = parseJsonBody(await readRequestBody(request));

    const mintAddress = getStringField(body, "mintAddress").trim();
    const destinationWallet = getStringField(body, "destinationWallet").trim();
    const walletPath = getStringField(body, "walletPath").trim();

    if (!mintAddress) {
        sendJson(response, { error: "Missing mintAddress." }, 400);
        return;
    }

    if (!destinationWallet) {
        sendJson(response, { error: "Missing destinationWallet." }, 400);
        return;
    }

    const args = [
        "npx",
        "tsx",
        "scripts/transferNft.ts",
        mintAddress,
        destinationWallet
    ];

    if (walletPath) {
        args.push(walletPath);
    }

    args.push("--network", network);

    runCommand(response, args, "Transfer Standard NFT", projectRoot);
}

async function requestListener(
    request: http.IncomingMessage,
    response: http.ServerResponse
): Promise<void> {
    try {
        const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

        if (request.method === "GET" && url.pathname === "/") {
            response.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-store"
            });
            response.end(getHtml());
            return;
        }

        if (request.method === "GET" && url.pathname === "/api/config") {
            const config = loadAppConfig(network);
            sendJson(response, {
                walletPath: resolveConfigPath(config.walletPath),
                rawFilesDirectory: config.rawFilesDirectory,
                coverDirectory: config.coverDirectory,
                network: config.network
            });
            return;
        }

        if (request.method === "POST" && url.pathname === "/api/upload") {
            await handleUpload(request, response, url);
            return;
        }

        if (request.method === "POST" && url.pathname === "/api/run") {
            await handleRun(request, response);
            return;
        }

        if (request.method === "POST" && url.pathname === "/api/cnft/create-tree") {
            await handleCnftCommand(
                request,
                response,
                "createMerkleTree.ts",
                "Create Merkle Tree"
            );
            return;
        }

        if (request.method === "POST" && url.pathname === "/api/cnft/create-devnet-collection") {
            await handleCnftCommand(
                request,
                response,
                "createDevnetCollectionNft.ts",
                "Create Collection"
            );
            return;
        }

        if (request.method === "POST" && url.pathname === "/api/cnft/mint") {
            await handleCnftCommand(
                request,
                response,
                "mintCompressedNft.ts",
                "Mint cNFT",
                true
            );
            return;
        }

        if (request.method === "POST" && url.pathname === "/api/cnft/mint-to-collection") {
            await handleCnftCommand(
                request,
                response,
                "mintCompressedNftToCollection.ts",
                "Mint cNFT Into Collection",
                true
            );
            return;
        }

        if (request.method === "POST" && url.pathname === "/api/access/check-nft") {
            await handleCheckNftAccess(request, response);
            return;
        }

        if (request.method === "POST" && url.pathname === "/api/access/check-cnft") {
            await handleCheckCompressedNftAccess(request, response);
            return;
        }

        if (request.method === "POST" && url.pathname === "/api/protected/content") {
            await handleProtectedContent(request, response);
            return;
        }

        if (request.method === "POST" && url.pathname === "/api/protected/cnft-content") {
            await handleProtectedCompressedNftContent(request, response);
            return;
        }

        if (request.method === "POST" && url.pathname === "/api/nft/transfer") {
            await handleTransferNft(request, response);
            return;
        }

        sendJson(response, { error: "Not found." }, 404);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        sendJson(response, { error: message }, 500);
    }
}

const server = http.createServer((request, response) => {
    void requestListener(request, response);
});

server.listen(port, () => {
    console.log(`UI server running at http://localhost:${port}`);
    console.log(`Solana network: ${network}`);
});
