export function getHtml(): string {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Master Thesis NFT Pipeline</title>
</head>
<body>
  <main>
    <h1>NFT / cNFT Pipeline</h1>
    <p>Local UI for standard NFTs, compressed NFTs, and collection tests.</p>

    <section>
      <h2>Run Standard NFT Pipeline</h2>
      <form id="pipelineForm">
        <label>Asset file</label>
        <input id="assetFile" type="file" required />

        <label>Cover image</label>
        <input id="coverFile" type="file" accept="image/png" />

        <label>Wallet JSON</label>
        <input id="walletFile" type="file" accept="application/json,.json" />

        <label>
          <input id="mint" type="checkbox" />
          Mint NFT
        </label>

        <button type="submit">Run Pipeline</button>
      </form>
    </section>

    <section>
      <h2>Compressed NFT / Devnet</h2>

      <button id="createTreeButton">Create Merkle Tree</button>
      <button id="createDevnetCollectionButton">Create Devnet Collection</button>

      <label>Metadata URI</label>
      <input id="cnftMetadataUri" type="text" />

      <label>cNFT Name</label>
      <input id="cnftName" type="text" value="Collection Compressed NFT" />

      <button id="mintCnftButton">Mint cNFT</button>
      <button id="mintCnftCollectionButton">Mint cNFT Into Collection</button>
    </section>

    <section>
      <h2>Log</h2>
      <pre id="log">Waiting...</pre>
    </section>
  </main>

  <script>
    const logNode = document.querySelector('#log');

    function setLog(text) {
      logNode.textContent = text;
    }

    async function streamCommand(url, payload = {}) {
      setLog('');

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        logNode.textContent += decoder.decode(value, { stream: true });
        logNode.scrollTop = logNode.scrollHeight;
      }
    }

    document.querySelector('#pipelineForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      setLog('Standard pipeline UI will be reconnected in the next step.');
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
  </script>
</body>
</html>`;
}