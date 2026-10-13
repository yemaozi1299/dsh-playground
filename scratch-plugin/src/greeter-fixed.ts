import type { Context } from "@deepseek-ai/cordis";
import { Greeter, type GreetRequest } from "./greeter.ts";

class FixedGreeter extends Greeter {
  greet({ name, language }: GreetRequest): string {
    return language === "zh" ? `固定问候：你好，${name}` : `Fixed greeting: hello, ${name}`;
  }
}

export const name = "greeter-fixed";

export function apply(ctx: Context) {
  ctx.plugin(FixedGreeter);
}
