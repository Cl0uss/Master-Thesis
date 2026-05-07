import functions.FileHashGenerator;
import functions.MetadataJsonWriter;
import functions.MimeTypeDetector;

import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class Main {

    public static void main(String[] args) throws Exception {

        Path rawFilesDirectory = Paths.get("rawFiles");

        if (!Files.exists(rawFilesDirectory)) {
            System.out.println("rawFiles directory not found.");
            return;
        }

        Path metadataDirectory = Paths.get("metadata");

        if (!Files.exists(metadataDirectory)) {
            Files.createDirectories(metadataDirectory);
        }

        // Temporary Arweave URI.
        // Later these values will be replaced automatically.
        String creatorWallet = "CJrVFRyTRYaA26oBoEKtB7fAyETu1PaBuDUZLSnPL7cG";
        String arweaveBaseUri = "https://arweave.net/DEMO_URI/";

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(rawFilesDirectory)) {

            for (Path filePath : stream) {

                if (!Files.isRegularFile(filePath)) {
                    continue;
                }
                
                String fileName = filePath.getFileName().toString();

                String mimeType = MimeTypeDetector.detect(filePath);
                String category = MimeTypeDetector.getCategory(mimeType);

                String baseName =
                        fileName.substring(0, fileName.lastIndexOf('.'));

                String suffix = MimeTypeDetector.getMetadataSuffix(mimeType);

                String metadataFileName = baseName + suffix + ".json";

                long fileSize = Files.size(filePath);

                String sha256 = FileHashGenerator.calculateSHA256(filePath);

                String arweaveAssetUri = arweaveBaseUri + fileName;

                Path outputPath =
                        metadataDirectory.resolve(metadataFileName);

                MetadataJsonWriter.write(
                        outputPath,
                        fileName,
                        arweaveAssetUri,
                        category,
                        mimeType,
                        fileSize,
                        sha256,
                        creatorWallet
                );

                System.out.println("----------------------------------");
                System.out.println("Metadata generated successfully.");
                System.out.println("Original file: " + fileName);
                System.out.println("Metadata file: " + metadataFileName);
                System.out.println("MIME type: " + mimeType);
                System.out.println("SHA-256: " + sha256);
            }
        }
    }
}
