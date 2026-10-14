# 服务类用 default export，函数插件用具名导出——不能混

用户记下了这个坑的机制：Loader 的 `unwrapExports` 见到 `default` 就只认 default，会把同一文件里的 `inject` / `apply` 丢掉；产品里用 `expect('default' in tool).toBe(false)` 防这件事。

**Evidence**：framework 第 2 篇笔记里能复述机制并指出防线；作业已对。

**Implications**：以后凡是"插件不生效但没报错"，这条要进排查清单的第一梯队。它还解释了为什么这条规矩在仓库 `AGENTS.md` 里是硬性的。
