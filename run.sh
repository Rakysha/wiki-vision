#!/usr/bin/env bash
# ==============================================================================
# WikiVision v1.0-beta — Cross-Platform Startup Script (Linux / macOS)
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$DIR/config.env"
WEB_CONFIG="$DIR/web-reader/config.local.json"

AI_PROVIDER="groq"
GROQ_KEY=""
BOTHUB_KEY=""
BOTHUB_MODEL="gpt-4o"
DEEPSEEK_KEY=""
OPENAI_KEY=""
OPENROUTER_KEY=""
GEMINI_KEY=""

echo "============================================================"
echo "     WikiVision v1.0-beta — AI Smart Wikipedia Reader"
echo "============================================================"
echo ""

# Find Python 3 binary
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo "[-] Error: Python 3 was not found on your system."
    echo "    Please install Python 3 (https://www.python.org/downloads/)."
    exit 1
fi

# Load existing configuration if available
if [ -f "$CONFIG_FILE" ]; then
    while IFS='=' read -r key value || [ -n "$key" ]; do
        # Ignore comments and empty lines
        [[ "$key" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$key" ]] && continue
        case "$key" in
            AI_PROVIDER) AI_PROVIDER="$value" ;;
            GROQ_API_KEY) GROQ_KEY="$value" ;;
            BOTHUB_API_KEY) BOTHUB_KEY="$value" ;;
            BOTHUB_MODEL) BOTHUB_MODEL="$value" ;;
            DEEPSEEK_API_KEY) DEEPSEEK_KEY="$value" ;;
            OPENAI_API_KEY) OPENAI_KEY="$value" ;;
            OPENROUTER_API_KEY) OPENROUTER_KEY="$value" ;;
            GEMINI_API_KEY) GEMINI_KEY="$value" ;;
        esac
    done < "$CONFIG_FILE"
fi

# Check if any key is defined
if [ -z "$GROQ_KEY" ] && [ -z "$BOTHUB_KEY" ] && [ -z "$DEEPSEEK_KEY" ] && [ -z "$OPENAI_KEY" ] && [ -z "$OPENROUTER_KEY" ] && [ -z "$GEMINI_KEY" ]; then
    echo "[WikiVision] No AI API keys detected."
    echo "AI explanation mentor allows intuitive on-demand analogies for complex terms."
    echo ""
    echo "Select preferred AI provider:"
    echo "  [1] Groq (Recommended: Free tier, ultra-low latency, no card required)"
    echo "  [2] BotHub (Recommended for RU/CIS: No VPN required, local payment methods)"
    echo "  [3] DeepSeek (Ultra-affordable & high intelligence, official API)"
    echo "  [4] OpenAI Official (GPT-4o mini)"
    echo "  [5] OpenRouter (200+ models)"
    echo "  [6] Google Gemini (Free tier)"
    echo "  [7] Skip for now (configure later inside UI settings)"
    echo ""
    read -p "Your choice [1-7] (default 1): " PCHOICE
    PCHOICE="${PCHOICE:-1}"

    case "$PCHOICE" in
        1)
            AI_PROVIDER="groq"
            echo "Get free Groq key: https://console.groq.com/keys"
            read -p ">>> Enter Groq API Key (gsk_...): " GROQ_KEY
            ;;
        2)
            AI_PROVIDER="bothub"
            echo "Get BotHub key: https://bothub.chat"
            read -p ">>> Enter BotHub API Key: " BOTHUB_KEY
            BOTHUB_MODEL="gpt-4o"
            ;;
        3)
            AI_PROVIDER="deepseek"
            echo "Get DeepSeek key: https://platform.deepseek.com/api_keys"
            read -p ">>> Enter DeepSeek API Key (sk-...): " DEEPSEEK_KEY
            ;;
        4)
            AI_PROVIDER="openai"
            echo "Get OpenAI key: https://platform.openai.com/api-keys"
            read -p ">>> Enter OpenAI API Key (sk-...): " OPENAI_KEY
            ;;
        5)
            AI_PROVIDER="openrouter"
            echo "Get OpenRouter key: https://openrouter.ai/keys"
            read -p ">>> Enter OpenRouter API Key (sk-or-...): " OPENROUTER_KEY
            ;;
        6)
            AI_PROVIDER="gemini"
            echo "Get Gemini key: https://aistudio.google.com/app/apikey"
            read -p ">>> Enter Gemini API Key (AIzaSy...): " GEMINI_KEY
            ;;
    esac

    # Save to config.env
    cat <<EOF > "$CONFIG_FILE"
AI_PROVIDER=$AI_PROVIDER
GROQ_API_KEY=$GROQ_KEY
BOTHUB_API_KEY=$BOTHUB_KEY
BOTHUB_MODEL=$BOTHUB_MODEL
DEEPSEEK_API_KEY=$DEEPSEEK_KEY
OPENAI_API_KEY=$OPENAI_KEY
OPENROUTER_API_KEY=$OPENROUTER_KEY
GEMINI_API_KEY=$GEMINI_KEY
EOF
    echo "[Notify] Configuration saved to config.env"
    echo ""
fi

# Synchronize web-reader/config.local.json (isolated in .gitignore)
cat <<EOF > "$WEB_CONFIG"
{
  "AI_PROVIDER": "$AI_PROVIDER",
  "GROQ_API_KEY": "$GROQ_KEY",
  "BOTHUB_API_KEY": "$BOTHUB_KEY",
  "BOTHUB_MODEL": "$BOTHUB_MODEL",
  "DEEPSEEK_API_KEY": "$DEEPSEEK_KEY",
  "OPENAI_API_KEY": "$OPENAI_KEY",
  "OPENROUTER_API_KEY": "$OPENROUTER_KEY",
  "GEMINI_API_KEY": "$GEMINI_KEY"
}
EOF

echo "[+] WikiVision v1.0-beta is ready!"
echo "[+] Starting local web server on http://localhost:8080 ..."

# Open browser helper
open_browser() {
    sleep 1
    if command -v xdg-open &>/dev/null; then
        xdg-open "http://localhost:8080" &>/dev/null || true
    elif command -v open &>/dev/null; then
        open "http://localhost:8080" &>/dev/null || true
    fi
}

open_browser &
$PYTHON_CMD "$DIR/web-reader/server.py" --port 8080
