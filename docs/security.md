# Security notes

This project is a local thesis proof-of-concept. It signs Solana and Irys actions with local wallet JSON files and uses RPC providers for ownership checks.

## Wallet files

- Keep wallet JSON files outside the repository.
- Do not upload `.runtime/wallets/` or any copied wallet JSON file.
- Use Devnet wallets for demonstrations whenever possible.
- If a wallet file is exposed, stop using it and move funds or assets to a new wallet.

## RPC keys

- RPC API keys are runtime secrets.
- In a public repository, commit only example RPC config files.
- If an RPC key is exposed publicly, rotate it in the provider dashboard.

## Local UI

- The UI is intended for local use at `localhost`.
- Uploaded wallet files are saved under `.runtime/wallets/` so scripts can sign demo transactions.
- Do not expose the UI server to the public internet without authentication and file-upload hardening.

## Access-control model

The implemented token-gated access is a proof-of-concept ownership verifier. The backend checks whether a submitted public wallet address owns the required NFT or cNFT before returning demo protected content.

For production use, add wallet authentication before the ownership check:

1. Server creates a one-time nonce.
2. Wallet signs the nonce.
3. Server verifies the signature and binds the request to that wallet address.
4. Server checks NFT or cNFT ownership.
5. Protected content is returned only after both signature verification and ownership verification pass.
