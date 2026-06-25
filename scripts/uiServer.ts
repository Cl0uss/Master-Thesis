import http from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadConfig, loadRpcConfig } from "./config.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = loadConfig(path.join(projectRoot, "config", "app-config.json"));
const rpcConfig = loadRpcConfig(path.join(projectRoot, "config", "rpc-config.json"));
const rawFilesDirectory = path.join(projectRoot, config.rawFilesDirectory);
const coverDirectory = path.join(projectRoot, config.coverDirectory);
const walletUploadDirectory = path.join(projectRoot, ".runtime", "wallets");
const port = Number(process.env.PORT ?? 5174);

fs.mkdirSync(rawFilesDirectory, { recursive: true });
fs.mkdirSync(coverDirectory, { recursive: true });
fs.mkdirSync(walletUploadDirectory, { recursive: true });

const server = http.createServer(async (request, response) => {
    try {
        const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host}`);

        if (request.method === "GET" && requestUrl.pathname === "/") {
            sendHtml(response);
            return;
        }

        if (request.method === "GET" && requestUrl.pathname === "/api/config") {
            sendJson(response, {
                walletPath: config.walletPath,
                coverExtension: config.coverExtension,
                rawFilesDirectory: config.rawFilesDirectory,
                coverDirectory: config.coverDirectory
            });
            return;
        }

        if (request.method === "POST" && requestUrl.pathname === "/api/upload") {
            const kind = requestUrl.searchParams.get("kind");
            const filename = sanitizeFilename(requestUrl.searchParams.get("filename") ?? "");
            const assetFilename = sanitizeFilename(requestUrl.searchParams.get("assetFilename") ?? "");

            if (!filename) {
                sendJson(response, { error: "Missing filename." }, 400);
                return;
            }

            const body = await readRequestBody(request);
            let outputPath: string;
            let savedFilename: string;

            if (kind === "asset") {
                savedFilename = filename;
                outputPath = path.join(rawFilesDirectory, savedFilename);
            } else if (kind === "wallet") {
                savedFilename = filename.endsWith(".json") ? filename : `${filename}.json`;
                outputPath = path.join(walletUploadDirectory, savedFilename);
            } else if (kind === "cover") {
                if (!assetFilename) {
                    sendJson(response, { error: "Missing asset filename for cover upload." }, 400);
                    return;
                }

                const baseName = path.basename(assetFilename, path.extname(assetFilename));
                savedFilename = `${baseName}${config.coverExtension}`;
                outputPath = path.join(coverDirectory, savedFilename);
            } else {
                sendJson(response, { error: "Invalid upload kind." }, 400);
                return;
            }

            fs.writeFileSync(outputPath, body);
            sendJson(response, { filename: savedFilename, path: path.relative(projectRoot, outputPath) });
            return;
        }

        if (request.method === "POST" && requestUrl.pathname === "/api/run") {
            const payload = JSON.parse((await readRequestBody(request)).toString("utf8")) as {
                filename?: string;
                walletPath?: string;
                mint?: boolean;
            };

            if (!payload.filename) {
                sendJson(response, { error: "Missing filename." }, 400);
                return;
            }

            runPipeline(response, payload.filename, payload.walletPath || config.walletPath, Boolean(payload.mint));
            return;
        }

        if (request.method === "POST" && requestUrl.pathname === "/api/check-owner") {
            const payload = JSON.parse((await readRequestBody(request)).toString("utf8")) as {
                mintAddress?: string;
            };

            if (!payload.mintAddress) {
                sendJson(response, { error: "Missing mint address." }, 400);
                return;
            }

            runCheckOwner(response, payload.mintAddress);
            return;
        }

        if (request.method === "POST" && requestUrl.pathname === "/api/transfer") {
            const payload = JSON.parse((await readRequestBody(request)).toString("utf8")) as {
                mintAddress?: string;
                destinationWallet?: string;
                walletPath?: string;
            };

            if (!payload.mintAddress || !payload.destinationWallet) {
                sendJson(response, { error: "Missing mint address or destination wallet." }, 400);
                return;
            }

            runTransfer(
                response,
                payload.mintAddress,
                payload.destinationWallet,
                payload.walletPath || config.walletPath
            );
            return;
        }

        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
    } catch (error) {
        response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        response.end(error instanceof Error ? error.stack : String(error));
    }
});

server.listen(port, () => {
    console.log(`UI server running at http://localhost:${port}`);
});

function runPipeline(response: http.ServerResponse, filename: string, walletPath: string, mint: boolean): void {
    const args = ["./launch", filename, "--wallet", walletPath];

    if (mint) {
        args.push("--mint");
    }

    runCommand(response, args, "Pipeline");
}

function runCheckOwner(response: http.ServerResponse, mintAddress: string): void {
    runCommand(
        response,
        ["npx", "tsx", "scripts/checkNftOwner.ts", mintAddress, rpcConfig.rpcUrl],
        "Owner check"
    );
}

function runTransfer(
    response: http.ServerResponse,
    mintAddress: string,
    destinationWallet: string,
    walletPath: string
): void {
    runCommand(
        response,
        [
            "npx",
            "tsx",
            "scripts/transferNft.ts",
            mintAddress,
            destinationWallet,
            walletPath,
            rpcConfig.rpcUrl
        ],
        "Transfer"
    );
}

function runCommand(response: http.ServerResponse, args: string[], label: string): void {
    response.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff"
    });

    response.write(`$ ${args.join(" ")}\n\n`);

    const child = spawn(args[0], args.slice(1), {
        cwd: projectRoot,
        env: process.env
    });

    child.stdout.on("data", (chunk: Buffer) => response.write(chunk));
    child.stderr.on("data", (chunk: Buffer) => response.write(chunk));
    child.on("close", (code) => {
        response.write(`\nProcess exited with code ${code}\n`);
        if (code !== 0) {
            response.write(`${label} failed. Check the log above for the first error message.\n`);
        }
        response.end();
    });
    child.on("error", (error) => {
        response.write(`\nFailed to start ${label.toLowerCase()}: ${error.message}\n`);
        response.end();
    });
}

function sanitizeFilename(filename: string): string {
    return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
}

function readRequestBody(request: http.IncomingMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        request.on("data", (chunk: Buffer) => chunks.push(chunk));
        request.on("end", () => resolve(Buffer.concat(chunks)));
        request.on("error", reject);
    });
}

function sendJson(response: http.ServerResponse, data: unknown, status = 200): void {
    response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(data));
}

function sendHtml(response: http.ServerResponse): void {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Master Thesis NFT Pipeline</title>
  <style>
    :root { color-scheme: light; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; background: #f5f7fb; color: #18202f; }
    main { max-width: 1120px; margin: 0 auto; padding: 32px 20px; }
    h1 { margin: 0 0 8px; font-size: 28px; letter-spacing: 0; }
    p { margin: 0; color: #536172; }
    .layout { display: grid; grid-template-columns: minmax(320px, 420px) 1fr; gap: 20px; margin-top: 24px; align-items: start; }
    .controls { display: grid; gap: 16px; }
    section { background: #ffffff; border: 1px solid #dfe5ef; border-radius: 8px; padding: 18px; }
    label { display: block; font-weight: 650; margin: 14px 0 6px; }
    input[type="text"], input[type="file"] { width: 100%; box-sizing: border-box; border: 1px solid #c8d1df; border-radius: 6px; padding: 10px; font: inherit; background: #fff; }
    input[type="checkbox"] { width: 18px; height: 18px; margin: 0; }
    .row { display: flex; align-items: center; gap: 10px; margin-top: 14px; }
    .hint { font-size: 13px; color: #66758a; margin-top: 6px; line-height: 1.4; }
    button { margin-top: 18px; width: 100%; border: 0; border-radius: 6px; padding: 12px 14px; background: #1f6feb; color: white; font-weight: 700; font: inherit; cursor: pointer; }
    button:disabled { background: #94a3b8; cursor: not-allowed; }
    pre { margin: 0; min-height: 520px; max-height: 72vh; overflow: auto; white-space: pre-wrap; word-break: break-word; background: #111827; color: #d1e7dd; border-radius: 8px; padding: 16px; font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .status { margin-top: 12px; min-height: 20px; font-size: 14px; color: #334155; }
    @media (max-width: 820px) { .layout { grid-template-columns: 1fr; } pre { min-height: 360px; } }
  </style>
</head>
<body>
  <main>
    <h1>NFT Pipeline</h1>
    <p>Upload an asset, optionally add a cover, choose a wallet, then run the Irys and Solana pipeline.</p>

    <div class="layout">
      <div class="controls">
        <section>
          <form id="pipelineForm">
            <label for="assetFile">Asset file</label>
            <input id="assetFile" type="file" required />
            <div class="hint">The file is saved into rawFiles/ before running the pipeline.</div>

            <label for="coverFile">Cover image</label>
            <input id="coverFile" type="file" accept="image/png" />
            <div class="hint">Required for audio and PDF assets. It will be saved as rawFiles/covers/&lt;asset-name&gt;.png.</div>

            <label for="walletFile">Wallet JSON file</label>
            <input id="walletFile" type="file" accept="application/json,.json" />
            <div class="hint">Choose thesis-wallet.json. If omitted, the config wallet path is used.</div>

            <div id="walletPathDisplay" class="hint">Default wallet path will be loaded from config.</div>

            <div class="row">
              <input id="mint" type="checkbox" />
              <label for="mint" style="margin:0">Mint NFT after metadata upload</label>
            </div>
            <div class="hint">Minting is a Solana mainnet transaction and may spend SOL.</div>

            <button id="runButton" type="submit">Run Pipeline</button>
            <div id="status" class="status"></div>
          </form>
        </section>

        <section>
          <form id="transferForm">
            <label for="transferMintAddress">NFT mint address</label>
            <input id="transferMintAddress" type="text" autocomplete="off" required />
            <div class="hint">Use the mint address produced by the mint step.</div>

            <label for="destinationWallet">Destination wallet</label>
            <input id="destinationWallet" type="text" autocomplete="off" required />
            <div class="hint">Ownership will be transferred to this wallet.</div>

            <label for="transferWalletFile">Owner wallet JSON file</label>
            <input id="transferWalletFile" type="file" accept="application/json,.json" />
            <div class="hint">This wallet must currently own the NFT. If omitted, the config wallet is used.</div>

            <div id="transferWalletPathDisplay" class="hint">Default owner wallet path will be loaded from config.</div>

            <button id="checkOwnerButton" type="button">Check Current Owner</button>
            <button id="transferButton" type="submit">Transfer NFT</button>
            <div id="transferStatus" class="status"></div>
          </form>
        </section>
      </div>

      <section>
        <pre id="log">Waiting for a run...</pre>
      </section>
    </div>
  </main>

  <script>
    const form = document.querySelector('#pipelineForm');
    const transferForm = document.querySelector('#transferForm');
    const assetInput = document.querySelector('#assetFile');
    const coverInput = document.querySelector('#coverFile');
    const walletFileInput = document.querySelector('#walletFile');
    const walletPathDisplay = document.querySelector('#walletPathDisplay');
    let selectedWalletPath = '';
    const mintInput = document.querySelector('#mint');
    const runButton = document.querySelector('#runButton');
    const statusNode = document.querySelector('#status');
    const logNode = document.querySelector('#log');
    const transferMintAddressInput = document.querySelector('#transferMintAddress');
    const destinationWalletInput = document.querySelector('#destinationWallet');
    const transferWalletFileInput = document.querySelector('#transferWalletFile');
    const transferWalletPathDisplay = document.querySelector('#transferWalletPathDisplay');
    const checkOwnerButton = document.querySelector('#checkOwnerButton');
    const transferButton = document.querySelector('#transferButton');
    const transferStatusNode = document.querySelector('#transferStatus');
    let selectedTransferWalletPath = '';

    fetch('/api/config')
      .then((response) => response.json())
      .then((config) => {
        selectedWalletPath = config.walletPath;
        selectedTransferWalletPath = config.walletPath;
        walletPathDisplay.textContent = 'Using wallet from config: ' + selectedWalletPath;
        transferWalletPathDisplay.textContent = 'Using owner wallet from config: ' + selectedTransferWalletPath;
      })
      .catch(() => { statusNode.textContent = 'Could not load config defaults.'; });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const assetFile = assetInput.files[0];
      const coverFile = coverInput.files[0];

      if (!assetFile) return;

      runButton.disabled = true;
      logNode.textContent = '';

      try {
        statusNode.textContent = 'Uploading asset into rawFiles/...';
        const asset = await uploadFile('asset', assetFile);

        if (coverFile) {
          statusNode.textContent = 'Uploading cover into rawFiles/covers/...';
          await uploadFile('cover', coverFile, asset.filename);
        }

        const walletFile = walletFileInput.files[0];
        if (walletFile) {
          statusNode.textContent = 'Uploading wallet JSON into .runtime/wallets/...';
          const wallet = await uploadFile('wallet', walletFile);
          selectedWalletPath = wallet.path;
          walletPathDisplay.textContent = 'Using selected wallet: ' + selectedWalletPath;
        }

        statusNode.textContent = 'Running pipeline...';
        const exitCode = await runPipeline(asset.filename, selectedWalletPath, mintInput.checked);
        if (exitCode === 0) {
          statusNode.textContent = 'Pipeline finished.';
        } else {
          statusNode.textContent = 'Pipeline failed. Check the log.';
        }
      } catch (error) {
        statusNode.textContent = 'Run failed.';
        logNode.textContent += '\\n' + (error instanceof Error ? error.message : String(error));
      } finally {
        runButton.disabled = false;
      }
    });

    checkOwnerButton.addEventListener('click', async () => {
      checkOwnerButton.disabled = true;
      logNode.textContent = '';

      try {
        transferStatusNode.textContent = 'Checking current NFT owner...';
        const exitCode = await runCheckOwner(transferMintAddressInput.value.trim());
        if (exitCode === 0) {
          transferStatusNode.textContent = 'Owner check finished.';
        } else {
          transferStatusNode.textContent = 'Owner check failed. Check the log.';
        }
      } catch (error) {
        transferStatusNode.textContent = 'Owner check failed.';
        logNode.textContent += '\\n' + (error instanceof Error ? error.message : String(error));
      } finally {
        checkOwnerButton.disabled = false;
      }
    });

    transferForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      transferButton.disabled = true;
      logNode.textContent = '';

      try {
        const walletFile = transferWalletFileInput.files[0];
        if (walletFile) {
          transferStatusNode.textContent = 'Uploading owner wallet JSON into .runtime/wallets/...';
          const wallet = await uploadFile('wallet', walletFile);
          selectedTransferWalletPath = wallet.path;
          transferWalletPathDisplay.textContent = 'Using selected owner wallet: ' + selectedTransferWalletPath;
        }

        transferStatusNode.textContent = 'Transferring NFT ownership...';
        const exitCode = await runTransfer(
          transferMintAddressInput.value.trim(),
          destinationWalletInput.value.trim(),
          selectedTransferWalletPath
        );

        if (exitCode === 0) {
          transferStatusNode.textContent = 'Transfer finished.';
        } else {
          transferStatusNode.textContent = 'Transfer failed. Check the log.';
        }
      } catch (error) {
        transferStatusNode.textContent = 'Transfer failed.';
        logNode.textContent += '\\n' + (error instanceof Error ? error.message : String(error));
      } finally {
        transferButton.disabled = false;
      }
    });

    async function uploadFile(kind, file, assetFilename = '') {
      const params = new URLSearchParams({ kind, filename: file.name });
      if (assetFilename) params.set('assetFilename', assetFilename);

      const response = await fetch('/api/upload?' + params.toString(), {
        method: 'POST',
        body: await file.arrayBuffer()
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed.');
      return result;
    }

    async function runPipeline(filename, walletPath, mint) {
      return streamCommand('/api/run', { filename, walletPath, mint });
    }

    async function runCheckOwner(mintAddress) {
      return streamCommand('/api/check-owner', { mintAddress });
    }

    async function runTransfer(mintAddress, destinationWallet, walletPath) {
      return streamCommand('/api/transfer', { mintAddress, destinationWallet, walletPath });
    }

    async function streamCommand(url, payload) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.body) throw new Error('Streaming response is not available.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        logNode.textContent += decoder.decode(value, { stream: true });
        logNode.scrollTop = logNode.scrollHeight;
      }

      const match = logNode.textContent.match(/Process exited with code (\d+)/);
      return match ? Number(match[1]) : 1;
    }
  </script>
</body>
</html>`);
}
