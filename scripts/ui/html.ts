export function getHtml(): string {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Master Thesis NFT Pipeline</title>

  <style>
    :root {
      --bg: #0f172a;
      --bg-soft: #111827;
      --card: #182235;
      --card-light: #1f2a3d;
      --border: #314158;
      --text: #e5e7eb;
      --muted: #9ca3af;
      --muted-2: #64748b;
      --accent: #7dd3fc;
      --accent-strong: #38bdf8;
      --green: #86efac;
      --yellow: #fde68a;
      --red: #fca5a5;
      --button: #2563eb;
      --button-hover: #1d4ed8;
      --button-soft: #334155;
      --button-soft-hover: #475569;
      --shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
      --radius: 18px;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 34%),
        radial-gradient(circle at top right, rgba(99, 102, 241, 0.14), transparent 30%),
        linear-gradient(135deg, #0f172a 0%, #111827 48%, #0b1120 100%);
    }

    a {
      color: var(--accent);
    }

    main {
      width: min(1180px, calc(100% - 40px));
      margin: 0 auto;
      padding: 40px 0;
    }

    .hero {
      display: grid;
      grid-template-columns: 1.4fr 0.8fr;
      gap: 22px;
      align-items: stretch;
      margin-bottom: 24px;
    }

    .hero-card,
    .status-card,
    .panel {
      background: rgba(24, 34, 53, 0.86);
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      backdrop-filter: blur(14px);
    }

    .hero-card {
      padding: 28px;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      border: 1px solid rgba(125, 211, 252, 0.28);
      border-radius: 999px;
      color: var(--accent);
      background: rgba(14, 165, 233, 0.08);
      font-size: 13px;
      font-weight: 650;
      letter-spacing: 0.02em;
      margin-bottom: 18px;
    }

    h1 {
      margin: 0;
      font-size: clamp(30px, 4vw, 46px);
      line-height: 1.06;
      letter-spacing: -0.04em;
    }

    .hero-text {
      max-width: 760px;
      margin: 16px 0 0;
      color: var(--muted);
      font-size: 16px;
      line-height: 1.7;
    }

    .status-card {
      padding: 22px;
    }

    .status-title {
      margin: 0 0 14px;
      color: var(--muted);
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    .status-list {
      display: grid;
      gap: 12px;
    }

    .status-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 13px 14px;
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.12);
    }

    .status-item span:first-child {
      color: var(--muted);
      font-size: 14px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 86px;
      padding: 5px 9px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
    }

    .badge.ready {
      color: #052e16;
      background: var(--green);
    }

    .badge.devnet {
      color: #422006;
      background: var(--yellow);
    }

    .badge.next {
      color: #082f49;
      background: var(--accent);
    }

    .layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 22px;
      align-items: start;
    }

    .panel {
      overflow: hidden;
    }

    .panel-header {
      padding: 20px 22px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.14);
      background: rgba(15, 23, 42, 0.28);
    }

    .panel-kicker {
      margin: 0 0 6px;
      color: var(--accent);
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.14em;
    }

    .panel h2 {
      margin: 0;
      font-size: 21px;
      letter-spacing: -0.02em;
    }

    .panel-description {
      margin: 9px 0 0;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.55;
    }

    .panel-body {
      padding: 22px;
    }

    form,
    .stack {
      display: grid;
      gap: 16px;
    }

    .field {
      display: grid;
      gap: 8px;
    }

    label {
      color: #cbd5e1;
      font-size: 14px;
      font-weight: 650;
    }

    .hint {
      color: var(--muted-2);
      font-size: 12px;
      line-height: 1.45;
    }

    input[type="text"],
    input[type="file"] {
      width: 100%;
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.62);
      color: var(--text);
      padding: 12px 13px;
      outline: none;
      transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
    }

    input[type="file"] {
      color: var(--muted);
    }

    input[type="text"]:focus,
    input[type="file"]:focus {
      border-color: rgba(125, 211, 252, 0.72);
      box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.12);
      background: rgba(15, 23, 42, 0.82);
    }

    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 13px;
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.45);
      border: 1px solid rgba(148, 163, 184, 0.12);
    }

    .checkbox-row input {
      width: 17px;
      height: 17px;
      accent-color: var(--accent-strong);
    }

    .button-row {
      display: flex;
      flex-wrap: wrap;
      gap: 11px;
      margin-top: 2px;
    }

    button {
      border: 0;
      border-radius: 14px;
      padding: 12px 16px;
      color: white;
      background: var(--button);
      font-weight: 750;
      font-size: 14px;
      cursor: pointer;
      transition: transform 0.15s ease, background 0.15s ease, opacity 0.15s ease;
    }

    button:hover {
      background: var(--button-hover);
      transform: translateY(-1px);
    }

    button:active {
      transform: translateY(0);
    }

    button.secondary {
      background: var(--button-soft);
    }

    button.secondary:hover {
      background: var(--button-soft-hover);
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
      transform: none;
    }

    .wide {
      grid-column: 1 / -1;
    }

    .log-panel {
      margin-top: 22px;
    }

    .log-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.14);
      background: rgba(15, 23, 42, 0.28);
    }

    .log-toolbar h2 {
      margin: 0;
      font-size: 18px;
    }

    .log-state {
      color: var(--muted);
      font-size: 13px;
    }

    pre {
      margin: 0;
      min-height: 260px;
      max-height: 440px;
      overflow: auto;
      padding: 18px;
      color: #d1fae5;
      background: rgba(2, 6, 23, 0.82);
      font-family:
        "JetBrains Mono",
        "SFMono-Regular",
        Consolas,
        "Liberation Mono",
        monospace;
      font-size: 13px;
      line-height: 1.55;
      white-space: pre-wrap;
    }

    .mini-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }

    .mini-card {
      padding: 14px;
      border-radius: 15px;
      background: rgba(15, 23, 42, 0.45);
      border: 1px solid rgba(148, 163, 184, 0.12);
    }

    .mini-card strong {
      display: block;
      margin-bottom: 5px;
      color: #f8fafc;
      font-size: 14px;
    }

    .mini-card span {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.45;
    }

    .access-grid {
      display: grid;
      grid-template-columns: 0.9fr 1.1fr;
      gap: 18px;
      align-items: stretch;
    }

    .access-result {
      display: grid;
      align-content: center;
      gap: 10px;
      min-height: 260px;
      padding: 22px;
      border-radius: 18px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: rgba(15, 23, 42, 0.45);
      transition: border-color 0.2s ease, background 0.2s ease;
    }

    .access-result h3 {
      margin: 0;
      font-size: 21px;
    }

    .access-result p {
      margin: 0;
      color: var(--muted);
      line-height: 1.55;
    }

    .access-icon {
      width: 48px;
      height: 48px;
      display: grid;
      place-items: center;
      border-radius: 15px;
      font-size: 24px;
      background: rgba(148, 163, 184, 0.12);
    }

    .access-result.granted {
      border-color: rgba(134, 239, 172, 0.48);
      background: rgba(22, 101, 52, 0.18);
    }

    .access-result.denied {
      border-color: rgba(252, 165, 165, 0.5);
      background: rgba(127, 29, 29, 0.18);
    }

    .access-result.checking {
      border-color: rgba(125, 211, 252, 0.45);
      background: rgba(14, 165, 233, 0.12);
    }

    .protected-preview {
      margin-top: 12px;
      padding: 15px;
      border-radius: 15px;
      background: rgba(2, 6, 23, 0.42);
      border: 1px solid rgba(148, 163, 184, 0.12);
    }

    .protected-preview strong {
      display: block;
      margin-bottom: 5px;
      color: #f8fafc;
      font-size: 14px;
    }

    .protected-preview span {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.45;
    }

    @media (max-width: 900px) {
      .hero,
      .layout,
      .access-grid {
        grid-template-columns: 1fr;
      }

      main {
        width: min(100% - 24px, 1180px);
        padding: 24px 0;
      }
    }
  </style>
</head>

<body>
  <main>
    <section class="hero">
      <div class="hero-card">
        <div class="eyebrow">Solana · Irys · Metaplex · Bubblegum</div>
        <h1>Transmedia NFT Distribution Framework</h1>
        <p class="hero-text">
          Local thesis dashboard for uploading assets to Irys, generating metadata,
          minting standard NFTs, testing compressed NFTs on Devnet, and preparing
          token-gated content access.
        </p>
      </div>

      <aside class="status-card">
        <p class="status-title">Project Status</p>
        <div class="status-list">
          <div class="status-item">
            <span>Irys Upload</span>
            <span class="badge ready">Ready</span>
          </div>
          <div class="status-item">
            <span>Standard NFT</span>
            <span class="badge ready">Ready</span>
          </div>
          <div class="status-item">
            <span>cNFT Devnet</span>
            <span class="badge devnet">Devnet</span>
          </div>
          <div class="status-item">
            <span>Token-Gated Access</span>
            <span class="badge next">Next</span>
          </div>
        </div>
      </aside>
    </section>

    <section class="layout">
      <div class="panel">
        <div class="panel-header">
          <p class="panel-kicker">Mainnet Pipeline</p>
          <h2>Standard NFT Minting</h2>
          <p class="panel-description">
            Upload an asset, optional cover image, wallet JSON, and run the existing
            standard NFT pipeline. Minting can be enabled when needed.
          </p>
        </div>

        <div class="panel-body">
          <form id="pipelineForm">
            <div class="field">
              <label for="assetFile">Asset file</label>
              <input id="assetFile" type="file" required />
              <div class="hint">Book, image, audio, or another digital asset.</div>
            </div>

            <div class="field">
              <label for="coverFile">Cover image</label>
              <input id="coverFile" type="file" accept="image/png,image/jpeg,image/webp" />
              <div class="hint">Optional preview image for the metadata.</div>
            </div>

            <div class="field">
              <label for="walletFile">Wallet JSON</label>
              <input id="walletFile" type="file" accept="application/json,.json" />
              <div class="hint">Optional wallet file. If empty, default config wallet is used.</div>
            </div>

            <label class="checkbox-row">
              <input id="mint" type="checkbox" />
              <span>Mint NFT after upload and metadata generation</span>
            </label>

            <div class="button-row">
              <button type="submit">Run Standard Pipeline</button>
            </div>
          </form>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <p class="panel-kicker">Devnet Pipeline</p>
          <h2>Compressed NFT Testing</h2>
          <p class="panel-description">
            Create Merkle Tree, create Devnet collection, and mint compressed NFTs
            before moving the final logic to Mainnet.
          </p>
        </div>

        <div class="panel-body">
          <div class="stack">
            <div class="mini-grid">
              <div class="mini-card">
                <strong>Merkle Tree</strong>
                <span>Required storage structure for cNFT minting.</span>
              </div>

              <div class="mini-card">
                <strong>Devnet Collection</strong>
                <span>Test collection for compressed NFT verification.</span>
              </div>
            </div>

            <div class="button-row">
              <button id="createTreeButton" class="secondary">Create Merkle Tree</button>
              <button id="createDevnetCollectionButton" class="secondary">Create Devnet Collection</button>
            </div>

            <div class="field">
              <label for="cnftMetadataUri">Metadata URI</label>
              <input id="cnftMetadataUri" type="text" placeholder="https://gateway.irys.xyz/..." />
              <div class="hint">Use metadata URI uploaded to Irys.</div>
            </div>

            <div class="field">
              <label for="cnftName">cNFT Name</label>
              <input id="cnftName" type="text" value="Collection Compressed NFT" />
            </div>

            <div class="button-row">
              <button id="mintCnftButton">Mint cNFT</button>
              <button id="mintCnftCollectionButton">Mint cNFT Into Collection</button>
            </div>
          </div>
        </div>
      </div>

      <div class="panel wide">
        <div class="panel-header">
          <p class="panel-kicker">Access Layer</p>
          <h2>Token-Gated Access</h2>
          <p class="panel-description">
            Verify whether a wallet owns a required standard NFT. If ownership is confirmed,
            protected thesis content becomes available.
          </p>
        </div>

        <div class="panel-body">
          <div class="access-grid">
            <div class="stack">
              <div class="field">
                <label for="accessWalletAddress">Wallet Address</label>
                <input
                  id="accessWalletAddress"
                  type="text"
                  placeholder="Owner wallet address"
                />
                <div class="hint">
                  The wallet that should own the NFT.
                </div>
              </div>

              <div class="field">
                <label for="accessMintAddress">NFT Mint Address</label>
                <input
                  id="accessMintAddress"
                  type="text"
                  placeholder="NFT mint address"
                />
                <div class="hint">
                  Standard NFT mint address to check.
                </div>
              </div>

              <div class="button-row">
                <button id="checkAccessButton" type="button">Check NFT Access</button>
              </div>
            </div>

            <div id="accessResult" class="access-result locked">
              <div class="access-icon">🔒</div>
              <h3>Protected Content Locked</h3>
              <p>
                Enter a wallet address and NFT mint address to verify ownership.
              </p>

              <div class="protected-preview">
                <strong>Demo protected content</strong>
                <span>Full book / music / image access will appear here after verification.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="panel log-panel">
      <div class="log-toolbar">
        <h2>Execution Log</h2>
        <span id="logState" class="log-state">Waiting</span>
      </div>
      <pre id="log">Waiting for command...</pre>
    </section>
  </main>

  <script>
    const logNode = document.querySelector('#log');
    const logState = document.querySelector('#logState');

    function setLog(text) {
      logNode.textContent = text;
    }

    function setState(text) {
      logState.textContent = text;
    }

    function setButtonsDisabled(disabled) {
      document.querySelectorAll('button').forEach((button) => {
        button.disabled = disabled;
      });
    }

    async function uploadFile(kind, file, extraParams = {}) {
      const params = new URLSearchParams({
        kind,
        filename: file.name,
        ...extraParams
      });

      const response = await fetch('/api/upload?' + params.toString(), {
        method: 'POST',
        body: file
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed.');
      }

      return data;
    }

    async function streamCommand(url, payload = {}) {
      setButtonsDisabled(true);
      setLog('');
      setState('Running');

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.body) {
          const text = await response.text();
          setLog(text || 'Empty response.');
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          logNode.textContent += decoder.decode(value, { stream: true });
          logNode.scrollTop = logNode.scrollHeight;
        }

        setState('Finished');
      } catch (error) {
        setState('Error');
        setLog(error.message || String(error));
      } finally {
        setButtonsDisabled(false);
      }
    }

    function renderAccessResult(state, data = {}) {
      const result = document.querySelector('#accessResult');

      result.classList.remove('locked', 'checking', 'granted', 'denied');
      result.classList.add(state);

      if (state === 'checking') {
        result.innerHTML = \`
          <div class="access-icon">⏳</div>
          <h3>Checking Ownership</h3>
          <p>Please wait while the backend checks the NFT owner on Solana.</p>
          <div class="protected-preview">
            <strong>Verification in progress</strong>
            <span>Access decision will appear here.</span>
          </div>
        \`;
        return;
      }

      if (state === 'granted') {
        result.innerHTML = \`
          <div class="access-icon">✅</div>
          <h3>Access Granted</h3>
          <p>This wallet owns the required NFT.</p>
          <div class="protected-preview">
            <strong>\${data.content?.title || 'Protected Content'}</strong>
            <span>
              \${data.content?.message || 'Full content is now unlocked.'}
              <br />
              Owner: \${data.owner}
            </span>
          </div>
        \`;
        return;
      }

      if (state === 'denied') {
        result.innerHTML = \`
          <div class="access-icon">⛔</div>
          <h3>Access Denied</h3>
          <p>This wallet does not own the required NFT.</p>
          <div class="protected-preview">
            <strong>Content remains locked</strong>
            <span>
              Actual owner: \${data.owner || 'Unknown'}
            </span>
          </div>
        \`;
        return;
      }

      result.innerHTML = \`
        <div class="access-icon">🔒</div>
        <h3>Protected Content Locked</h3>
        <p>Enter a wallet address and NFT mint address to verify ownership.</p>
        <div class="protected-preview">
          <strong>Demo protected content</strong>
          <span>Full book / music / image access will appear here after verification.</span>
        </div>
      \`;
    }

    document.querySelector('#pipelineForm').addEventListener('submit', async (event) => {
      event.preventDefault();

      const assetFile = document.querySelector('#assetFile').files[0];
      const coverFile = document.querySelector('#coverFile').files[0];
      const walletFile = document.querySelector('#walletFile').files[0];
      const mint = document.querySelector('#mint').checked;

      if (!assetFile) {
        setLog('Please choose an asset file.');
        return;
      }

      setButtonsDisabled(true);
      setState('Uploading');
      setLog('Uploading asset...\\n');

      try {
        const assetUpload = await uploadFile('asset', assetFile);
        logNode.textContent += 'Asset saved: ' + assetUpload.path + '\\n';

        if (coverFile) {
          logNode.textContent += 'Uploading cover...\\n';
          const coverUpload = await uploadFile('cover', coverFile, {
            assetFilename: assetUpload.filename
          });
          logNode.textContent += 'Cover saved: ' + coverUpload.path + '\\n';
        }

        let walletPath = '';

        if (walletFile) {
          logNode.textContent += 'Uploading wallet...\\n';
          const walletUpload = await uploadFile('wallet', walletFile);
          walletPath = walletUpload.path;
          logNode.textContent += 'Wallet saved: ' + walletUpload.path + '\\n';
        }

        logNode.textContent += '\\nStarting standard NFT pipeline...\\n\\n';

        setButtonsDisabled(false);

        await streamCommand('/api/run', {
          filename: assetUpload.filename,
          walletPath,
          mint
        });
      } catch (error) {
        setState('Error');
        setLog(error.message || String(error));
      } finally {
        setButtonsDisabled(false);
      }
    });

    document.querySelector('#createTreeButton').addEventListener('click', () => {
      streamCommand('/api/cnft/create-tree');
    });

    document.querySelector('#createDevnetCollectionButton').addEventListener('click', () => {
      streamCommand('/api/cnft/create-devnet-collection');
    });

    document.querySelector('#mintCnftButton').addEventListener('click', () => {
      streamCommand('/api/cnft/mint', {
        metadataUri: document.querySelector('#cnftMetadataUri').value.trim(),
        name: document.querySelector('#cnftName').value.trim()
      });
    });

    document.querySelector('#mintCnftCollectionButton').addEventListener('click', () => {
      streamCommand('/api/cnft/mint-to-collection', {
        metadataUri: document.querySelector('#cnftMetadataUri').value.trim(),
        name: document.querySelector('#cnftName').value.trim()
      });
    });

    document.querySelector('#checkAccessButton').addEventListener('click', async () => {
      const walletAddress = document.querySelector('#accessWalletAddress').value.trim();
      const mintAddress = document.querySelector('#accessMintAddress').value.trim();

      if (!walletAddress || !mintAddress) {
        renderAccessResult('denied', {
          owner: 'Missing wallet address or NFT mint address.'
        });
        return;
      }

      setButtonsDisabled(true);
      renderAccessResult('checking');

      try {
        const response = await fetch('/api/access/check-nft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress, mintAddress })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Access check failed.');
        }

        renderAccessResult(data.allowed ? 'granted' : 'denied', data);
      } catch (error) {
        renderAccessResult('denied', {
          owner: error.message || String(error)
        });
      } finally {
        setButtonsDisabled(false);
      }
    });
  </script>
</body>
</html>`;
}