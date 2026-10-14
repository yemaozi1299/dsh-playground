# basic/publish 完成：组合包那一层真的被应用了

用户在自己的终端跑通了两条命令，`basic/publish` 结课。`--dump-config` 的输出里出现了独立的一层 `# == dsh-hello-plugin`，内容正是他写的 patch：

```yaml
# == dsh-hello-plugin
- id: hello
  name: dsh-hello-plugin
```

启动时终端打印 `[hello-plugin] plugin loaded!`。

**Evidence**：2026-10-14 用户在自己终端的实际输出（`pnpm dsh --profile demo --dump-config` 与 `pnpm dsh --profile demo`）。

**Implications**：

- `basic/` 全部走完。整条官方主路径（basic / framework / practice）到此结束，不再有"做到一半"的课。
- 他现在有一个**不靠 `--patch`、被 profile 记住**的插件，这是第一次把"练习"变成"安装"。
- 最近发展区只剩两件事，二选一：把练习搬成 `packages/` 正规包（第 6/7 课流程的实战），或者挑一个他自己想加的功能走完整条链路。前者能补齐"正规包长什么样 + 两份清单 + 测试"这块唯一没实操过的空白。
- 组合包与 profile 的分工不再需要讲解，下次直接用他这份 dump 当实物。
