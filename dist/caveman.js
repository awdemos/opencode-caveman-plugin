"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CavemanPlugin = void 0;
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
`.trim(),
    high: `
You are in "maximum caveman mode".

Goals:
- Minimize tokens while keeping technical correctness.

Style:
- Telegraphic, like notes to expert engineer.
- Drop articles, most adjectives, hedging.
- Prefer lists and code over prose.

Hard rules:
- Never remove constraints, warnings, or preconditions.
- Never change code semantics.
- If unsure, keep more words rather than less.
`.trim(),
};
function normalizeIntensity(raw) {
    if (raw === 'low' || raw === 'medium' || raw === 'high')
        return raw;
    return 'medium';
}
const CavemanPlugin = async (ctx) => {
    const { project } = ctx;
    const config = (project.config ??= {});
    const cavemanCfg = (config.caveman ??= {});
    if (typeof cavemanCfg.enabled !== 'boolean') {
        cavemanCfg.enabled = false;
    }
    cavemanCfg.intensity = normalizeIntensity(cavemanCfg.intensity);
    console.log(`[caveman] ${project.id}: enabled=${cavemanCfg.enabled}, intensity=${cavemanCfg.intensity}`);
    return {
        event: async ({ event }) => {
            if (event.type !== 'chat.message')
                return;
            const { message } = event.data;
            const content = (message?.content || '').trim();
            if (!content.startsWith('@caveman'))
                return;
            const [, arg] = content.split(/\s+/, 2);
            if (!arg) {
                console.log('[caveman] usage: @caveman on|off|low|medium|high');
                return;
            }
            if (arg === 'on') {
                cavemanCfg.enabled = true;
            }
            else if (arg === 'off') {
                cavemanCfg.enabled = false;
            }
            else if (arg === 'low' || arg === 'medium' || arg === 'high') {
                cavemanCfg.enabled = true;
                cavemanCfg.intensity = arg;
            }
            else {
                console.log('[caveman] unknown arg. use: on|off|low|medium|high');
                return;
            }
            await project.saveConfig?.();
            console.log(`[caveman] now ${cavemanCfg.enabled ? 'ENABLED' : 'DISABLED'} (${cavemanCfg.intensity})`);
        },
        'chat.params': async ({ model, provider, message }, params) => {
            if (!cavemanCfg.enabled)
                return;
            const intensity = normalizeIntensity(cavemanCfg.intensity);
            const rules = CAVEMAN_RULES_BY_INTENSITY[intensity];
            params.options = params.options || {};
            const existingSystem = params.options.system || '';
            params.options.system = [
                existingSystem,
                '',
                '--- Caveman compression rules start ---',
                rules,
                '--- Caveman compression rules end ---',
            ]
                .filter(Boolean)
                .join('\n');
            if (!model && provider === 'kimi') {
                params.model = 'kimi-k2.6';
            }
        },
    };
};
exports.CavemanPlugin = CavemanPlugin;
//# sourceMappingURL=caveman.js.map