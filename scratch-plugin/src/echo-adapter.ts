import type { Context } from "@deepseek-ai/cordis";
import { LlmAdapter, type GenerateOptions, type LlmModelInfo, type StreamChunk } from "@deepseek-ai/dsh-llm";

/** 这个假提供方占用的路由名，和注册、目录、yml 里保持一致。 */
const PROVIDER = "echo";
const MODEL = "echo-1";

/** 从请求里挑出最后一条用户消息的纯文本，当作「回声」的原料。 */
function lastUserText(options: GenerateOptions): string {
  for (let i = options.messages.length - 1; i >= 0; i -= 1) {
    const message = options.messages[i];
    if (message?.role !== "user") continue;
    const text = message.content
      .filter(block => block.type === "text")
      .map(block => block.text)
      .join(" ");
    if (text.length > 0) return text;
  }
  return "（没听清）";
}

class EchoAdapter extends LlmAdapter {
  // GUI 的模型选择只列目录里的模型，所以假提供方也得公布自己。
  override listModels(provider: string): Promise<readonly LlmModelInfo[]> {
    return Promise.resolve(provider === PROVIDER
      ? [{ provider, id: MODEL, name: "Echo 1（本地假模型）" }]
      : []);
  }

  override async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    const text = `你说的是：${lastUserText(options)}`;
    yield { type: "block-start", index: 0, blockType: "text" };
    yield { type: "text-delta", index: 0, text };
    yield { type: "block-end", index: 0, block: { type: "text", text } };
    yield { type: "usage", usage: { inputTokens: 0, outputTokens: 0 } };
    yield { type: "finish", reason: { kind: "stop" } };
  }
}

export const name = "llm-echo";
export const inject = ["llm"];

export function apply(ctx: Context) {
  ctx.llm.registerAdapter([PROVIDER], new EchoAdapter());
}
