import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";
import { defineTool } from "@deepseek-ai/dsh-tools";

declare module "@deepseek-ai/cordis" {
  interface Events {
    "greet/called": (payload: { name: string; times: number }) => void;
  }
}

export const name = "greet-tool";
export const inject = ["tools", "greetCounter"];

export interface Config {
  greeting: string;
}

export const Config: Schema<Config> = Schema.object({
  greeting: Schema.string().default("Hello"),
});

export function apply(ctx: Context, config: Config) {
  console.log("greet 插件加载");
  ctx.effect(() => {
    console.log("effect 注册");
    return () => {
      console.log("effect 清理完毕");
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
        const times = ctx.greetCounter.bump();
        ctx.emit("greet/called", { name: args.name, times });
        return `${config.greeting}, ${args.name}!（第 ${times} 次问候）`;
      },
    }),
  );
}
