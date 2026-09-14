import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";
import { defineTool } from "@deepseek-ai/dsh-tools";

export const name = "greet-tool";
export const inject = ["tools"];

export interface Config {
  greeting: string;
}

export const Config: Schema<Config> = Schema.object({
  greeting: Schema.string().default("Hello"),
});

export function apply(ctx: Context, config: Config) {
  console.log('greet 插件加载')
  ctx.effect(() => {
    console.log('effect 注册')
    const timer = setInterval(() => console.log("heartbeat"), 5000);
    return () => {
      console.log("effect 清理完毕");
      clearInterval(timer);
    }; // 插件卸载时，框架会调这个函数
  });
  ctx.tools.register(
    defineTool({
      name: "greet",
      description: "Greet someone by name.",
      parameters: {
        name: {
          type: "string",
          required: true,
          description: "The name to greet",
        },
      },
      output: {
        schema: { type: "string" },
        render: (_args, value) => [{ type: "text", text: value }],
      },
      async execute(args) {
        return `${config.greeting}, ${args.name}!`;
      },
    }),
  );

}
