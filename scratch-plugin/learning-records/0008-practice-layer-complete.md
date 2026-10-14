# 已确定的前置能力：能独立写 Definition / Implementation / Consumer 三件套

用户已能独立完成一条 seam 的三份角色并做离线验证：`greeter.ts`（定义 + Request 类型）、两个实现、`my-plugin.ts` 作消费方；`echo-adapter.ts` 又把同一套用在 `ctx.llm` 上，实现了 `listModels` 与五片 `stream`，并喂给仓库自己的 `BlockAssembler` 验证。

**Evidence**：三个 greeter 文件 2026-10-09 验收通过；echo 适配器 2026-10-14 在网页里真跑通（选中 `echo/echo-1` 后收到回声），另有 `check-theirs.ts` 的输出（路由 `["echo"]`、分片顺序、组装结果）。

**Implications**：`basic/` 与 `framework/`、`practice/` 三层到此走完，最近发展区只剩 `basic/publish`（组合包与 profile）——这也是当前唯一"做到一半"的官方教程。拆分、注入、事件、适配器都不必再教。
