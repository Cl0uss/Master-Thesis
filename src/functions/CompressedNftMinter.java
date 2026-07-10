package functions;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;

// Bridges Java pipeline code to the TypeScript compressed NFT mint script.
public class CompressedNftMinter {

    public static MintResult mintToCollection(
            String metadataUri,
            Path walletPath,
            String nftName,
            String symbol,
            String network
    ) throws Exception {

        ProcessBuilder processBuilder = new ProcessBuilder(
                "npx",
                "tsx",
                "scripts/mintCompressedNftToCollection.ts",
                metadataUri,
                nftName,
                symbol,
                walletPath.toString(),
                "--network",
                network
        );

        Process process = processBuilder.start();

        StringBuilder stdout = new StringBuilder();
        StringBuilder stderr = new StringBuilder();

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
                System.out.println(line);
            }
        }

        int exitCode = process.waitFor();
        stderrThread.join();

        if (exitCode != 0) {
            throw new RuntimeException("Compressed NFT mint failed:\n" + stderr + stdout);
        }

        String assetId = null;
        String merkleTree = null;
        String leafIndex = null;
        String owner = null;
        String collectionMintAddress = null;
        String transactionSignature = null;
        String mintStatus = null;

        for (String line : stdout.toString().split("\\R")) {
            if (line.startsWith("CNFT_MINT_STATUS=")) {
                mintStatus = line.substring("CNFT_MINT_STATUS=".length());
            }

            if (line.startsWith("ASSET_ID=")) {
                assetId = line.substring("ASSET_ID=".length());
            }

            if (line.startsWith("MERKLE_TREE=")) {
                merkleTree = line.substring("MERKLE_TREE=".length());
            }

            if (line.startsWith("LEAF_INDEX=")) {
                leafIndex = line.substring("LEAF_INDEX=".length());
            }

            if (line.startsWith("OWNER=")) {
                owner = line.substring("OWNER=".length());
            }

            if (line.startsWith("COLLECTION_MINT_ADDRESS=")) {
                collectionMintAddress = line.substring("COLLECTION_MINT_ADDRESS=".length());
            }

            if (line.startsWith("TRANSACTION_SIGNATURE=")) {
                transactionSignature = line.substring("TRANSACTION_SIGNATURE=".length());
            }
        }

        if (assetId == null || transactionSignature == null) {
            throw new RuntimeException("Unable to parse compressed NFT mint result:\n" + stdout);
        }

        return new MintResult(
                mintStatus,
                assetId,
                merkleTree,
                leafIndex,
                owner,
                collectionMintAddress,
                transactionSignature
        );
    }

    public record MintResult(
            String mintStatus,
            String assetId,
            String merkleTree,
            String leafIndex,
            String owner,
            String collectionMintAddress,
            String transactionSignature
    ) {
    }
}
