import type { Context } from "@deepseek-ai/cordis";
import { Greeter, type GreetLanguage, type GreetRequest } from "./greeter.ts";

// 换语言只换词表，不换做法 —— 所以还是一个实现文件。
const LINES: Record<GreetLanguage, readonly string[]> = {
  zh: ["你好", "早上好", "很高兴认识你"],
  en: ["Hello", "Hi there", "Nice to meet you"],
};

class RandomGreeter extends Greeter {
  greet({ name, language }: GreetRequest): string {
    const pool = LINES[language];
    const line = pool[Math.floor(Math.random() * pool.length)] ?? "你好";
    return `${line}, ${name}`;
  }
}

export const name = "greeter-random";

export function apply(ctx: Context) {
  ctx.plugin(RandomGreeter);
}
