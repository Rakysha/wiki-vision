# Security & Privacy Policy — WikiVision

## 🔐 Client-Side Zero-Telemetry Guarantee

WikiVision is designed with a **privacy-first architecture**:

1. **Direct Browser-to-API Calls**:
   All communication with LLM providers (Groq, BotHub, DeepSeek, OpenAI, Google Gemini, Anthropic Claude, OpenRouter) occurs directly from the user's browser client over HTTPS.
2. **No Middleman Logging**:
   There is no intermediary backend proxy storing, logging, or relaying your API keys or article queries.
3. **Local Credentials Storage**:
   API keys are persisted strictly in your browser's `localStorage` or in your private `web-reader/config.local.json` file.
4. **Git Protection**:
   Files matching `config.env`, `*.env`, and `web-reader/config.local.json` are permanently ignored via `.gitignore` to prevent inadvertent leaks.

## 🛡️ Supported Versions

| Version | Supported |
| :--- | :--- |
| **v1.0-beta** | :white_check_mark: Active |
| < 1.0 | :x: Deprecated |

## 🚨 Reporting a Vulnerability

If you identify a security issue or credential exposure risk:
1. Please **do not** open a public GitHub issue.
2. Submit your report privately with reproduction steps to the repository maintainers or security contacts.
3. We will acknowledge receipt within 48 hours and work with you on a coordinated fix.
