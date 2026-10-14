# DeepSeek Harness 插件开发 · 可信资源

知识一律从这里取，不从参数记忆里编。教程类资源按「先走哪条路」排序，速查类按「什么时候去点」标注。

## Knowledge

### 主路径：仓库里的用户教程（有顺序，要动手）

- [`docs/user/develop/basic/index.zh.md`](../docs/user/develop/basic/index.zh.md)
  第一个插件。用在：起步、`apply` 与 `ctx` 的最小心智模型。
- [`basic/tool.zh.md`](../docs/user/develop/basic/tool.zh.md)
  开发一个工具。用在：说明书三件套 + `execute` 怎么写。
- [`basic/config.zh.md`](../docs/user/develop/basic/config.zh.md)
  让插件可配置。用在：`interface Config` 与 `const Config = Schema` 的分工。
- [`basic/publish.zh.md`](../docs/user/develop/basic/publish.zh.md)
  打包与安装插件。用在：组合包 / profile 的区别、`dsh plugin add`、层顺序。（lesson 0001 已通过）
- [`docs/cookbook/adding-a-package.zh.md`](../docs/cookbook/adding-a-package.zh.md) ← **当前这一课的主要来源**
  添加 workspace 包的逐文件清单。用在：正规包的目录、`package.json` 不变式、聚合登记、README 的 Model Experience 与 Known Limitations 两节、验证命令。
- [`packages/experimental/AGENTS.md`](../packages/experimental/AGENTS.md)
  experimental 组的规则。用在：`dsh-experimental-*` 前缀、默认并入发布家族、私有例外清单。
- [`framework/index.zh.md`](../docs/user/develop/framework/index.zh.md) / [`service.zh.md`](../docs/user/develop/framework/service.zh.md) / [`events.zh.md`](../docs/user/develop/framework/events.zh.md)
  生命周期 / 服务与依赖 / 事件系统。用在：`inject` 为什么停在 PENDING、服务怎么提供、四种事件模式。
- [`practice/index.zh.md`](../docs/user/develop/practice/index.zh.md) / [`llm-adapter.zh.md`](../docs/user/develop/practice/llm-adapter.zh.md)
  能力的三种角色 / LLM 适配器。用在：拆不拆的尺子、`StreamChunk` 分片协议。

### 概念参考（查单个概念，不当课读）

- [`docs/cordis-primer.md`](../docs/cordis-primer.md)：Cordis 的加载、注入、事件语义总纲。
- [`docs/glossary.md`](../docs/glossary.md)：仓库自己的术语表，和本工作区 `GLOSSARY.md` 冲突时以它为准。
- [`docs/subsystems/`](../docs/subsystems/README.md)：逐子系统参考，类型定义的最终出处。
- [`docs/architecture.md`](../docs/architecture.md)：动 `packages/` 之前读的地图。

### 权威源（教程和参考都不一致时，看代码）

- [`packages/bundle/base/cordis.patch.yml`](../packages/bundle/base/cordis.patch.yml)：真实启动清单，平台差异（`disabled: !!js process.platform ...`）就在这里。
- [`scripts/check-workspace-constraints.ts`](../scripts/check-workspace-constraints.ts) 与 [`packages/experimental/tool-agent-team/`](../packages/experimental/tool-agent-team/package.json)：正规包的不变式（谁在查、查什么）与最小实物（一个工具一个包）。
- [`packages/shell/`](../packages/shell/)：一条 seam 的标准长相（定义 + 四个实现 + 两个消费）。
- [`packages/llm/llm/src/index.ts`](../packages/llm/llm/src/index.ts) 与 `types.ts`：`LlmAdapter` 与 `StreamChunk`。
- 各包 `README.zh.md`：包的契约，例如 `packages/shell/shell/README.zh.md` 里的「一个组合只挂一个提供方」。

### 外部资源（补充，不改主线）

- [pingfanfan/hello-dsh](https://github.com/pingfanfan/hello-dsh)：社区「从零到第一个插件」10 步教程 + 22 个中文 skill。用在：复习前几课；里面的 `dsh-troubleshoot`、`explain-codebase` 可单独拿来用。**注意**：作者自称在 `0.1.0-rc.6` 验证，本机是 `0.1.5-rc.2`，细节要回仓库核对。
- [官方 Cordis 教程（网页版）](https://deepseek-harness.github.io/deepseek-harness/develop/cordis-tutorial/)：即 `docs/cordis-tutorial/`。用在：以后想懂底层时。
- [NanmiCoder/dsh-agent-teams · dsh-plugin-development](https://github.com/NanmiCoder/dsh-agent-teams/blob/main/.dsh/skills/dsh-plugin-development/SKILL.md)：写给专业插件作者的执行清单。用在：**basic/publish 之后再当查漏清单**，现在太早。
- [Jsnnmsc/claude-code-learning-marketplace](https://github.com/jsnnmsc/claude-code-learning-marketplace)：「用插件学代码库」的插件市场。用在：暂不动，和我们的课重复。
- [mattpocock/skills · teach](https://github.com/mattpocock/skills/tree/main/skills/productivity/teach)：本工作区遵循的教学法（MISSION / 最近发展区 / 检索练习 / 间隔）。安装位置 `~/.agents/skills/teach`。

## Wisdom（社区）

- **Gap：还没找到。** 目前没有可信、活跃、能拿真问题去问的 DSH 插件开发者社区。可先考虑仓库 Issue 与 Discord（未核实是否存在）。在找到之前，智慧这一层靠"把东西做出来给自己用"补。

## Gaps

- 没有「调试插件加载失败」的系统性材料：`--dump-config` 怎么读、Loader 报错怎么定位，教程里只有零星一句。下一课如果需要，先自己整理成 `reference/`。
- `docs/user/develop/` 没有中文版的 CLI 行为参考对照；`apps/cli/reference/README.zh.md` 是英文优先的参考页。
