import { Service, type Context } from "@deepseek-ai/cordis";

/**
 * declare module 管「类型认不认识」，super(ctx, "greeter") 管「运行时真不真注册」
 */

// 类型声明
declare module "@deepseek-ai/cordis" {
  interface Context {
    greeter: Greeter;
  }
}


// 注册
export abstract class Greeter extends Service {
  constructor(ctx: Context) {
    super(ctx, "greeter");
  }

  // 只有方法名，没有实现
  // abstract 的意思就是「这里空着，留给子类填」
  abstract greet(name: string): string;
}
