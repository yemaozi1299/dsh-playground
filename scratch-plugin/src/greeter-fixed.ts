import type { Context } from "@deepseek-ai/cordis";
import { Greeter } from "./greeter.ts";

class FixedGreeter extends Greeter {
  greet(name: string): string {
    return `你好，${name}`;
  }
}

export const name = "greeter-fixed";

export function apply(ctx: Context) {
  ctx.plugin(FixedGreeter);
}