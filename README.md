# WikiVision

WikiVision is a distraction-free Wikipedia reader with synchronized text-to-speech narration and on-demand AI explanations for unfamiliar concepts.

The idea came about because audiobooks are often behind paywalls or expensive subscriptions. With WikiVision, anyone can turn open encyclopedic knowledge into narrated audio and learn productively for free.

*Note: This is an early, raw beta release. Some features may be unpolished, and future updates might follow.*

## Features

- **Synchronous Speech Narration:** Real-time word-by-word highlighting synced with voice playback and auto-scroll.
- **On-Demand AI Explanations:** Click any word or press `Alt + E` to generate simple, contextual explanations.
- **Multi-Provider AI Support:** Compatible with Groq, DeepSeek, OpenAI, Google Gemini, Anthropic Claude, and OpenRouter.
- **Distraction-Free Layout:** Automatically strips infoboxes, citation tags, footnotes, and navigation boxes.
- **Theme Support:** Fast switching between high-contrast dark and light modes.
- **PWA & Offline Ready:** Progressive Web App with local caching.
- **Zero External Dependencies:** Built on vanilla web standards and a lightweight Python 3 static runner.

## Quick Start

### Windows
```cmd
run.bat
```

### Linux / macOS
```bash
chmod +x run.sh
./run.sh
```

### Direct Python
```bash
python web-reader/server.py --port 8080
```

Open `http://localhost:8080` in your web browser.

## Configuration

WikiVision runs entirely in your browser. API keys are never sent to an intermediary server and are stored locally:

1. Configure your API key directly in the web UI settings drawer, or
2. Create a `config.env` file in the root directory (see `.env.example`).

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play / Pause narration |
| `Alt + E` | Explain word under cursor |
| `Esc` | Close dialog or settings drawer |
| `K` | Jump to Table of Contents |
| `T` | Toggle Dark / Light theme |

## Authors & Co-Authors

- **Creator & Lead Architect:** [Mr. Angelo (Rakysha)](https://github.com/Rakysha) · *he/him*
- **AI Co-Author & Pair Programmer:** [Claude](https://www.anthropic.com) (Anthropic)

## License

MIT License. See [LICENSE](LICENSE) for details.
