package functions;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class AppConfig {

    private final String creatorWallet;
    private final Path walletPath;
    private final String secondWallet;
    private final String symbol;
    private final int sellerFeePercent;
    private final String network;
    private final String rpcUrl;
    private final Path rawFilesDirectory;
    private final Path metadataDirectory;
    private final Path coverDirectory;

    private AppConfig(
            String creatorWallet,
            Path walletPath,
            String secondWallet,
            String symbol,
            int sellerFeePercent,
            String network,
            String rpcUrl,
            Path rawFilesDirectory,
            Path metadataDirectory,
            Path coverDirectory
    ) {
        this.creatorWallet = creatorWallet;
        this.walletPath = walletPath;
        this.secondWallet = secondWallet;
        this.symbol = symbol;
        this.sellerFeePercent = sellerFeePercent;
        this.network = network;
        this.rpcUrl = rpcUrl;
        this.rawFilesDirectory = rawFilesDirectory;
        this.metadataDirectory = metadataDirectory;
        this.coverDirectory = coverDirectory;
    }

    public static AppConfig load(Path configPath) throws Exception {

        String json = Files.readString(configPath);

        String creatorWallet = extractString(json, "creatorWallet");
        Path walletPath = Paths.get(extractString(json, "walletPath"));
        String secondWallet = extractString(json, "secondWallet");
        String symbol = extractString(json, "symbol");
        int sellerFeePercent = extractInt(json, "sellerFeePercent");
        String network = extractString(json, "network");
        String rpcUrl = extractString(json, "rpcUrl");

        Path rawFilesDirectory =
                Paths.get(extractString(json, "rawFilesDirectory"));

        Path metadataDirectory =
                Paths.get(extractString(json, "metadataDirectory"));

        Path coverDirectory =
                Paths.get(extractString(json, "coverDirectory"));

        return new AppConfig(
                creatorWallet,
                walletPath,
                secondWallet,
                symbol,
                sellerFeePercent,
                network,
                rpcUrl,
                rawFilesDirectory,
                metadataDirectory,
                coverDirectory
        );
    }

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

    public String rpcUrl() {
        return rpcUrl;
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
}