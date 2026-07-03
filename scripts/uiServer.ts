import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getNftOwner } from "./checkNftOwner.js";
import { loadConfig, resolveConfigPath } from "./config.js";
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

async function handleUpload(
    request: http.IncomingMessage,
    response: http.ServerResponse,
    url: URL
): Promise<void> {
    const config = loadConfig();
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
    const shouldMint = getBooleanField(body, "mint");

    if (!filename) {
        sendJson(response, { error: "Missing filename." }, 400);
        return;
    }

    const args = ["./launch", filename];

    if (walletPath) {
        args.push("--wallet", walletPath);
    }

    if (shouldMint) {
        args.push("--mint");
    }

    runCommand(response, args, "Standard NFT pipeline", projectRoot);
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

    const owner = await getNftOwner(mintAddress);
    const allowed = owner === walletAddress;

    sendJson(response, {
        allowed,
        owner,
        walletAddress,
        mintAddress,
        content: allowed
            ? {
                  title: "Protected Thesis Content",
                  message: "Access granted. This wallet owns the required NFT.",
                  demoUrl: "/protected/full-content-demo"
              }
            : null
    });
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
            const config = loadConfig();
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
                "Create Devnet Collection"
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
});