import functions.FileHashGenerator;
import functions.MetadataJsonWriter;
import functions.MimeTypeDetector;
import functions.ArWeaveUploader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class Main {

    public static void main(String[] args) throws Exception {

        if (args.length == 0) {
            System.out.println("Please provide a file name.");
            System.out.println("Example: java -cp src Main bonk.mp3");
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

        String creatorWallet = "CJrVFRyTRYaA26oBoEKtB7fAyETu1PaBuDUZLSnPL7cG";

        // Temporary Arweave URI.
        // Later this value will come from automatic Arweave upload.
        String arweaveBaseUri = "https://arweave.net/DEMO_URI/";

        String fileName = filePath.getFileName().toString();

        String mimeType = MimeTypeDetector.detect(filePath);
        String category = MimeTypeDetector.getCategory(mimeType);

        String baseName = fileName.substring(0, fileName.lastIndexOf('.'));
        String suffix = MimeTypeDetector.getMetadataSuffix(mimeType);

        String metadataFileName = baseName + suffix + ".json";

        long fileSize = Files.size(filePath);
        String sha256 = FileHashGenerator.calculateSHA256(filePath);

        String arweaveAssetUri = arweaveBaseUri + fileName;

        Path outputPath = metadataDirectory.resolve(metadataFileName);

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
        System.out.println("Output path: " + outputPath);
    }
}