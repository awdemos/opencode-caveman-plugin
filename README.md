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

## License

MIT
