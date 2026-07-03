package functions;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;

// Bridges Java pipeline code to the TypeScript Solana mint script.
public class NftMinter {

    // Mints one NFT from an uploaded metadata URI and returns parsed mint details.
    public static MintResult mint(
            String metadataUri,
            Path walletPath,
            String nftName,
            String symbol,
            String rpcUrl,
            int sellerFeePercent,
            String network
    ) throws Exception {

        ProcessBuilder processBuilder = new ProcessBuilder(
                "npx",
                "tsx",
                "scripts/mintNft.ts",
                metadataUri,
                nftName,
                walletPath.toString(),
                symbol,
                rpcUrl,
                String.valueOf(sellerFeePercent),
                "--network",
                network,
                "--allow-unverified-collection"
        );

        Process process = processBuilder.start();

        StringBuilder stdout = new StringBuilder();
        StringBuilder stderr = new StringBuilder();

        // Print TypeScript progress logs live while stdout remains machine-readable.
        Thread stderrThread = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getErrorStream())
            )) {
                String line;

                while ((line = reader.readLine()) != null) {
                    stderr.append(line).append(System.lineSeparator());
                    System.out.println(line);
                }
            } catch (Exception exception) {
                stderr.append(exception.getMessage()).append(System.lineSeparator());
            }
        });

        stderrThread.start();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
        )) {
            String line;

            while ((line = reader.readLine()) != null) {
                stdout.append(line).append(System.lineSeparator());
            }
        }

        int exitCode = process.waitFor();
        stderrThread.join();

        if (exitCode != 0) {
            throw new RuntimeException("NFT mint failed:\n" + stderr);
        }

        String mintAddress = null;
        String transactionSignature = null;
        String collectionMintAddress = null;
        String collectionVerificationSignature = null;
        String collectionVerificationStatus = null;
        String nftMintStatus = null;

        // Parse the structured result lines emitted by mintNft.ts.
        for (String line : stdout.toString().split("\\R")) {
            if (line.startsWith("MINT_ADDRESS=")) {
                mintAddress = line.substring("MINT_ADDRESS=".length());
            }

            if (line.startsWith("TRANSACTION_SIGNATURE=")) {
                transactionSignature = line.substring("TRANSACTION_SIGNATURE=".length());
            }

            if (line.startsWith("COLLECTION_MINT_ADDRESS=")) {
                collectionMintAddress = line.substring("COLLECTION_MINT_ADDRESS=".length());
            }

            if (line.startsWith("COLLECTION_VERIFICATION_SIGNATURE=")) {
                collectionVerificationSignature = line.substring("COLLECTION_VERIFICATION_SIGNATURE=".length());
            }

            if (line.startsWith("COLLECTION_VERIFICATION_STATUS=")) {
                collectionVerificationStatus = line.substring("COLLECTION_VERIFICATION_STATUS=".length());
            }

            if (line.startsWith("NFT_MINT_STATUS=")) {
                nftMintStatus = line.substring("NFT_MINT_STATUS=".length());
            }
        }

        if (mintAddress == null || transactionSignature == null) {
            throw new RuntimeException("Unable to parse mint result:\n" + stdout);
        }

        if ("failed".equals(collectionVerificationStatus)) {
            System.out.println("Warning: NFT was minted, but collection verification failed.");
        }

        return new MintResult(
                mintAddress,
                transactionSignature,
                collectionMintAddress,
                collectionVerificationSignature,
                collectionVerificationStatus,
                nftMintStatus
        );
    }

    public record MintResult(
            String mintAddress,
            String transactionSignature,
            String collectionMintAddress,
            String collectionVerificationSignature,
            String collectionVerificationStatus,
            String nftMintStatus
    ) {
    }
}