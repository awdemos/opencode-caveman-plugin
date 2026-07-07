# OpenCode Caveman Plugin

A global OpenCode plugin that adds a **"Caveman mode"** toggle per project. When enabled, it injects a distilled system prompt that aggressively compresses language while preserving all technical accuracy (code, commands, API shapes, constraints).

## Features

- **Three intensity levels**: `low` | `medium` | `high` (aliases: `lite` | `full` | `ultra`)
- **Chat commands**: `@caveman on|off|low|medium|high`, plus natural-language toggles
- **Minimal token overhead**: ruleset tuned to ~150–250 tokens (not 800+)
- **Modern OpenCode hooks**: `event` (`session.created`), `chat.message`, `experimental.chat.system.transform`
- **Per-project persistence**: state is saved in `.opencode/caveman.json` inside each project directory

## Installation

### Project-local (copy the built file)

1. **Copy the plugin file** into your project's `.opencode/plugin/` directory:

   ```bash
   mkdir -p .opencode/plugin
   cp dist/caveman.js .opencode/plugin/caveman.mjs
   ```

2. **Restart OpenCode** or run its "reload plugins" command.

### Global config (recommended)

Add the plugin path to your OpenCode config (`~/.config/opencode/opencode.json` or your dotfiles-managed `conf/opencode/opencode.json`):

```json
"plugin": [
  "<path-to-opencode-caveman-plugin>"
]
```

If your dotfiles repo and this plugin repo are siblings under your home directory, you can use a relative path from the config file location:

```json
"plugin": [
  "../../../opencode-caveman-plugin"
]
```

### Enable by default

Pass options when registering the plugin so Caveman mode is on from the start of every project:

```json
"plugin": [
  ["<path-to-opencode-caveman-plugin>", { "enabled": true, "intensity": "medium" }]
]
```

Valid options:
- `enabled`: `true` or `false`
- `intensity`: `"low"`, `"medium"`, or `"high"` (aliases like `"lite"`/`"full"`/`"ultra"` also accepted)

Chat toggles always override the default and are saved to `.opencode/caveman.json` per project.

## Usage

### Natural-Language Toggles (recommended)

The `chat.message` hook reads your plain-text prompts and flips Caveman mode on or off. These work without any slash-command setup:

| Phrase | Effect |
|--------|--------|
| `turn on caveman` / `activate caveman` / `talk like caveman` | Enable Caveman mode |
| `stop caveman` / `disable caveman` / `normal mode` | Disable Caveman mode |
| `Activate caveman mode: lite` / `: ultra` | Enable + set intensity alias |

### `@caveman` text commands

If your OpenCode client delivers `@caveman ...` as a plain text message (not as an agent mention), the plugin also recognizes:

| Command | Effect |
|---------|--------|
| `@caveman on` | Enable Caveman mode with current intensity |
| `@caveman off` | Disable Caveman mode |
| `@caveman low` / `@caveman lite` | Enable + set intensity to low |
| `@caveman medium` / `@caveman full` | Enable + set intensity to medium |
| `@caveman high` / `@caveman ultra` | Enable + set intensity to high |

If `@caveman` is intercepted by OpenCode as a mention, use the natural-language phrases above instead.

### Intensity Levels

- **Low** (`lite`): Keep responses concise but natural. Drop hedging and filler when safe.
- **Medium** (`full`): Aggressively compress language. Short direct phrases, bullet lists, no articles.
- **High** (`ultra`): Maximum compression. Telegraphic style like notes to an expert engineer.

All levels preserve:
- Code blocks, commands, API signatures
- Safety warnings and constraints
- Step-by-step procedures

## Persistence

State is saved per project in `<project>/.opencode/caveman.json`. The file is created automatically when you first toggle Caveman mode and stores `enabled` and `intensity`.

Precedence is:
1. **Chat toggle** (highest) — written back to the config file.
2. **Saved project config** — from `.opencode/caveman.json`.
3. **Plugin registration options** — the default when no project config exists.
4. **Built-in fallback** — disabled, intensity `medium`.

This means you can turn Caveman on by default via options (see [Enable by default](#enable-by-default)) and still disable it per project with a chat command.

## Development

```bash
# Install dependencies
npm install

# Type-check
npm run typecheck

# Build to dist/
npm run build

# Watch mode
npm run watch
```

## File Structure

```
opencode-caveman-plugin/
├── src/
│   └── caveman.ts      # Plugin implementation
├── dist/               # Compiled JS output (after build)
├── package.json
├── tsconfig.json
└── README.md
```

## Benefits Study

A detailed evaluation of Caveman mode reveals important nuances about its actual impact on token usage and cognitive load.

### Core Quantitative Findings

- **Visible output reduction**: ~50% versus a simple "Answer concisely." baseline (not the 65–75% claimed in some documentation), based on a 10-question evaluation.
- **System prompt overhead**: The full Caveman ruleset adds **896 input tokens per turn** (or 3,409 if all skills are injected). This plugin uses a **minimal ~150–250 token ruleset** to minimize overhead.
- **Break-even analysis**: With the full 896-token ruleset, you need approximately **9 turns** to break even on visible tokens. With this plugin's minimal ruleset, break-even is approximately **2 turns**.

| Aspect | Finding |
|--------|---------|
| Visible output reduction | ~50% vs "Answer concisely." |
| Claimed reduction | 65–75% (not supported by eval) |
| System prompt overhead | 896 tokens/turn (core), 3,409 (full), 163 (minimal) |
| Avg visible tokens saved/turn | ~102 |
| Break-even (core rules) | ~9 turns on visible tokens only |

### Important Caveats

- The evaluation **only measures visible output tokens**, ignoring:
  - The system prompt overhead sent every turn
  - Hidden "thinking" tokens (billed at the same rate)
- If hidden reasoning tokens remain verbose, **actual dollar savings may be significantly smaller** than visible compression suggests.
- The study was **Claude-only**; generalization to other models is unknown.

### Cognitive Benefits

The most solid benefit may be **cognitive rather than monetary**: denser, less wordy answers can reduce reading load for experienced developers who don't need hedging or didactic prose. However, this is currently hypothetical — there's no controlled study on time-to-comprehension or signal-to-noise ratio.

### Bottom Line

**Caveman definitely compresses visible text, but with substantial system-prompt overhead and unknown effects on hidden reasoning. This plugin mitigates the overhead by using a minimal ruleset.**

## License

MIT
