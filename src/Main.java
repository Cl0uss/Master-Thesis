import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import functions.AppConfig;
import functions.FileHashGenerator;
import functions.IrysUploader;
import functions.MetadataJsonWriter;
import functions.MimeTypeDetector;
import functions.NftMinter;

public class Main {

    public static void main(String[] args) throws Exception {

        if (args.length == 0) {
            System.out.println("Please provide a file name.");
            System.out.println("Example: ./launch bonk.mp3");
            System.out.println("Example with NFT mint: ./launch bonk.mp3 --mint");
            return;
        }

        boolean shouldMint = false;

        for (int i = 1; i < args.length; i++) {
            if (args[i].equals("--mint")) {
                shouldMint = true;
            } else {
                System.out.println("Unknown option: " + args[i]);
                System.out.println("Supported option: --mint");
                return;
            }
        }

        AppConfig config = AppConfig.load(Paths.get("config", "app-config.json"));

        String inputFileName = args[0];

        Path rawFilesDirectory = config.rawFilesDirectory();
        Path filePath = rawFilesDirectory.resolve(inputFileName);

        if (!Files.exists(filePath)) {
            System.out.println("File not found: " + filePath);
            return;
        }

        if (!Files.isRegularFile(filePath)) {
            System.out.println("Provided path is not a file: " + filePath);
            return;
        }

        Path metadataDirectory = config.metadataDirectory();

        if (!Files.exists(metadataDirectory)) {
            Files.createDirectories(metadataDirectory);
        }

        Path walletPath = config.walletPath();

        String fileName = filePath.getFileName().toString();

        String mimeType = MimeTypeDetector.detect(filePath);
        String category = MimeTypeDetector.getCategory(mimeType);

        String baseName = fileName.substring(0, fileName.lastIndexOf('.'));
        String suffix = MimeTypeDetector.getMetadataSuffix(mimeType);

        String metadataFileName = baseName + suffix + ".json";

        long fileSize = Files.size(filePath);
        String sha256 = FileHashGenerator.calculateSHA256(filePath);

        System.out.println("Uploading file to Irys...");
        String irysAssetUri = IrysUploader.upload(filePath, walletPath);

        String irysCoverUri = null;

        if (category.equals("audio") || category.equals("document")) {
            Path coverPath = config.coverDirectory().resolve(baseName + ".png");

            if (!Files.exists(coverPath)) {
                System.out.println("Cover image not found: " + coverPath);
                return;
            }

            System.out.println("Uploading cover image to Irys...");
            irysCoverUri = IrysUploader.upload(coverPath, walletPath);
        }

        Path outputPath = metadataDirectory.resolve(metadataFileName);

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
                config.symbol()
        );

        System.out.println("Uploading metadata to Irys...");
        String irysMetadataUri = IrysUploader.upload(outputPath, walletPath);

        NftMinter.MintResult mintResult = null;

        if (shouldMint) {
            String nftName = baseName + " NFT";
            String nftSymbol = config.symbol();

            System.out.println("Minting NFT on Solana...");
            mintResult = NftMinter.mint(
                irysMetadataUri,
                walletPath,
                nftName,
                nftSymbol,
                config.rpcUrl()
            );
        }

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