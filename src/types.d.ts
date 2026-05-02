declare module '@opencode-ai/plugin' {
  export interface PluginContext {
    client: unknown
    project: {
      id: string
      config?: Record<string, unknown>
      saveConfig?: () => Promise<void>
    }
    $: unknown
  }

  export interface ChatMessageEvent {
    type: 'chat.message'
    data: {
      message: {
        content?: string
        role?: string
      }
    }
  }

  export type PluginEvent = ChatMessageEvent | { type: Exclude<string, 'chat.message'>; data: Record<string, unknown> }

  export interface ChatParams {
    model?: string
    provider?: string
    message?: unknown
    options?: {
      system?: string
      [key: string]: unknown
    }
  }

  export interface PluginHooks {
    event?: (args: { event: PluginEvent }) => Promise<void> | void
    'chat.params'?: (
      meta: { model: string; provider: string; message: unknown },
      params: ChatParams,
    ) => Promise<void> | void
  }

  export type Plugin = (ctx: PluginContext) => Promise<PluginHooks> | PluginHooks
}
