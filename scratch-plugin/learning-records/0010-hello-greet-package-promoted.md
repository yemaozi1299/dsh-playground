# lesson 0002 通过：正规包的最小骨架跑起来了，源码别名是四处登记里唯一要手写的那处

用户把练习场里的 `greet` 工具搬成 `packages/experimental/hello-greet/`（提交 `0b14dea60a`），四条命令全过：`pnpm install`、`pnpm run gen-tsconfig-paths`、`pnpm run constraints` 静默通过、`pnpm exec tsc -b packages/experimental/hello-greet` 无输出，`Test-Path packages/experimental/hello-greet/lib/types/index.d.ts` 返回 `True`。

**Evidence**：2026-10-15 用户自己终端里的实际输出与仓库状态。中途 `gen-tsconfig-paths` 报过一次 `no alias maps @deepseek-ai/dsh-experimental-hello-greet; add a hand-written entry, because a package named after something other than its directory cannot be generated.`——他把报错贴回来，补上手写别名后通过（别名现在在 `tsconfig.base.json:58`，生成区 `BEGIN` 在第 337 行之前，位置正确）。包内的 `src/index.ts` 59 行与课上那版一致；15:05 那次构建还留下了 `lib/index.js`（tsdown 产物，也就是 `main` 指向的文件）。

**Implications**：

- 「四处登记」现在是他手里的实物清单：① `package.json` ② 聚合 `references` ③ `tsconfig.base.json` 的 `paths` ④ 启动清单。第③处的规则（生成器只认「包名 = `@deepseek-ai/dsh-<目录名>`」，experimental 组必然对不上、只能手写）是这课最值钱的一条，也是 `docs/cookbook/adding-a-package.zh.md` 没写的——已记进 `RESOURCES.md` 的 Gaps。
- 「搬进 `packages/` 是签合同」有了实物背书：他第一次给一个包写 `private: true` + 私有清单（两处必须同时改），也第一次看见账单分两半（跑起来 / 进产品）。
- 下一节二选一，挂载优先：让这个包真的挂进网页还差启动清单那一层（`lib/index.js` 已经在了），它把 lesson 0001 的「组合包」和这课的「正规包」接成一条线，也练 MISSION 里"加载问题能在日志和文档里定位"那条；账单（README 两节 + `tests/` + `locale/`）放它后面。
- **检索证据（2026-10-15）**：lesson 0002 的四道测验题全对——别名为什么必须手写、进不了聚合的后果、experimental 包的默认发布身份、为什么正规包要先构建。因此「正规包 / 四处登记 / 聚合 / 源码别名 / 发布家族 / 构建产物」已收进 `GLOSSARY.md`；这四条不必重讲，下一课直接从"包怎么被挂上"开始。
