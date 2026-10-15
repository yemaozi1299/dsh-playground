# lesson 0003 通过：包自己带上一层，web profile 认下了它

`hello-greet` 现在是组合包：包内多了 `cordis.patch.yml`，manifest 补上 `dsh.bundle.patch`、`exports["./cordis.patch.yml"]` 与 `files` 的第三项；`pnpm dsh plugin --profile web add ./packages/experimental/hello-greet` 把它以 `link:` 装进 web profile，包名接在 `dsh.profile.bundles` 末尾。三道测验题全对（答案分别是第 1、2、3 项）。

**Evidence**（2026-10-15，仓库与 profile 状态的核对）：

- `packages/experimental/hello-greet/cordis.patch.yml`：`- insert: - id: hello-greet / name: '@deepseek-ai/dsh-experimental-hello-greet'`。
- manifest：`files` = `["lib/index.js", "cordis.patch.yml", "lib/types/**/*.d.ts"]`；顶层 `dsh.bundle.patch` = `./cordis.patch.yml`；`exports` 含 `./cordis.patch.yml`。
- `~/.dsh/profiles/web/package.json`：dependencies 里 `"@deepseek-ai/dsh-experimental-hello-greet": "link:C:/.../packages/experimental/hello-greet"`；`dsh.profile.bundles` 末尾同名。
- 测验三题全对：`plugin add` 改的是哪两处、少 `dsh.bundle` 的症状、`files` 为什么必须含 patch 文件。
- **没单独核对**：`--dump-config` 里那一层标题行、模型调用 `greet` 的那次输出。用户报"都完成了"但没贴回；会话日志只解出第一个 zstd 帧，查不到不作为反证。

**Implications**：

- 他现在有一条完整的、可复用的路径：练习场验证 → 搬成正规包 → 声明一层 → 装进 profile → 网页里被模型调用。「四处登记」四处都亲手做过。
- 下一课是那份账单：`README.md` + `README.zh.md`（Model Experience / Known Limitations 两节，门禁强制结构）、`tests/` 行为测试（CI 覆盖率按文件 100%）、`locale/` 展示名。做完它，这个包才从"能挂上"变成"能交出去"。
- 备选路仍然有效：挑一个他自己真想加的功能走完整链路——现在他手里有正规包模板，可以直接照搬。
- 新增教学偏好（已记进 `NOTES.md`）：他会主动指出"翻译腔"，说明对文字质量有要求；课成稿后按 humanizer-zh 过一遍散文。
