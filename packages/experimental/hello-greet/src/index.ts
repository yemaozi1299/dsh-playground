import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

/** 支持的问候语言。这份清单在这里拥有，类型从它推出。 */
const GREET_LANGUAGES = ['zh', 'en'] as const

type GreetLanguage = (typeof GREET_LANGUAGES)[number]

/** 一次问候请求。 */
interface GreetRequest {
  name: string
  language: GreetLanguage
}

/**
 * 按语言拼出问候语。
 * @param request - 名字与语言。
 * @returns 拼好的问候语。
 */
function greet(request: GreetRequest): string {
  return request.language === 'en' ? `Hello, ${request.name}!` : `你好，${request.name}！`
}

export const name = 'greet-tool'

/** 工具注册表就绪之前，这个插件停在 PENDING。 */
export const inject = ['tools']

/**
 * 注册 greet 工具。
 * @param ctx - 插件上下文。
 */
export function apply(ctx: Context): void {
  ctx.tools.register(
    defineTool({
      name: 'greet',
      description: 'Greet someone by name.',
      parameters: {
        name: {
          type: 'string',
          required: true,
          description: 'The name to greet',
        },
        language: {
          type: 'string',
          enum: [...GREET_LANGUAGES],
          description: 'Greeting language: zh or en. Defaults to zh.',
        },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: value }],
      },
      async execute(args) {
        return greet({ name: args.name, language: args.language ?? 'zh' })
      },
    }),
  )
}
