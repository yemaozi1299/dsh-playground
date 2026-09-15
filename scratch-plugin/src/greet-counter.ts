import { Service, type Context } from "@deepseek-ai/cordis";

declare module "@deepseek-ai/cordis" {
  interface Context {
    greetCounter: GreetCounter;
  }
}

export default class GreetCounter extends Service {
  constructor(ctx: Context) {
    super(ctx, "greetCounter");
  }
  private n = 0;
  bump(): number {
    return ++this.n;
  }
}
