import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import functions.AppConfig;
import functions.CompressedNftMinter;
import functions.FileHashGenerator;
import functions.IrysUploader;
import functions.MetadataJsonWriter;
import functions.MerkleTreeManager;
import functions.MimeTypeDetector;
import functions.NftMinter;
import functions.RpcConfig;

// Runs the full asset-to-metadata pipeline and optionally mints standard and compressed NFTs.
public class Main {
    private static final int METAPLEX_NAME_MAX_BYTES = 32;

    public static void main(String[] args) throws Exception {

        if (args.length == 0) {
            System.out.println("Please provide a file name.");
            System.out.println("Example: ./launch bonk.mp3");
            System.out.println("Example with NFT mint: ./launch bonk.mp3 --mint");
            System.out.println("Example with standard NFT and cNFT mint: ./launch bonk.mp3 --mint-all --network mainnet");
            return;
        }

        // Parse optional flags after the input file name.
        boolean shouldMint = false;
        boolean shouldMintCompressedNft = false;
        Path walletOverride = null;
        Path storageWalletOverride = null;
        String network = System.getenv().getOrDefault("NETWORK", "mainnet");

        for (int i = 1; i < args.length; i++) {
            if (args[i].equals("--mint")) {
                shouldMint = true;
            } else if (args[i].equals("--mint-cnft")) {
                shouldMintCompressedNft = true;
            } else if (args[i].equals("--mint-all")) {
                shouldMint = true;
                shouldMintCompressedNft = true;
            } else if (args[i].equals("--wallet")) {
                if (i + 1 >= args.length) {
                    System.out.println("Missing value for --wallet");
                    return;
                }

                walletOverride = Paths.get(args[++i]);
            } else if (args[i].equals("--storage-wallet")) {
                if (i + 1 >= args.length) {
                    System.out.println("Missing value for --storage-wallet");
                    return;
                }

                storageWalletOverride = Paths.get(args[++i]);
            } else if (args[i].equals("--network")) {
                if (i + 1 >= args.length) {
                    System.out.println("Missing value for --network");
                    return;
                }

                network = args[++i];
            } else {
                System.out.println("Unknown option: " + args[i]);
                System.out.println("Supported options: --mint, --mint-cnft, --mint-all, --wallet <path>, --storage-wallet <path>, --network <mainnet|devnet>");
                return;
            }
        }

        if (!network.equals("mainnet") && !network.equals("devnet")) {
            System.out.println("Invalid network: " + network + ". Expected \"mainnet\" or \"devnet\".");
            return;
        }

        Path networkConfigDirectory = Paths.get("config", network);

        AppConfig config = AppConfig.load(networkConfigDirectory.resolve("app-config.json"));
        AppConfig storageConfig = AppConfig.load(Paths.get("config", "mainnet", "app-config.json"));

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

        // Storage remains independent from the Solana mint cluster. By default,
        // Irys uses the known funded wallet while minting uses the selected network wallet.
        Path storageWalletPath = storageWalletOverride != null
                ? storageWalletOverride
                : storageConfig.walletPath();
        Path mintWalletPath = walletOverride != null
                ? walletOverride
                : config.walletPath();

        System.out.println("Irys storage wallet: " + storageWalletPath);
        System.out.println("Solana mint wallet: " + mintWalletPath);

        if (shouldMintCompressedNft) {
            try {
                MerkleTreeManager.ensureMerkleTree(networkConfigDirectory, mintWalletPath, network);
            } catch (RuntimeException exception) {
                System.out.println(exception.getMessage());
                System.exit(1);
            }
        }

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
        String irysAssetUri = IrysUploader.upload(filePath, storageWalletPath);
        System.out.println("Asset upload completed: " + irysAssetUri);

        String irysCoverUri = null;

        // Audio and document assets can use a separate cover image, but the
        // pipeline continues without one by reusing the asset URI as metadata image.
        if (category.equals("audio") || category.equals("document")) {
            Path coverPath = config.coverDirectory().resolve(baseName + config.coverExtension());

            if (Files.exists(coverPath)) {
                System.out.println("Step 2: Uploading cover image to Irys: " + coverPath);
                irysCoverUri = IrysUploader.upload(coverPath, storageWalletPath);
                System.out.println("Cover upload completed: " + irysCoverUri);
            } else {
                System.out.println("Optional cover image not found: " + coverPath);
                System.out.println("Continuing without cover; metadata image will use the asset URI.");
            }
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
                config.studentWallet(),
                config.symbol(),
                config.sellerFeePercent(),
                config.creatorRoyaltyShare(),
                config.studentRoyaltyShare(),
                config.metadataDescription()
        );

        System.out.println("Metadata JSON written: " + outputPath);

        // Upload the metadata JSON and use its URI for the optional NFT mint.
        System.out.println("Step 4: Uploading metadata JSON to Irys: " + outputPath);
        String irysMetadataUri = IrysUploader.upload(outputPath, storageWalletPath);
        System.out.println("Metadata upload completed: " + irysMetadataUri);

        NftMinter.MintResult mintResult = null;
        CompressedNftMinter.MintResult compressedMintResult = null;
        String nftName = fitMetaplexName(config.nftName(baseName), " NFT");
        String compressedNftName = fitMetaplexName(baseName + " cNFT", " cNFT");
        String nftSymbol = config.symbol();

        // Mint only when the caller explicitly passes --mint.
        if (shouldMint) {
            RpcConfig rpcConfig = RpcConfig.load(networkConfigDirectory.resolve("rpc-config.json"));

            System.out.println("Step 5: Minting NFT on Solana using metadata URI: " + irysMetadataUri);
            mintResult = NftMinter.mint(
                irysMetadataUri,
                mintWalletPath,
                nftName,
                nftSymbol,
                rpcConfig.rpcUrl(),
                config.sellerFeePercent(),
                network
            );
            System.out.println("NFT mint completed: " + mintResult.mintAddress());
        }

        if (shouldMintCompressedNft) {
            System.out.println("Step 6: Minting compressed NFT into collection using metadata URI: " + irysMetadataUri);
            compressedMintResult = CompressedNftMinter.mintToCollection(
                    irysMetadataUri,
                    mintWalletPath,
                    compressedNftName,
                    nftSymbol,
                    network
            );
            System.out.println("Compressed NFT mint completed: " + compressedMintResult.assetId());
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
            System.out.println("NFT Explorer: " + explorerAddressUrl(mintResult.mintAddress(), network));
        } else {
            System.out.println("NFT mint skipped. Run with --mint to mint on Solana.");
        }

        if (compressedMintResult != null) {
            System.out.println("cNFT Asset ID: " + compressedMintResult.assetId());
            System.out.println("cNFT Merkle Tree: " + compressedMintResult.merkleTree());
            System.out.println("cNFT Leaf Index: " + compressedMintResult.leafIndex());
            System.out.println("cNFT Owner: " + compressedMintResult.owner());
            System.out.println("cNFT Collection Mint: " + compressedMintResult.collectionMintAddress());
            System.out.println("cNFT Transaction: " + compressedMintResult.transactionSignature());
            System.out.println("cNFT Explorer: " + explorerAddressUrl(compressedMintResult.assetId(), network));
        } else {
            System.out.println("cNFT mint skipped. Run with --mint-cnft to mint a compressed NFT into the configured collection.");
        }

        Path linksFile = writePipelineLinks(
                baseName,
                fileName,
                network,
                storageWalletPath,
                mintWalletPath,
                irysAssetUri,
                irysCoverUri,
                irysMetadataUri,
                outputPath,
                mintResult,
                compressedMintResult
        );
        System.out.println("Links report: " + linksFile);
    }

    private static Path writePipelineLinks(
            String baseName,
            String fileName,
            String network,
            Path storageWalletPath,
            Path mintWalletPath,
            String irysAssetUri,
            String irysCoverUri,
            String irysMetadataUri,
            Path outputPath,
            NftMinter.MintResult mintResult,
            CompressedNftMinter.MintResult compressedMintResult
    ) throws Exception {
        Path linksDirectory = Paths.get("out", "pipeline-links");
        Files.createDirectories(linksDirectory);

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        String safeBaseName = sanitizeReportName(baseName);
        Path linksFile = linksDirectory.resolve(timestamp + "-" + network + "-" + safeBaseName + "-links.txt");

        StringBuilder report = new StringBuilder();
        report.append("Pipeline Links Report").append(System.lineSeparator());
        report.append("=====================").append(System.lineSeparator());
        report.append("Created At: ").append(LocalDateTime.now()).append(System.lineSeparator());
        report.append("Network: ").append(network).append(System.lineSeparator());
        report.append("Original File: ").append(fileName).append(System.lineSeparator());
        report.append("Metadata File: ").append(outputPath).append(System.lineSeparator());
        report.append("Irys Storage Wallet: ").append(storageWalletPath).append(System.lineSeparator());
        report.append("Solana Mint Wallet: ").append(mintWalletPath).append(System.lineSeparator());
        report.append(System.lineSeparator());

        report.append("Irys").append(System.lineSeparator());
        report.append("Asset URI: ").append(irysAssetUri).append(System.lineSeparator());

        if (irysCoverUri != null) {
            report.append("Cover URI: ").append(irysCoverUri).append(System.lineSeparator());
        }

        report.append("Metadata URI: ").append(irysMetadataUri).append(System.lineSeparator());
        report.append(System.lineSeparator());

        report.append("Standard NFT").append(System.lineSeparator());
        if (mintResult != null) {
            report.append("Mint Address: ").append(mintResult.mintAddress()).append(System.lineSeparator());
            report.append("Transaction: ").append(mintResult.transactionSignature()).append(System.lineSeparator());
            report.append("Explorer: ").append(explorerAddressUrl(mintResult.mintAddress(), network)).append(System.lineSeparator());
            report.append("Transaction Explorer: ").append(explorerTransactionUrl(mintResult.transactionSignature(), network)).append(System.lineSeparator());
        } else {
            report.append("Skipped").append(System.lineSeparator());
        }
        report.append(System.lineSeparator());

        report.append("Compressed NFT").append(System.lineSeparator());
        if (compressedMintResult != null) {
            report.append("Asset ID: ").append(compressedMintResult.assetId()).append(System.lineSeparator());
            report.append("Merkle Tree: ").append(compressedMintResult.merkleTree()).append(System.lineSeparator());
            report.append("Leaf Index: ").append(compressedMintResult.leafIndex()).append(System.lineSeparator());
            report.append("Owner: ").append(compressedMintResult.owner()).append(System.lineSeparator());
            report.append("Collection Mint: ").append(compressedMintResult.collectionMintAddress()).append(System.lineSeparator());
            report.append("Transaction: ").append(compressedMintResult.transactionSignature()).append(System.lineSeparator());
            report.append("Explorer: ").append(explorerAddressUrl(compressedMintResult.assetId(), network)).append(System.lineSeparator());
            report.append("Transaction Explorer: ").append(explorerTransactionUrl(compressedMintResult.transactionSignature(), network)).append(System.lineSeparator());
        } else {
            report.append("Skipped").append(System.lineSeparator());
        }

        Files.writeString(linksFile, report.toString(), StandardCharsets.UTF_8);
        Files.writeString(linksDirectory.resolve("latest-links.txt"), report.toString(), StandardCharsets.UTF_8);

        return linksFile;
    }

    private static String fitMetaplexName(String value, String preferredSuffix) {
        if (utf8Length(value) <= METAPLEX_NAME_MAX_BYTES) {
            return value;
        }

        if (value.endsWith(preferredSuffix)) {
            int suffixBytes = utf8Length(preferredSuffix);
            int baseByteLimit = METAPLEX_NAME_MAX_BYTES - suffixBytes;
            String baseValue = value.substring(0, value.length() - preferredSuffix.length());

            if (baseByteLimit > 0) {
                return truncateUtf8(baseValue, baseByteLimit) + preferredSuffix;
            }
        }

        return truncateUtf8(value, METAPLEX_NAME_MAX_BYTES);
    }

    private static int utf8Length(String value) {
        return value.getBytes(StandardCharsets.UTF_8).length;
    }

    private static String truncateUtf8(String value, int maxBytes) {
        StringBuilder builder = new StringBuilder();
        int usedBytes = 0;

        for (int offset = 0; offset < value.length();) {
            int codePoint = value.codePointAt(offset);
            String character = new String(Character.toChars(codePoint));
            int characterBytes = utf8Length(character);

            if (usedBytes + characterBytes > maxBytes) {
                break;
            }

            builder.append(character);
            usedBytes += characterBytes;
            offset += Character.charCount(codePoint);
        }

        return builder.toString();
    }

    private static String explorerAddressUrl(String address, String network) {
        return "https://explorer.solana.com/address/" + address + explorerClusterQuery(network);
    }

    private static String explorerTransactionUrl(String signature, String network) {
        return "https://explorer.solana.com/tx/" + signature + explorerClusterQuery(network);
    }

    private static String explorerClusterQuery(String network) {
        return network.equals("devnet") ? "?cluster=devnet" : "";
    }

    private static String sanitizeReportName(String value) {
        String sanitized = value.replaceAll("[^a-zA-Z0-9._-]", "_");

        if (sanitized.length() > 80) {
            return sanitized.substring(0, 80);
        }

        return sanitized;
    }
}
