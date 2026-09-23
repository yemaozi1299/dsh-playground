import type { Context } from "@deepseek-ai/cordis";
import { Greeter } from "./greeter.ts";

const lines = ["你好", "Hello", "Hi there"];

class RandomGreeter extends Greeter {
    // 补齐greet方法名的实现，这样就是完整类
    greet(name: string): string {
        const line = lines[Math.floor(Math.random() * lines.length)] ?? "你好";
        return `${line}, ${name}`;
    }
}

export const name = "greeter-random";

export function apply(ctx: Context) {
    // 登记的是服务 ctx.greeter
    ctx.plugin(RandomGreeter);
}
