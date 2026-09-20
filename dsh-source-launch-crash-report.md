# DSH 源码启动工具调用崩溃排查报告

- **状态**：根因已定位并复现，临时可用方案已验证；上游修复建议待提交
- **环境**：Windows / Node v24.18.1 / pnpm 11.7.0
- **代码版本**：`2a50ceb260`（2026-09-18 09:40:54 +0800，`Merge remote-tracking branch 'upstream/master'`）
- **触发点**：2026-09-18 拉取官方代码（合并 PR #4471）之后出现
- **影响面**：`pnpm dsh ...` / `pnpm dsh web` 源码启动下，**任何**工具调用必然崩溃；构建产物启动不受影响

---

## 1. 结论速览

| 项目 | 结论 |
| --- | --- |
| 直接原因 | `apps/cli/src/profile-boot.ts` 的默认解析模式被上游从 `link` 改为 `runtime` |
| 引入提交 | `9ddef327a4`（feat: resolution mode link to runtime，09-17）+ `0ea890044f`（补测试与文档，09-17），PR #4471 |
| 故障机制 | runtime 模式让插件入口解析到 `packages/*/*/lib/`，而这些模块内部的导入又被 tsx 的 tsconfig `paths` 改写回 `packages/*/*/src/`，同一包被加载成两份模块实例 |
| 崩溃点 | `ctx.tools[TOOL_RUNTIME_SCHEDULER]` 取到 `undefined`，随后 `.prepare()` 抛 `TypeError` |
| 为什么是 Symbol | `TOOL_RUNTIME_SCHEDULER` 是普通 `Symbol()`（非 `Symbol.for`），只在同一模块实例内相等 |
| 次生故障 | 工具崩在 prepare 阶段 → 没有写回 tool 结果 → assistant 的 `tool_call` 悬空 → DeepSeek 拒绝之后所有请求，会话永久不可用 |
| 临时方案 | 用构建产物启动：`node apps/cli/lib/bin.js web` / `node apps/cli/lib/bin.js --profile headless "任务"` |
| 是否改过官方代码 | 排查中临时改过 `profile-boot.ts` 一行用于对照实验，**已还原**，工作树无官方代码改动 |

---

## 2. 现象

### 2.1 终端（headless）

```
$ node --import tsx/esm apps/cli/src/bin.ts --profile headless "read the first 3 lines of README.md"
I'll read the first 3 lines of README.md.
dsh: UNKNOWN: Cannot read properties of undefined (reading 'prepare')
[ELIFECYCLE] Command failed with exit code 1.
```

模型侧完全正常（已经生成 tool call），崩溃发生在本地执行工具的那一瞬间。

### 2.2 GUI（Web）

工具卡片报 `Interrupted: interrupted`，随后同一句：

```
Cannot read properties of undefined (reading 'prepare')     状态 UNKNOWN
```

### 2.3 次生故障：会话被永久打成 INVALID_REQUEST

失败之后，该会话里**每一条**后续消息都返回：

```
本轮运行失败 DeepSeek Messages tool calls need immediate results
INVALID_REQUEST
```

原因是第一次失败时没有写回 tool 结果，历史里留下了悬空的 `tool_call`；DeepSeek API 要求 assistant 消息中每个 `tool_call` 后面必须紧跟对应结果，于是整个历史变成非法请求，重试、换措辞都无效。

---

## 3. 起因

### 3.1 上游提交

```
9ddef327a4  feat: resolution mode link to runtime          2026-09-17 19:52:33 +0800
0ea890044f  test(cli): cover runtime profile defaults ...  2026-09-17 20:23:14 +0800
```

其中关键的一行改动（`apps/cli/src/profile-boot.ts`）：

```diff
-  const resolutionMode = packaged ? 'runtime' : options.resolutionMode ?? 'link'
+  const resolutionMode = packaged ? 'runtime' : options.resolutionMode ?? 'runtime'
```

`0ea890044f` 随后把这个新默认写进了 `apps/cli/README.md`、Agent Note 与 `apps/cli/tests/resolved-profile-boot.spec.ts`：

```ts
{ selection: 'default', options: {}, mode: 'runtime' },
```

两者都随 09-18 的合并进入本地。**这不是本地环境或操作问题。**

### 3.2 两种解析模式的区别

- **`link` 模式**：不修改 Node 解析器，把生成表物化成 profile 目录下的 node_modules 链接，导入照常经过环境 hook 链（tsx）→ 全部落到 `src/`。
- **`runtime` 模式**（新默认）：在 **Node 内部 ESM/CJS 解析器**上安装 generation，不落盘链接。插件入口因此**绕过 tsx**，按包的 `exports` 解析 → 落到 `lib/`。

**`runtime` 模式本身没有错**：它对 pkg / Electron 这类依赖树可能位于虚拟文件系统的载体是必需的。问题在于它和「源码启动 + tsconfig paths」这个组合撞车。

---

## 4. 排查过程

### 4.1 先在终端复现，排除 GUI 因素

用 headless 跑同一任务 → 同样崩溃。说明与 Web 宿主无关，是 harness 层面的通用故障。

### 4.2 排除环境嫌疑（全部否掉）

| 假设 | 验证 | 结果 |
| --- | --- | --- |
| Node 版本 / `node:sqlite` 开关 | Node v24.18.1；加 `--experimental-sqlite` 重跑 | 同样崩溃，排除 |
| 依赖安装状态 | `pnpm install` | 正常，排除 |
| 构建产物过期 | `pnpm run build` 成功后再跑 | 仍然崩溃，排除 |
| 装了第二份 `dsh-tools`（registry 版本） | `node_modules/.pnpm` 下无该包；`pnpm why` 无外部副本 | 排除 |
| 工作树被改坏 | `git status --short` | 干净，排除 |

### 4.3 拿到真实调用栈

写了一个临时探针（进程内 inspector，`Debugger.setPauseOnExceptions: 'all'`，命中目标异常时打印调用栈），用 `--import` 挂在启动器前面：

```
TypeError: Cannot read properties of undefined (reading 'prepare')
    at startCall (file:///C:/QQQQQ/dsh-playground/packages/core/agent-loop/lib/index.js:586:60)
    at fillPool (lib/index.js:626:10)
    at runGroup (lib/index.js:635:9)
    at executeToolCalls (lib/index.js:528:25)
    at ReactLoopAgent.step (lib/index.js:1116:33)
    ...
```

注意栈里的路径是 **`lib/index.js`（构建产物）**。

### 4.4 映射到源码，锁定可疑目标

```
packages/core/agent-loop/src/tool-calls.ts:170
    const prepared = await ctx.tools[TOOL_RUNTIME_SCHEDULER].prepare(call.exec)
```

```
packages/core/tools/src/index.ts:463
    export const TOOL_RUNTIME_SCHEDULER: unique symbol = Symbol('@deepseek-ai/dsh-tools.scheduler')

packages/core/tools/src/index.ts:798
    readonly [TOOL_RUNTIME_SCHEDULER]: ToolRuntimeScheduler = { ... }
```

两个关键事实：

1. 报错是 `reading 'prepare'`，不是 `reading 'Symbol(...)'` → `ctx.tools` **存在**，只是那个 symbol 键查不到。
2. 它是**普通 `Symbol()`**，不是 `Symbol.for()` → 只在**同一个模块实例**内相等；而它是 `ToolRuntime` 类上的计算属性字段。

→ 结论：注册方和消费方用的不是同一个 symbol 实例，也就是这个包在进程里被加载了**两份**。

### 4.5 列出运行时真正加载了哪些模块

再用 inspector 的 `Debugger.scriptParsed` 在进程退出时统计 `packages/` 下的脚本：

```
=== 退出统计：src 299 / lib 61 ===
```

而其中同时包含：

```
file:///C:/QQQQQ/dsh-playground/packages/core/tools/src/index.ts
file:///C:/QQQQQ/dsh-playground/packages/core/tools/lib/index.js
```

**同一包的两个副本同时驻留**，机制成立。

### 4.6 用 ESM loader hook 记录解析轨迹，找出是谁把 lib 拉进来的

注册一个 `module.register` hook，记录每个 `@deepseek-ai/dsh-*` 说明符的最终落点与 importer：

```
packages/core/tools/lib/index.js     <= @deepseek-ai/dsh-tools      (from apps/cli/node_modules/@deepseek-ai/dsh-agent-instructions/package.json)
packages/core/agent-loop/lib/index.js <= @deepseek-ai/dsh-agent-loop (from apps/cli/node_modules/@deepseek-ai/dsh-base/package.json)
... 共 52 条，全部落在 lib/
```

importer 是 `apps/cli/node_modules/@deepseek-ai/dsh-*/package.json` —— 这是 app-boot 的 profile 路由器为 fallback 路由伪造的父级。也就是说：

- **插件入口**（Loader 行导入）被路由器接管，绕过 tsx，按包 `exports` 解析 → `lib/`
- 这些 **lib 模块自身的静态导入**走环境 hook 链 → tsx 按 tsconfig `paths` 改写 → `src/`

### 4.7 对照实验

| 实验 | 命令 | 结果 |
| --- | --- | --- |
| A. 构建产物启动 | `node apps/cli/lib/bin.js --profile headless "read the first 3 lines of README.md"` | **正常**读出 README（纯 lib 面，自洽） |
| B. 临时把默认改回 `link`（一行，仅用于验证） | 同上源码启动 | **正常**；模块面统计变成 **src 439 / lib 7**（那 7 个是 `typert.host.js` 这类没有源码对应物的生成产物） |

对照实验确认：**单一模块面 → 正常；两个面混用 → 崩溃**。验证完成后该行改动已 `git checkout` 还原。

### 4.8 走过的死路（一并记录）

- **删掉构建版重新 build**：无效。已完整跑过一次 `pnpm run build` 后仍然崩溃；且删掉 `lib/` 会让 runtime 模式的插件入口解析直接 `MODULE_NOT_FOUND`。
- **`TSX_TSCONFIG_PATH` 指向一份不含 `paths` 的 tsconfig**（试图让整进程只剩 lib 一个面）：失败——vendored 的 `@deepseek-ai/cordis` 会随之解析到构建产物，而它不导出 `FiberState`，启动即挂。
- **找 CLI 开关或环境变量选模式**：不存在。`resolutionMode` 只由调用方程序化传入（`profile-boot.ts:263`），`bin.ts` 不传。
- **Windows 路径大小写 / 符号链接导致 ESM 双实例**：不成立，实测两处是**不同文件**（`src/index.ts` 与 `lib/index.js`）。

---

## 5. 根因

一条因果链：

1. 上游把非打包启动的默认解析模式改为 `runtime`（`9ddef327a4`）。
2. runtime 模式在 Node 内部解析器上装表，**插件入口**因此解析到 `packages/*/*/lib/index.js`（产物面）。
3. 这些 lib 模块执行到自身的 `import '@deepseek-ai/dsh-tools'` 时，走的是环境 hook 链：tsx 读取最近 tsconfig（每个包 tsconfig 都 `extends` 根 `tsconfig.base.json`，其 generated 别名区块把每个 `@deepseek-ai/dsh-*` 映射到 `packages/*/*/src`）→ 解析到 `packages/core/tools/src/index.ts`（源码面）。
4. 同一包两个 URL、两个模块实例、两个 `Symbol('@deepseek-ai/dsh-tools.scheduler')`。
5. `ToolRuntime` 实例（`ctx.tools`）由 lib 副本的插件创建，其调度器字段挂在 **lib 的 symbol** 下；而 agent-loop 模块用 **src 的 symbol** 去查 → `undefined`。
6. `ctx.tools[TOOL_RUNTIME_SCHEDULER].prepare(...)` → `TypeError: Cannot read properties of undefined (reading 'prepare')`。
7. 该异常在第 3 步之前就中断了本轮，**没有写回 tool 结果** → 悬空 `tool_call` → 之后所有请求被 API 拒绝。

这同时违反了仓库自己的约定：**Source plane vs artifact plane, never mixed**。

---

## 6. 修复过程

### 6.1 当前采用的临时方案（零改动、已验证）

使用构建产物入口启动。`apps/cli/package.json` 里的 `"bin": { "dsh": "lib/bin.js" }` 正是 npm 包对外发布的入口，只是绕开了 tsx 源码启动：

```powershell
# 每次 pull 之后先构建
pnpm install
pnpm run build

# GUI
node apps\cli\lib\bin.js web

# 一次性任务
node apps\cli\lib\bin.js --profile headless "你的任务"
```

- 代价：这条路径下修改插件源码必须重新 `pnpm run build` 才生效。
- 已实测通过。

### 6.2 未采用的本地改法（仅用于验证，已还原）

把 `apps/cli/src/profile-boot.ts` 的默认值改回 `link`：

```diff
-  const resolutionMode = packaged ? 'runtime' : options.resolutionMode ?? 'runtime'
+  const resolutionMode = packaged ? 'runtime' : options.resolutionMode ?? 'link'
```

缺点：与上游**刻意新增**的测试断言冲突

```ts
// apps/cli/tests/resolved-profile-boot.spec.ts
{ selection: 'default', options: {}, mode: 'runtime' },
```

因此不建议作为 PR 直接提交。

### 6.3 建议的上游修法

**方案 A（推荐）**：让 runtime 只作用于真正需要它的载体，普通 Node 源码启动保持 `link`。

```ts
// apps/cli/src/profile-boot.ts
const resolutionMode = packaged || options.resolvedProfile !== undefined
  ? 'runtime'
  : options.resolutionMode ?? 'link'
```

runtime 的必要性来自「依赖树可能位于虚拟文件系统」（pkg / Electron），而 `resolvedProfile` 正是应用自有 profile（Electron Host）的标志。该写法仍满足现有测试（该用例带 `resolvedProfile`），同时恢复源码启动的单面性。需同步更新 `apps/cli/README.md` 与相关 Agent Note 中「Runtime is the ordinary Node launcher default」的措辞。

**方案 B**：保留 runtime 为默认，让解析器覆盖「由它自己解析出来的插件模块」的后续导入（provenance 路由）——但 tsx 位于 hook 链上层会先行短路，需要一并调整 hook 注册层次。

**方案 C**：源码启动时不带 `paths` 运行 tsx，使整进程统一走产物面——实测受阻（vendored 包依赖 `paths` 提供源码入口），需要额外处理 vendor 解析。

### 6.4 建议一并修复的次生缺陷

工具在 prepare / dispatch 阶段抛错时，`packages/core/agent-loop/src/tool-calls.ts` 应写入一条**失败的 tool 结果**，而不是让 assistant 的 `tool_call` 悬空。否则任何一个工具崩溃都会把会话永久打成 `INVALID_REQUEST`——这比崩溃本身更致命。

---

## 7. 复现与验证命令速查

```powershell
# 复现（源码启动，必然崩溃）
node --import tsx/esm apps/cli/src/bin.ts --profile headless "read the first 3 lines of README.md"

# 对照（构建产物启动，正常）
node apps\cli\lib\bin.js --profile headless "read the first 3 lines of README.md"

# 确认上游 09-18 之后是否已修复
git fetch upstream
git log --oneline -5 upstream/master -- apps/cli/src/profile-boot.ts
```

---

## 8. 附录：关键证据

### 8.1 崩溃栈

```
TypeError: Cannot read properties of undefined (reading 'prepare')
    at startCall (packages/core/agent-loop/lib/index.js:586:60)
    at fillPool (packages/core/agent-loop/lib/index.js:626:10)
    at runGroup (packages/core/agent-loop/lib/index.js:635:9)
    at executeToolCalls (packages/core/agent-loop/lib/index.js:528:25)
    at ReactLoopAgent.step (packages/core/agent-loop/lib/index.js:1116:33)
    at async ReactLoopAgent.turn (packages/core/agent-loop/lib/index.js:955:22)
    at async ReactLoopAgent.kick (packages/core/agent-loop/lib/index.js:870:11)
```

### 8.2 模块面统计

| 解析模式 | packages 下 src 脚本 | packages 下 lib 脚本 | 结果 |
| --- | --- | --- | --- |
| `runtime`（当前默认） | 299 | 61 | 混面，工具调用崩溃 |
| `link`（改动前） | 439 | 7 | 单面，正常 |

`link` 模式下仅存的 7 个 lib 脚本均为无源码对应物的生成产物：

```
packages/boot/plugin-manager/lib/typert.host.js
packages/feedback/command-feedback/lib/typert.host.js
packages/goal/goal/lib/typert.host.js
packages/interaction/commands/lib/typert.host.js
packages/interaction/permission-presets/lib/typert.host.js
packages/llm/llm/lib/typert.host.js
packages/subagent/subagent/lib/typert.host.js
```

### 8.3 涉及文件

| 文件 | 作用 |
| --- | --- |
| `packages/core/agent-loop/src/tool-calls.ts:170` | 崩溃点：`ctx.tools[TOOL_RUNTIME_SCHEDULER].prepare(...)` |
| `packages/core/tools/src/index.ts:463` | `TOOL_RUNTIME_SCHEDULER = Symbol(...)` 定义 |
| `packages/core/tools/src/index.ts:798` | `ToolRuntime` 上的计算属性字段 |
| `apps/cli/src/profile-boot.ts:263` | 默认解析模式（本次问题源头） |
| `packages/boot/app-boot/src/profile-resolution/resolver.ts` | runtime 模式的路由器实现 |
| `tsconfig.base.json:292` 起 | `pnpm run gen-tsconfig-paths` 生成的源码面别名区块 |
