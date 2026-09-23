import type { Context } from "@deepseek-ai/cordis";
import { defineTool } from "@deepseek-ai/dsh-tools";

declare module "@deepseek-ai/cordis" {
  interface Events {
    "greet/called": (payload: { name: string; times: number }) => void;
  }
}

export const name = "greet-tool";
export const inject = ["tools", "greetCounter", "greeter"];


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
      },
      output: {
        schema: { type: "string" },
        render: (_args, value) => [{ type: "text", text: value }],
      },
      async execute(args) {
        const times = ctx.greetCounter.bump();
        ctx.emit("greet/called", { name: args.name, times });
        return `${ctx.greeter.greet(args.name)}（第 ${times} 次问候）`;
      },
    }),
  );
}
