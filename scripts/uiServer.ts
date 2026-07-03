export function getHtml(): string {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>NFT / cNFT Pipeline</title>
  <style>
    :root {
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #172033;
      background: #f4f7fb;
    }

    body {
      margin: 0;
    }

    main {
      max-width: 1220px;
      margin: 0 auto;
      padding: 32px 20px;
    }

    header {
      margin-bottom: 24px;
    }

    h1 {
      margin: 0 0 8px;
      font-size: 30px;
    }

    p {
      margin: 0;
      color: #64748b;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1.35fr;
      gap: 20px;
      align-items: start;
    }

    .card {
      background: #fff;
      border: 1px solid #dbe3ef;
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
    }

    h2 {
      margin: 0 0 8px;
      font-size: 18px;
    }

    .subtitle {
      margin-bottom: 18px;
      font-size: 14px;
      line-height: 1.45;
      color: #64748b;
    }

    label {
      display: block;
      margin: 14px 0 6px;
      font-weight: 650;
      font-size: 14px;
    }

    input[type="text"],
    input[type="file"] {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 11px 12px;
      font: inherit;
      background: #fff;
    }

    .check-row {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-top: 16px;
    }

    .check-row label {
      margin: 0;
      font-weight: 600;
    }

    button {
      width: 100%;
      margin-top: 14px;
      border: 0;
      border-radius: 10px;
      padding: 12px 14px;
      font: inherit;
      font-weight: 750;
      color: #fff;
      background: #2563eb;
      cursor: pointer;
    }

    button.secondary {
      background: #334155;
    }

    button.devnet {
      background: #7c3aed;
    }

    button.success {
      background: #059669;
    }

    button:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }

    .hint {
      margin-top: 6px;
      color: #64748b;
      font-size: 13px;
      line-height: 1.4;
    }

    .status {
      min-height: 20px;
      margin-top: 12px;
      color: #334155;
      font-size: 14px;
    }

    .badge {
      display: inline-block;
      margin-bottom: 14px;
      padding: 5px 10px;
      border-radius: 999px;
      background: #ede9fe;
      color: #5b21b6;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .03em;
      text-transform: uppercase;
    }

    pre {
      min-height: 620px;
      max-height: 76vh;
      overflow: auto;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      background: #0f172a;
      color: #d1fae5;
      border-radius: 12px;
      padding: 16px;
      font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    @media (max-width: 1040px) {
      .grid {
        grid-template-columns: 1fr;
      }

      pre {
        min-height: 360px;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>NFT / cNFT Pipeline</h1>
      <p>Local thesis interface for decentralized storage, Solana NFTs, collections, and compressed NFTs.</p>
    </header>

    <div class="grid">
      <section class="card">
        <span class="badge">Mainnet</span>
        <h2>Standard NFT Pipeline</h2>
        <p class="subtitle">Upload an asset, generate metadata, upload to Irys, and optionally mint a standard Solana NFT.</p>

        <form id="pipelineForm">
          <label for="assetFile">Asset file</label>
          <input id="assetFile" type="file" required />
          <div class="hint">Saved into rawFiles/ before running the pipeline.</div>

          <label for="coverFile">Cover image</label>
          <input id="coverFile" type="file" accept="image/png" />
          <div class="hint">Required for audio and PDF assets.</div>

          <label for="walletFile">Wallet JSON</label>
          <input id="walletFile" type="file" accept="application/json,.json" />
          <div class="hint" id="walletPathDisplay">Default wallet path will be loaded from config.</div>

          <div class="check-row">
            <input id="mint" type="checkbox" />
            <label for="mint">Mint NFT after upload</label>
          </div>
          <div class="hint">This is a mainnet transaction and spends SOL.</div>

          <button id="runButton" type="submit">Run Standard Pipeline</button>
          <div id="status" class="status"></div>
        </form>
      </section>

      <section class="card">
        <span class="badge">Devnet</span>
        <h2>Compressed NFT Tools</h2>
        <p class="subtitle">Create a Merkle Tree, create a devnet collection, and mint compressed NFTs for scalable image/music assets.</p>

        <button id="createTreeButton" class="devnet">Create Merkle Tree</button>
        <button id="createDevnetCollectionButton" class="secondary">Create Devnet Collection</button>

        <label for="cnftMetadataUri">Metadata URI</label>
        <input id="cnftMetadataUri" type="text" placeholder="https://gateway.irys.xyz/..." />

        <label for="cnftName">cNFT name</label>
        <input id="cnftName" type="text" value="Collection Compressed NFT" />

        <button id="mintCnftButton">Mint cNFT</button>
        <button id="mintCnftCollectionButton" class="success">Mint cNFT Into Collection</button>

        <div id="cnftStatus" class="status"></div>
      </section>

      <section class="card">
        <h2>Command Log</h2>
        <p class="subtitle">Live output from local scripts.</p>
        <pre id="log">Waiting for a command...</pre>
      </section>
    </div>
  </main>

  <script>
    const form = document.querySelector('#pipelineForm');
    const assetInput = document.querySelector('#assetFile');
    const coverInput = document.querySelector('#coverFile');
    const walletFileInput = document.querySelector('#walletFile');
    const walletPathDisplay = document.querySelector('#walletPathDisplay');
    const mintInput = document.querySelector('#mint');
    const runButton = document.querySelector('#runButton');
    const statusNode = document.querySelector('#status');
    const cnftStatusNode = document.querySelector('#cnftStatus');
    const logNode = document.querySelector('#log');

    let selectedWalletPath = '';

    fetch('/api/config')
      .then((response) => response.json())
      .then((config) => {
        selectedWalletPath = config.walletPath;
        walletPathDisplay.textContent = 'Using wallet from config: ' + selectedWalletPath;
      })
      .catch(() => {
        statusNode.textContent = 'Could not load config defaults.';
      });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const assetFile = assetInput.files[0];
      const coverFile = coverInput.files[0];

      if (!assetFile) return;

      runButton.disabled = true;
      logNode.textContent = '';

      try {
        statusNode.textContent = 'Uploading asset...';
        const asset = await uploadFile('asset', assetFile);

        if (coverFile) {
          statusNode.textContent = 'Uploading cover...';
          await uploadFile('cover', coverFile, asset.filename);
        }

        const walletFile = walletFileInput.files[0];
        if (walletFile) {
          statusNode.textContent = 'Uploading wallet JSON...';
          const wallet = await uploadFile('wallet', walletFile);
          selectedWalletPath = wallet.path;
          walletPathDisplay.textContent = 'Using selected wallet: ' + selectedWalletPath;
        }

        statusNode.textContent = 'Running standard pipeline...';
        await streamCommand('/api/run', {
          filename: asset.filename,
          walletPath: selectedWalletPath,
          mint: mintInput.checked
        });

        statusNode.textContent = 'Finished.';
      } catch (error) {
        statusNode.textContent = 'Run failed.';
        logNode.textContent += '\\n' + (error instanceof Error ? error.message : String(error));
      } finally {
        runButton.disabled = false;
      }
    });

    document.querySelector('#createTreeButton').addEventListener('click', async () => {
      cnftStatusNode.textContent = 'Creating Merkle Tree...';
      await streamCommand('/api/cnft/create-tree');
      cnftStatusNode.textContent = 'Merkle Tree command finished.';
    });

    document.querySelector('#createDevnetCollectionButton').addEventListener('click', async () => {
      cnftStatusNode.textContent = 'Creating devnet collection...';
      await streamCommand('/api/cnft/create-devnet-collection');
      cnftStatusNode.textContent = 'Devnet collection command finished.';
    });

    document.querySelector('#mintCnftButton').addEventListener('click', async () => {
      cnftStatusNode.textContent = 'Minting cNFT...';
      await streamCommand('/api/cnft/mint', {
        metadataUri: document.querySelector('#cnftMetadataUri').value.trim(),
        name: document.querySelector('#cnftName').value.trim()
      });
      cnftStatusNode.textContent = 'cNFT mint command finished.';
    });

    document.querySelector('#mintCnftCollectionButton').addEventListener('click', async () => {
      cnftStatusNode.textContent = 'Minting cNFT into collection...';
      await streamCommand('/api/cnft/mint-to-collection', {
        metadataUri: document.querySelector('#cnftMetadataUri').value.trim(),
        name: document.querySelector('#cnftName').value.trim()
      });
      cnftStatusNode.textContent = 'cNFT collection mint command finished.';
    });

    async function uploadFile(kind, file, assetFilename = '') {
      const params = new URLSearchParams({ kind, filename: file.name });
      if (assetFilename) params.set('assetFilename', assetFilename);

      const response = await fetch('/api/upload?' + params.toString(), {
        method: 'POST',
        body: await file.arrayBuffer()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed.');
      }

      return result;
    }

    async function streamCommand(url, payload = {}) {
      logNode.textContent = '';

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.body) {
        throw new Error('Streaming response is not available.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        logNode.textContent += decoder.decode(value, { stream: true });
        logNode.scrollTop = logNode.scrollHeight;
      }
    }
  </script>
</body>
</html>`;
}