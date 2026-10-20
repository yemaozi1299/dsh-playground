# 教学工作区备忘

## 一次教学怎么走

1. 读 `MISSION.md` → `RESOURCES.md` → `learning-records/`（看最新的几条）→ 本文件 → `学习笔记.md`（当前进度与下一课那一页地图）
2. 判断当前最近发展区，产出一节 `lessons/000N-*.html`；需要时新增或更新 `reference/`
3. 用户**拿出证据之后**才写新的 learning record：答题、动手结果、实测输出都算，只"讲过"不算

## 对老师的要求（原话）

- 不是 React 熟手。讲界面时请说清「工具」和「页面组件」不是一回事，点到具体文件即可；不要用「没写 React」这种缩略，也不要展开框架课。
- **抽象名词先行无效。** 2026-09-16 那次「能力的三种角色」从三个英文名词往下讲，名词背下来了，两道作业一道都答不上来。重讲改成从代码进、名词最后再填，才通。→ 先实物，后命名。
- 中文讲课。
- 不要一次推进太多课；讲完一个概念就要有一个能立刻做的动作。
- **成稿后按 `humanizer-zh` 过一遍散文。** 2026-10-15 他指出 lesson 0003 有翻译腔（被动式、破折号当连接、名词化、"闭环"这类空转术语）。只动正文，代码块、命令、路径、表格数据、测验答案位置一律不动。**待办**：lesson 0001 / 0002 与速查里的英文直引号还没统一成中文引号（问过他，未答）。

## 用户自己的比喻（沿用，别替换）

| 用户的说法 | 实际指的是 |
|---|---|
| 笔记本 / 放映机 | Session 日志 / 网页 |
| 购物清单 | `package.json` 的依赖声明 |
| 启动清单 | `cordis.patch.yml` |
| 说明书 | 工具的 name / description / parameters |

## 怎么被叫起来

- 2026-10-14 起，`~/.agents/skills/teach/SKILL.md` 的 `disable-model-invocation` 由 `true` 改成 `false`（本地改动，上游默认是 `true`）。用户说「**继续学**」，老师就加载 `teach` 并照本工作区的规矩走。
- 一次教学的产出落点：课 → `lessons/`，压缩知识 → `reference/`，术语 → `GLOSSARY.md`，心得 → `learning-records/`。

## 2026-10-19 · lesson 0004 的准备

- `hello-greet` 的 README 已经由老师按门禁核对后写进包内（三条 README 门禁跑过；`doc-standard.spec.ts` 的结构项逐条对过）。lesson 0004 不再让学生从空白抄格式，重点是 Model Experience 三格、门禁拒收的判据，以及“改一处再跑”的反馈回路。
- 下一节顺序：先补 `README.zh.md` 与 `README.i18n.yaml`（`verify-translation-pairing --write`），再清 `doc-sync` 剩下的三份生成物（`gen-config-catalog` / `gen-plugin-packages` / `gen-module-graph`），最后写 `tests/` 的真组合测试。`locale/` 可选。

## 已知的机器限制

- 网页会话里 `pnpm dsh ...` 起不来（沙箱挡 esbuild 子进程，`spawn EPERM`）：要真启动，请在用户自己的终端跑，然后把他看到的东西贴回来当证据。
- `tsc -b` 会写 `lib/`，在沙箱里被 EPERM 挡掉；练习场一律用 `pnpm exec tsc -p scratch-plugin/tsconfig.json --noEmit`。
