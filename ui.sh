#!/usr/bin/env sh

set -eu

cd -- "$(dirname -- "$0")"

case "${1:-}" in
    ""|--mainnet|--main-net)
        npm run ui:mainnet
        ;;
    --devnet|--dev-net)
        npm run ui:devnet
        ;;
    --network)
        case "${2:-}" in
            mainnet)
                npm run ui:mainnet
                ;;
            devnet)
                npm run ui:devnet
                ;;
            *)
                echo "Usage: ./ui.sh [--mainnet|--main-net|--devnet|--dev-net|--network mainnet|devnet]"
                exit 1
                ;;
        esac
        ;;
    *)
        echo "Usage: ./ui.sh [--mainnet|--main-net|--devnet|--dev-net|--network mainnet|devnet]"
        exit 1
        ;;
esac
