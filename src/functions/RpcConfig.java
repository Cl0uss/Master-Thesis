package functions;

import java.nio.file.Files;
import java.nio.file.Path;

// Holds private RPC settings loaded from config/rpc-config.json.
public class RpcConfig {

    private final String rpcUrl;

    private RpcConfig(String rpcUrl) {
        this.rpcUrl = rpcUrl;
    }

    public static RpcConfig load(Path configPath) throws Exception {
        String json = Files.readString(configPath);
        return new RpcConfig(extractString(json, "rpcUrl"));
    }

    private static String extractString(String json, String key) {
        int start = json.indexOf("\"" + key + "\"");

        if (start == -1) {
            throw new RuntimeException("Missing RPC config key: " + key);
        }

        int colon = json.indexOf(":", start);
        int firstQuote = json.indexOf("\"", colon);
        int secondQuote = json.indexOf("\"", firstQuote + 1);

        return json.substring(firstQuote + 1, secondQuote);
    }

    public String rpcUrl() {
        return rpcUrl;
    }
}
