import type { Context } from "@deepseek-ai/cordis";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { GREET_LANGUAGES, type GreetLanguage } from "./greeter.ts";

declare module "@deepseek-ai/cordis" {
  interface Events {
    "greet/called": (payload: { name: string; times: number }) => void;
  }
}

export const name = "greet-tool";
export const inject = ["tools", "greetCounter", "greeter"];

// 消费方的缺省：显式一行，不藏在 Greeter 实现里。
const DEFAULT_LANGUAGE: GreetLanguage = "zh";

export function apply(ctx: Context) {
  console.log("greet 插件加载");
  ctx.effect(() => {
    console.log("effect 注册");
    return () => {
      console.log("effect 清理完毕");
    };
  });
  // 登记的是工具，给模型用
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
        language: {
          type: "string",
          enum: [...GREET_LANGUAGES],
          description: "Greeting language: zh or en. Defaults to zh.",
        },
      },
      output: {
        schema: { type: "string" },
        render: (_args, value) => [{ type: "text", text: value }],
      },
      async execute(args) {
        const times = ctx.greetCounter.bump();
        ctx.emit("greet/called", { name: args.name, times });
        const language = args.language ?? DEFAULT_LANGUAGE;
        return `${ctx.greeter.greet({ name: args.name, language })}（第 ${times} 次问候）`;
      },
    }),
  );
}
