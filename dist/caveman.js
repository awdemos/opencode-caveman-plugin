"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CavemanPlugin = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const CAVEMAN_RULES_BY_INTENSITY = {
    low: `
You are in "light caveman mode".

Goals:
- Keep responses concise but still natural.
- Drop hedging and filler when safe.
- Preserve all technical details and code exactly.

Rules:
- Prefer short sentences.
- Remove needless qualifiers ("probably", "might", "in general") unless safety-critical.
- Do NOT remove steps in procedures or code.
- Do NOT change semantics of APIs, flags, or commands.
- Never invent new abbreviations (cfg/impl/req/res/fn); well-known acronyms (DB/API/HTTP) are OK.
`.trim(),
    medium: `
You are in "caveman mode".

Goals:
- Aggressively compress language.
- Preserve all technical information: code, commands, API shapes, constraints.

Style:
- Use short, direct phrases.
- Drop articles and filler words.
- Use bullet lists for steps.
- Avoid hedging except for safety-critical uncertainty.

Do NOT:
- Omit safety warnings.
- Skip necessary steps.
- Modify code logic or parameter names.
- Invent abbreviations (cfg/impl/req/res/fn); well-known acronyms (DB/API/HTTP) are OK.
- Use causal arrows (→). They save no tokens and hurt clarity.
`.trim(),
    high: `
You are in "maximum caveman mode".

Goals:
- Minimize tokens while keeping technical correctness.

Style:
- Telegraphic, like notes to expert engineer.
- Drop articles, most adjectives, hedging.
- Prefer lists and code over prose.
- Pattern: [thing] [action] [reason]. [next step].

Hard rules:
- Never remove constraints, warnings, or preconditions.
- Never change code semantics.
- Never invent abbreviations (cfg/impl/req/res/fn); well-known acronyms (DB/API/HTTP) are OK.
- Never use causal arrows (→).
- Auto-clarity for security, destructive, or multi-step instructions: write normal when ambiguity risks misread, then resume caveman.
- If unsure, keep more words rather than less.
`.trim(),
};
const INTENSITY_ALIASES = {
    lite: 'low',
    full: 'medium',
    ultra: 'high',
    low: 'low',
    medium: 'medium',
    high: 'high',
};
const INDEPENDENT_COMMANDS = new Set(['/caveman-commit', '/caveman-review', '/caveman-compress']);
function isIntensityAlias(value) {
    return value in INTENSITY_ALIASES;
}
function normalizeIntensity(raw) {
    if (typeof raw === 'string') {
        const key = raw.toLowerCase();
        if (isIntensityAlias(key)) {
            return INTENSITY_ALIASES[key];
        }
    }
    return 'medium';
}
function defaultConfig(options) {
    return {
        enabled: typeof options?.enabled === 'boolean' ? options.enabled : false,
        intensity: normalizeIntensity(options?.intensity),
    };
}
function configPath(projectDir) {
    return (0, node_path_1.join)(projectDir, '.opencode', 'caveman.json');
}
function loadProjectConfig(projectDir, options) {
    const file = configPath(projectDir);
    const fallback = defaultConfig(options);
    if (!(0, node_fs_1.existsSync)(file)) {
        return fallback;
    }
    try {
        const raw = JSON.parse((0, node_fs_1.readFileSync)(file, 'utf8'));
        return {
            enabled: raw !== null &&
                typeof raw === 'object' &&
                'enabled' in raw &&
                typeof raw.enabled === 'boolean'
                ? raw.enabled
                : fallback.enabled,
            intensity: raw !== null &&
                typeof raw === 'object' &&
                'intensity' in raw
                ? normalizeIntensity(raw.intensity)
                : fallback.intensity,
        };
    }
    catch (err) {
        console.error(`[caveman] failed to read config at ${file}:`, err);
        return fallback;
    }
}
function writeConfigAtomic(file, data) {
    const tmp = `${file}.tmp`;
    (0, node_fs_1.writeFileSync)(tmp, data, { encoding: 'utf8', mode: 0o600 });
    (0, node_fs_1.renameSync)(tmp, file);
}
function saveProjectConfig(projectDir, state) {
    const file = configPath(projectDir);
    try {
        (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(file), { recursive: true, mode: 0o700 });
        writeConfigAtomic(file, `${JSON.stringify(state, null, 2)}\n`);
    }
    catch (err) {
        console.error(`[caveman] failed to write config at ${file}:`, err);
    }
}
function isTextPart(part) {
    return part.type === 'text';
}
function parseCommandChange(promptRaw) {
    let prompt = promptRaw.trim();
    // Symmetric quote stripping.
    if (prompt.length >= 2) {
        const first = prompt[0];
        const last = prompt[prompt.length - 1];
        if (first === last && (first === '"' || first === '`' || first === "'")) {
            prompt = prompt.slice(1, -1).trim();
        }
    }
    if (!prompt)
        return null;
    const lower = prompt.toLowerCase();
    // Natural-language deactivation first.
    if (/\b(stop|disable|deactivate|turn off)\b.*\bcaveman\b/i.test(prompt) ||
        /\bcaveman\b.*\b(stop|disable|deactivate|turn off)\b/i.test(prompt) ||
        /\bnormal mode\b/i.test(prompt)) {
        return { enabled: false };
    }
    // Template expansion: "Activate caveman mode: $ARGUMENTS".
    const tpl = /^activate caveman mode:[ \t]*(\S*)/i.exec(lower);
    if (tpl) {
        const arg = tpl[1] ?? '';
        if (arg === 'off' || arg === 'stop' || arg === 'disable') {
            return { enabled: false };
        }
        const intensity = normalizeIntensity(arg);
        return { enabled: true, intensity };
    }
    // Natural-language activation.
    if (/\b(activate|enable|turn on|start|talk like)\b.*\bcaveman\b/i.test(prompt) ||
        /\bcaveman\b.*\b(mode|activate|enable|turn on|start)\b/i.test(prompt)) {
        return { enabled: true };
    }
    // Independent slash commands are recognized but no-op to avoid corrupting state.
    if (INDEPENDENT_COMMANDS.has(lower)) {
        return null;
    }
    // Existing @caveman commands.
    if (lower.startsWith('@caveman')) {
        const [, arg] = lower.split(/\s+/, 2);
        if (!arg) {
            return { enabled: true };
        }
        if (arg === 'on') {
            return { enabled: true };
        }
        if (arg === 'off' || arg === 'stop' || arg === 'disable') {
            return { enabled: false };
        }
        const intensity = normalizeIntensity(arg);
        return { enabled: true, intensity };
    }
    return null;
}
const CavemanPlugin = async (input, options) => {
    const { directory, project } = input;
    const projectDir = directory;
    const state = loadProjectConfig(projectDir, options);
    console.log(`[caveman] ${project.id}: enabled=${state.enabled}, intensity=${state.intensity}`);
    return {
        event: async ({ event }) => {
            if (event.type === 'session.created') {
                console.log(`[caveman] session created for ${project.id}: enabled=${state.enabled}, intensity=${state.intensity}`);
            }
        },
        'chat.message': async (_input, output) => {
            for (const part of output.parts) {
                if (!isTextPart(part))
                    continue;
                const change = parseCommandChange(part.text);
                if (change === null)
                    continue;
                if (change.enabled !== undefined) {
                    state.enabled = change.enabled;
                }
                if (change.intensity !== undefined) {
                    state.intensity = change.intensity;
                }
                saveProjectConfig(projectDir, state);
                console.log(`[caveman] now ${state.enabled ? 'ENABLED' : 'DISABLED'} (${state.intensity})`);
            }
        },
        'experimental.chat.system.transform': async (_input, output) => {
            if (!state.enabled)
                return;
            const rules = CAVEMAN_RULES_BY_INTENSITY[state.intensity];
            output.system.push(rules);
        },
    };
};
exports.CavemanPlugin = CavemanPlugin;
//# sourceMappingURL=caveman.js.map