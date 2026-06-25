package functions;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

// Holds non-secret runtime values loaded from config/app-config.json.
public class AppConfig {

    private final String appName;
    private final String creatorWallet;
    private final Path walletPath;
    private final String secondWallet;
    private final String symbol;
    private final int sellerFeePercent;
    private final String network;
    private final Path rawFilesDirectory;
    private final Path metadataDirectory;
    private final Path coverDirectory;
    private final String coverExtension;
    private final String nftNameTemplate;
    private final String metadataDescription;
    private final String irysGatewayUrl;
    private final String irysFundingBufferSol;
    private final int estimatedMetadataSizeBytes;
    private final String estimatedMintCostSol;

    private AppConfig(
            String appName,
            String creatorWallet,
            Path walletPath,
            String secondWallet,
            String symbol,
            int sellerFeePercent,
            String network,
            Path rawFilesDirectory,
            Path metadataDirectory,
            Path coverDirectory,
            String coverExtension,
            String nftNameTemplate,
            String metadataDescription,
            String irysGatewayUrl,
            String irysFundingBufferSol,
            int estimatedMetadataSizeBytes,
            String estimatedMintCostSol
    ) {
        this.appName = appName;
        this.creatorWallet = creatorWallet;
        this.walletPath = walletPath;
        this.secondWallet = secondWallet;
        this.symbol = symbol;
        this.sellerFeePercent = sellerFeePercent;
        this.network = network;
        this.rawFilesDirectory = rawFilesDirectory;
        this.metadataDirectory = metadataDirectory;
        this.coverDirectory = coverDirectory;
        this.coverExtension = coverExtension;
        this.nftNameTemplate = nftNameTemplate;
        this.metadataDescription = metadataDescription;
        this.irysGatewayUrl = irysGatewayUrl;
        this.irysFundingBufferSol = irysFundingBufferSol;
        this.estimatedMetadataSizeBytes = estimatedMetadataSizeBytes;
        this.estimatedMintCostSol = estimatedMintCostSol;
    }

    // Reads the config file and maps every supported key into typed fields.
    public static AppConfig load(Path configPath) throws Exception {

        String json = Files.readString(configPath);

        String appName = extractString(json, "appName");
        String creatorWallet = extractString(json, "creatorWallet");
        Path walletPath = Paths.get(extractString(json, "walletPath"));
        String secondWallet = extractString(json, "secondWallet");
        String symbol = extractString(json, "symbol");
        int sellerFeePercent = extractInt(json, "sellerFeePercent");
        String network = extractString(json, "network");
        String coverExtension = extractString(json, "coverExtension");
        String nftNameTemplate = extractString(json, "nftNameTemplate");
        String metadataDescription = extractString(json, "metadataDescription");
        String irysGatewayUrl = extractString(json, "irysGatewayUrl");
        String irysFundingBufferSol = extractString(json, "irysFundingBufferSol");
        int estimatedMetadataSizeBytes = extractInt(json, "estimatedMetadataSizeBytes");
        String estimatedMintCostSol = extractString(json, "estimatedMintCostSol");

        Path rawFilesDirectory =
                Paths.get(extractString(json, "rawFilesDirectory"));

        Path metadataDirectory =
                Paths.get(extractString(json, "metadataDirectory"));

        Path coverDirectory =
                Paths.get(extractString(json, "coverDirectory"));

        return new AppConfig(
                appName,
                creatorWallet,
                walletPath,
                secondWallet,
                symbol,
                sellerFeePercent,
                network,
                rawFilesDirectory,
                metadataDirectory,
                coverDirectory,
                coverExtension,
                nftNameTemplate,
                metadataDescription,
                irysGatewayUrl,
                irysFundingBufferSol,
                estimatedMetadataSizeBytes,
                estimatedMintCostSol
        );
    }

    // Extracts a string value from the flat JSON config.
    private static String extractString(String json, String key) {

        int start = json.indexOf("\"" + key + "\"");

        if (start == -1) {
            throw new RuntimeException(
                    "Missing config key: " + key
            );
        }

        int colon = json.indexOf(":", start);
        int firstQuote = json.indexOf("\"", colon);
        int secondQuote = json.indexOf("\"", firstQuote + 1);

        return json.substring(firstQuote + 1, secondQuote);
    }

    // Extracts an integer value from the flat JSON config.
    private static int extractInt(String json, String key) {

        int start = json.indexOf("\"" + key + "\"");

        if (start == -1) {
            throw new RuntimeException(
                    "Missing config key: " + key
            );
        }

        int colon = json.indexOf(":", start);

        int current = colon + 1;

        while (Character.isWhitespace(json.charAt(current))) {
            current++;
        }

        int end = current;

        while (Character.isDigit(json.charAt(end))) {
            end++;
        }

        return Integer.parseInt(
                json.substring(current, end)
        );
    }

    public String appName() {
        return appName;
    }

    public String creatorWallet() {
        return creatorWallet;
    }

    public Path walletPath() {
        return walletPath;
    }

    public String secondWallet() {
        return secondWallet;
    }

    public String symbol() {
        return symbol;
    }

    public int sellerFeePercent() {
        return sellerFeePercent;
    }

    public String network() {
        return network;
    }


    public Path rawFilesDirectory() {
        return rawFilesDirectory;
    }

    public Path metadataDirectory() {
        return metadataDirectory;
    }

    public Path coverDirectory() {
        return coverDirectory;
    }

    public String coverExtension() {
        return coverExtension;
    }

    // Builds the NFT name from the configured template and source base name.
    public String nftName(String baseName) {
        return nftNameTemplate.replace("{baseName}", baseName);
    }

    public String metadataDescription() {
        return metadataDescription;
    }

    public String irysGatewayUrl() {
        return irysGatewayUrl;
    }

    public String irysFundingBufferSol() {
        return irysFundingBufferSol;
    }

    public int estimatedMetadataSizeBytes() {
        return estimatedMetadataSizeBytes;
    }

    public String estimatedMintCostSol() {
        return estimatedMintCostSol;
    }
}
