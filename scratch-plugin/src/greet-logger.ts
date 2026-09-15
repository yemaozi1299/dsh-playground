import type { Context } from "@deepseek-ai/cordis";
import type {} from "./my-plugin.ts";

export const name = "greet-logger";

export function apply(ctx: Context) {
  ctx.on("greet/called", ({ name, times }) => {
    console.log(`[greet-logger] ${name} 被问候了，第 ${times} 次`);
  });
}
