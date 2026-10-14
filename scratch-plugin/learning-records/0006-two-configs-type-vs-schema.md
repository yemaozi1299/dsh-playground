# Config 的两份：类型管编辑器，schema 管运行时

用户能说清同一个名字下两份 `Config` 的分工——`interface` 是类型（编译后消失），`const Config = Schema.object(...)` 是值（运行时校验），并记住结论"校验靠 schema，不靠类型"，配置错了会在插件加载时响亮失败。

**Evidence**：第 8 课 C 已做（`apply(ctx, config)`、`cordis.yml` 加 `config.greeting`、网页返回 `Hi there, Ada!`）。

**Implications**：`basic/config` 这一篇可以算过。以后讲"misconfiguration fails loud"这类设计取向时，这是现成的例子。
