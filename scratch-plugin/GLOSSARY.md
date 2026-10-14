# DeepSeek Harness 插件开发 术语表

本工作区的规范用语。课程、速查、学习记录都按这里的说法写。**只收你真的懂了的词**——能自己用对，才登记。定义里的词如果也在表内，一律用它。

## 运行时基础

**插件（plugin）**：
一个导出 `apply` 的模块；启动时被 Loader 调用，并拿到 `ctx`。
_避免_: 组件、扩展、模块

**ctx**：
插件拿到的工具箱。登记工具、听事件、挂子插件都通过它，而不是去 import 别人的内部实现。
_避免_: 全局对象、单例、上下文（易与 React 的 context 混）

**工具（tool）**：
模型能点名调用的能力，由说明书和 `execute` 两部分组成。

**说明书**：
工具的 `name` / `description` / `parameters`。模型只看这个决定调不调。
_避免_: schema、接口文档

**execute**：
工具真正干活的函数。模型进不来，只能点名并填参数。

**回合 / 步骤**：
我点一次发送，到模型不再调工具，是一个回合；其中一轮「模型请求 + 它点名的工具」是一个步骤。

## 插件与依赖

**inject**：
声明依赖的清单。写进去的服务全部就绪之前，插件停在 `PENDING` 不加载。

**Service（服务）**：
插件挂在 `ctx` 上的命名能力，例如 `tools`、`llm`、`agents`、`shell`。

**Service Definition / 实现 / 消费方**：
一条能力的三种角色：定义写抽象契约，实现填做法，消费方只认定义。三者齐了才算完整。

**生命周期五阶段**：
`PENDING`（等依赖）→ `LOADING`（跑 apply）→ `ACTIVE`（在跑）→ `UNLOADING` → `DISPOSED`；`apply` 报错落到 `FAILED`。

**自动回收 / effect**：
通过 `ctx` 登记的工具、事件、effect，插件卸载时自动撤销；框架不认识的资源（定时器、连接）用 `ctx.effect(() => 清理函数)` 交出去。

**HMR**：
杀旧插件 → 清注册 → 载入新代码 → 跑新 apply。

## 事件

**事件（emit / on）**：
广播式通信：`ctx.emit` 喊，`ctx.on` 听，双方互不 import。`emit` 的参数会传给 `on`，`on` 的返回值被忽略。

**waterfall**：
流水线式监听：每个监听者必须调 `next()`，否则后面的人收不到。

**bail / serial**：
`bail` 遇到第一个非空返回就短路；`serial` 让监听者排队依次执行。

## 存储与界面

**Session 日志（笔记本）**：
本机上只能往后追加的记录。模型看得见的东西必须能从它重建。

**网页是放映机**：
刷新会丢掉 React 组件里的 state，然后从头重放日志，气泡就回来了。

**GenericToolCard**：
没有专属视图的工具在网页里走的默认卡片；`todo` 另有 `todo-row.tsx`。

## 打包与启动

**cordis.patch.yml（启动清单）**：
决定启动时挂哪些插件行、按什么顺序、带什么 `config`。

**package.json（购物清单）**：
只表示「允许引用这个包」（`workspace:^` = 用本仓库里的那份）。有依赖不等于会加载。

**组合包（bundle）**：
带一个配置层的 npm 包。`dsh.bundle.patch` 回答「这个包贡献什么」。

**profile**：
`$DSH_HOME/profiles/<name>` 下描述一套可启动组合的目录。`dsh.profile.bundles` 回答「这套配置由哪些组合包、按什么顺序组成」。没有东西同时是组合包和 profile。

**层顺序**：
各组合包的 patch（按 bundles 列表顺序）→ profile 自己的 `cordis.patch.yml` → `$DSH_HOME/cordis.patch.yml` → 各 `--patch`（按命令行顺序）。后应用的层按行胜出，并且**替换整行 `config`，不是深合并**。

**部署级 / 运行期**：
部署级的决定写进 yml（换实现）；每个用户、每次调用都可能不同的东西放运行期参数或配置项。

## 能力替换

**seam**：
一条可替换的能力，由定义 / 实现 / 消费三种角色构成。

**拆分的尺子**：
会有第二个需要独立演进的实现吗？会 → 抽出抽象定义；不会 → 一个类写完。"通用"不是理由，"会有第二种实现"才是。

**一个组合只挂一个提供方**：
同一个 `ctx.<名字>` 只注册一次。重复挂**不报错**，后挂的被静默忽略——比报错更难查。

**Config 的两份**：
`interface Config` 是类型（编译后消失，给编辑器看）；`const Config = Schema.object(...)` 是值（运行时校验，给 Cordis 看）。**校验靠 schema，不靠类型**，配置错了会在插件加载时响亮失败。

## LLM 适配器

**LlmAdapter**：
模型提供方要实现的类，只有一个必须实现的方法 `stream(options)`。`listModels` 默认返回空列表——假提供方也必须实现它，否则网页的模型选择器里看不见。

**StreamChunk（分片协议）**：
`block-start` / `text-delta` / `block-end` 靠 `index` 配对，`block-end` 带拼好的完整块；`usage` 在 `finish` 之前；`finish` 必须是最后一片。工具调用参数是原始 JSON 字符串增量。

**BlockAssembler**：
把 token 级分片拼成完整块的工具；拼好之后才能进会话日志。

**GUI 模型目录**：
网页里能选的模型 = `listProviders()` × `listModels()`。
