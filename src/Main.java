import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import functions.AppConfig;
import functions.FileHashGenerator;
import functions.IrysUploader;
import functions.MetadataJsonWriter;
import functions.MimeTypeDetector;
import functions.NftMinter;

// Runs the full asset-to-metadata pipeline and optionally mints an NFT.
public class Main {

    public static void main(String[] args) throws Exception {

        if (args.length == 0) {
            System.out.println("Please provide a file name.");
            System.out.println("Example: ./launch bonk.mp3");
            System.out.println("Example with NFT mint: ./launch bonk.mp3 --mint");
            return;
        }

        // Parse optional flags after the input file name.
        boolean shouldMint = false;
        Path walletOverride = null;

        for (int i = 1; i < args.length; i++) {
            if (args[i].equals("--mint")) {
                shouldMint = true;
            } else if (args[i].equals("--wallet")) {
                if (i + 1 >= args.length) {
                    System.out.println("Missing value for --wallet");
                    return;
                }

                walletOverride = Paths.get(args[++i]);
            } else {
                System.out.println("Unknown option: " + args[i]);
                System.out.println("Supported options: --mint, --wallet <path>");
                return;
            }
        }

        // Load all runtime settings from the shared JSON config.
        AppConfig config = AppConfig.load(Paths.get("config", "app-config.json"));

        String inputFileName = args[0];

        Path rawFilesDirectory = config.rawFilesDirectory();
        Path filePath = rawFilesDirectory.resolve(inputFileName);

        // Stop early if the requested source file is missing or invalid.
        if (!Files.exists(filePath)) {
            System.out.println("File not found: " + filePath);
            return;
        }

        if (!Files.isRegularFile(filePath)) {
            System.out.println("Provided path is not a file: " + filePath);
            return;
        }

        // Ensure the generated metadata output directory exists.
        Path metadataDirectory = config.metadataDirectory();

        if (!Files.exists(metadataDirectory)) {
            Files.createDirectories(metadataDirectory);
        }

        Path walletPath = walletOverride != null ? walletOverride : config.walletPath();

        String fileName = filePath.getFileName().toString();

        // Detect media type and derive the metadata file naming convention.
        String mimeType = MimeTypeDetector.detect(filePath);
        String category = MimeTypeDetector.getCategory(mimeType);

        String baseName = fileName.substring(0, fileName.lastIndexOf('.'));
        String suffix = MimeTypeDetector.getMetadataSuffix(mimeType);

        String metadataFileName = baseName + suffix + ".json";

        // Collect file integrity details that will be written into metadata.
        long fileSize = Files.size(filePath);
        String sha256 = FileHashGenerator.calculateSHA256(filePath);

        // Upload the original asset first; the returned URI is used in metadata.
        System.out.println("Step 1: Uploading asset to Irys: " + filePath);
        String irysAssetUri = IrysUploader.upload(filePath, walletPath);
        System.out.println("Asset upload completed: " + irysAssetUri);

        String irysCoverUri = null;

        // Audio and document NFTs need a separate cover image for the metadata image field.
        if (category.equals("audio") || category.equals("document")) {
            Path coverPath = config.coverDirectory().resolve(baseName + config.coverExtension());

            if (!Files.exists(coverPath)) {
                System.out.println("Cover image not found: " + coverPath);
                return;
            }

            System.out.println("Step 2: Uploading cover image to Irys: " + coverPath);
            irysCoverUri = IrysUploader.upload(coverPath, walletPath);
            System.out.println("Cover upload completed: " + irysCoverUri);
        }

        // Write the NFT-compatible metadata JSON locally before uploading it.
        Path outputPath = metadataDirectory.resolve(metadataFileName);

        System.out.println("Step 3: Writing metadata JSON: " + outputPath);
        MetadataJsonWriter.write(
                outputPath,
                fileName,
                irysAssetUri,
                irysCoverUri,
                category,
                mimeType,
                fileSize,
                sha256,
                config.creatorWallet(),
                config.symbol(),
                config.sellerFeePercent(),
                config.metadataDescription()
        );

        System.out.println("Metadata JSON written: " + outputPath);

        // Upload the metadata JSON and use its URI for the optional NFT mint.
        System.out.println("Step 4: Uploading metadata JSON to Irys: " + outputPath);
        String irysMetadataUri = IrysUploader.upload(outputPath, walletPath);
        System.out.println("Metadata upload completed: " + irysMetadataUri);

        NftMinter.MintResult mintResult = null;

        // Mint only when the caller explicitly passes --mint.
        if (shouldMint) {
            String nftName = config.nftName(baseName);
            String nftSymbol = config.symbol();

            System.out.println("Step 5: Minting NFT on Solana using metadata URI: " + irysMetadataUri);
            mintResult = NftMinter.mint(
                irysMetadataUri,
                walletPath,
                nftName,
                nftSymbol,
                config.rpcUrl(),
                config.sellerFeePercent()
            );
            System.out.println("NFT mint completed: " + mintResult.mintAddress());
        }

        // Print a final summary of generated files, uploaded URIs, and mint result.
        System.out.println("----------------------------------");
        System.out.println("Pipeline completed successfully.");
        System.out.println("Original file: " + fileName);
        System.out.println("Asset URI: " + irysAssetUri);

        if (irysCoverUri != null) {
            System.out.println("Cover URI: " + irysCoverUri);
        }

        System.out.println("Metadata file: " + metadataFileName);
        System.out.println("Metadata URI: " + irysMetadataUri);
        System.out.println("MIME type: " + mimeType);
        System.out.println("SHA-256: " + sha256);
        System.out.println("Output path: " + outputPath);

        if (mintResult != null) {
            System.out.println("NFT Mint Address: " + mintResult.mintAddress());
            System.out.println("NFT Transaction: " + mintResult.transactionSignature());
            System.out.println("NFT Explorer: https://explorer.solana.com/address/" + mintResult.mintAddress());
        } else {
            System.out.println("NFT mint skipped. Run with --mint to mint on Solana.");
        }
    }
}