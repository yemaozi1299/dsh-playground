import { Service, type Context } from "@deepseek-ai/cordis";

// 定义拥有「有哪几种语言」这份清单：类型从它推出来，消费方也不用再抄一遍。
export const GREET_LANGUAGES = ["zh", "en"] as const;

export type GreetLanguage = (typeof GREET_LANGUAGES)[number];

/** 一次问候请求。定义拥有 Request 类型，实现和消费方都依赖它。 */
export interface GreetRequest {
  name: string;
  language: GreetLanguage;
}

declare module "@deepseek-ai/cordis" {
  interface Context {
    greeter: Greeter;
  }
}

export abstract class Greeter extends Service {
  constructor(ctx: Context) {
    super(ctx, "greeter");
  }

  abstract greet(request: GreetRequest): string;
}
