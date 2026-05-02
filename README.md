# OpenCode Caveman Plugin

A global OpenCode plugin that adds a **"Caveman mode"** toggle per project. When enabled, it injects a distilled system prompt that aggressively compresses language while preserving all technical accuracy (code, commands, API shapes, constraints).

## Features

- **Three intensity levels**: `low` | `medium` | `high`
- **Chat commands**: `@caveman on`, `@caveman off`, `@caveman low|medium|high`
- **Config persistence**: settings saved per-project in `opencode.json`
- **Minimal token overhead**: ruleset tuned to ~150–250 tokens (not 800+)
- **Kimi-aware**: optionally biases model selection toward `kimi-k2.6`

## Installation

1. **Copy the plugin file** into your project's `.opencode/plugin/` directory:

   ```bash
   mkdir -p .opencode/plugin
   cp dist/caveman.js .opencode/plugin/caveman.mjs
   ```

   Or use the TypeScript source directly if OpenCode supports `.ts` plugins:

   ```bash
   cp src/caveman.ts .opencode/plugin/caveman.ts
   ```

2. **Restart OpenCode** or run its "reload plugins" command.

3. **Configure** via `opencode config edit`:

   ```json
   {
     "caveman": {
       "enabled": true,
       "intensity": "medium"
     }
   }
   ```

## Usage

### Chat Commands

| Command | Effect |
|---------|--------|
| `@caveman on` | Enable Caveman mode with current intensity |
| `@caveman off` | Disable Caveman mode |
| `@caveman low` | Enable + set intensity to low |
| `@caveman medium` | Enable + set intensity to medium |
| `@caveman high` | Enable + set intensity to high |

### Intensity Levels

- **Low**: Keep responses concise but natural. Drop hedging and filler when safe.
- **Medium**: Aggressively compress language. Short direct phrases, bullet lists, no articles.
- **High**: Maximum compression. Telegraphic style like notes to an expert engineer.

All levels preserve:
- Code blocks, commands, API signatures
- Safety warnings and constraints
- Step-by-step procedures

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
│   ├── caveman.ts      # Plugin implementation
│   └── types.d.ts      # OpenCode plugin API type stubs
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
