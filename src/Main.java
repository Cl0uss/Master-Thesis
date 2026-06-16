import functions.FileHashGenerator;
import functions.MetadataJsonWriter;
import functions.MimeTypeDetector;
import functions.IrysUploader;
import functions.NftMinter;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class Main {

    public static void main(String[] args) throws Exception {

        if (args.length == 0) {
            System.out.println("Please provide a file name.");
            System.out.println("Example: ./launch bonk.mp3");
            return;
        }

        String inputFileName = args[0];

        Path rawFilesDirectory = Paths.get("rawFiles");
        Path filePath = rawFilesDirectory.resolve(inputFileName);

        if (!Files.exists(filePath)) {
            System.out.println("File not found: " + filePath);
            return;
        }

        if (!Files.isRegularFile(filePath)) {
            System.out.println("Provided path is not a file: " + filePath);
            return;
        }

        Path metadataDirectory = Paths.get("metadata");

        if (!Files.exists(metadataDirectory)) {
            Files.createDirectories(metadataDirectory);
        }

        String creatorWallet = "9p2MgiUevA82gaJfAVeizSYD38bVMXiijGFcm8rxUXbS";

        Path walletPath = Paths.get(
                System.getProperty("user.home"),
                "Desktop",
                "thesis-wallet",
                "thesis-wallet.json"
        );

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
            Path coverPath = rawFilesDirectory
                    .resolve("covers")
                    .resolve(baseName + ".png");

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
        creatorWallet
        );

        System.out.println("Uploading metadata to Irys...");
        String irysMetadataUri = IrysUploader.upload(outputPath, walletPath);
        String nftName = baseName + " NFT";
        String nftSymbol = "TMDC";

        System.out.println("Minting NFT on Solana...");
        NftMinter.MintResult mintResult = NftMinter.mint(
                irysMetadataUri,
                walletPath,
                nftName,
                nftSymbol
        );

        System.out.println("----------------------------------");
        System.out.println("Metadata generated successfully.");
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
        System.out.println("NFT Mint Address: " + mintResult.mintAddress());
        System.out.println("NFT Transaction: " + mintResult.transactionSignature());
        System.out.println("NFT Explorer: https://explorer.solana.com/address/" + mintResult.mintAddress());
    }
}