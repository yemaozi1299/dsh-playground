# Mission: 能给 DeepSeek Harness 写插件，并在真 harness 里验证

> 2026-10-14 由用户确认：Why 与 Success looks like 正确，可以据此定课。要改随时改，改之前先确认。

## Why

你想在这个仓库上做自己的改动——给模型加工具、改已有功能、改网页——并且要能自己动手做出来，而不是背下文档。你已经在走的路是：指一个官方文件 → 人话讲 → 在 `scratch-plugin/` 动手 → 在网页里真跑一遍。

## Success looks like

- 冒出一个新想法，能在 `scratch-plugin/` + `--patch` 里做出来，并在网页里真的被模型调用成功
- 能判断一件事该停在 `--patch`，还是值得搬进 `packages/` 成为默认功能
- 能看懂产品里一条能力是怎么拆成「定义 / 实现 / 消费」的，并用同一把尺子决定自己要不要拆
- 遇到插件加载、事件、配置的问题，能在终端日志和文档里定位到原因，而不是猜

## Constraints

- Windows；Node `v22.22.2`，pnpm `11.7.0`；第一次起网页前必须 `pnpm run build` 一次
- 网页会话里的沙箱挡住 esbuild 子进程（`spawn EPERM`），凡是要 `pnpm dsh ...` 真启动的命令，得在**你自己的终端**跑
- 不是 React 熟手：讲界面时说清「工具」和「页面组件」不是一回事，点到具体文件，不展开框架课
- 一次只走一小步：一个官方文件 → 人话讲 → 动手 → 少量作业

## Out of scope（暂时）

- `packages/core/agent-loop/`、`vendor/`、Session 日志格式与版本
- Cordis 底层教程（`docs/cordis-tutorial/` 01～07）：想懂底层才走
- 把练习插件写进 `packages/bundle/base/cordis.patch.yml`（那会变成所有人默认都有的玩具）
