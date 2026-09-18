# BrowserSkill for DSH — 安装状态与使用指南

`@wxg-prc-cpg/browser-skill-dsh-plugin`（腾讯 BrowserSkill 的 DSH 插件）已安装到
`web` profile。本文件记录当前安装状态、用法与排错。

---

## 一、三个组成部分

浏览器自动化不是单个插件就能跑起来的，它由三块拼成：

| 组件 | 作用 | 状态 |
| --- | --- | --- |
| `bsk` CLI (Rust) | 本机常驻 daemon + 命令行，真正执行浏览器操作 | ✅ 已装 `C:\Users\YU\.local\bin\bsk.exe` (0.3.0) |
| dsh 插件 | 把 `bsk` 包装成 6 个 `browser_*` 模型工具 + 1 个技能 | ✅ 已装到 `web` profile (0.2.1) |
| 浏览器扩展 | 连接 daemon 与真实浏览器 | ❌ **需要你手动装** |

数据流：模型 → `browser_*` 工具 → 插件 spawn `bsk <cmd> --json` → daemon（命名管道 + ws）
→ 浏览器扩展 → 真实 Chrome/Edge 标签页。

**关键点**：插件本身不碰浏览器，所有操作都经过 `bsk`；插件只负责工具 schema、
会话归属、取消、排队和 Web UI 观察。

---

## 二、还差一步：装浏览器扩展

在**装有浏览器的这台机器**上装一次：

- Chrome / 其他 Chromium：[Chrome Web Store](https://chromewebstore.google.com/detail/hhcmgoofomhgciiibhipgmgkgnoenaoi)
- Microsoft Edge：[Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/browserskill/emacgiaaaiojkkpkddmmdfhmokgmnikg)

装好后点扩展图标 → 打开连接开关。`bsk doctor` 里 `extension connected` 变成 `ok` 即可。

当前诊断结果（只有扩展这一项 FAIL，属于全新安装的预期状态）：

```
ok    bsk home writable              C:\Users\YU\.bsk
ok    daemon running                 pid 55156 at ws://127.0.0.1:52800
ok    daemon local process identity  IPC peer PID matches daemon identity
ok    protocol compatible            daemon protocol 1.3 (app 0.3.0)
FAIL  extension connected            0 browsers connected
N/A   agent skill up to date         no agent skill installed   ← DSH 不需要，插件自带技能
```

---

## 三、重启 dsh 让插件生效

**必须重启**，`patchReload: live` 救不了这一步。原因（已核对源码）：
`apps/cli/src/profile-boot.ts` 的 `composeLive()` 把 `bundlePatches` 在启动时固化，
热重载只重读 `cordis.patch.yml` 的内容，不会重读 `package.json` 的
`dsh.profile.bundles`。所以新增 bundle 必须重新启动 profile。

```powershell
# 在当前跑 web GUI 的终端里 Ctrl+C，然后
pnpm dsh --profile web
```

重启后**另开一个终端**（拿到含 `C:\Users\YU\.local\bin` 的新 PATH）再启动也可以。
（`cordis.patch.yml` 里已把 `bskPath` 写成绝对路径，所以两个方式都能找到 `bsk`。）

---

## 四、怎么用

### 4.1 触发方式

插件默认 `lazyTools: true`：启动时模型只看到 `browser-skill` 这个技能条目，
六个工具 schema **在技能被调用后才注入** system prompt。这样省 token。

在对话里：

```text
/browser-skill 打开 example.com 并总结这个页面
```

或者直接说“用浏览器帮我……”，模型会自己调用 `browser-skill` 技能。
技能一旦成功调用，六个工具就常驻，直到插件卸载。

想一启动就有工具，把 `lazyTools` 改成 `false`（见第六节）。

### 4.2 六个工具

| 工具 | action | 用途 |
| --- | --- | --- |
| `browser_session` | `start` / `stop` / `list` | 开关“Agent Window”会话，管理插件自己拥有的会话 |
| `browser_page` | `navigate` / `back` / `forward` / `reload` / `wait` | 导航与等待页面生命周期 |
| `browser_inspect` | `observe` / `snapshot` / `html` / `screenshot` / `console` / `network` | 读页面状态（只读） |
| `browser_interact` | `click` / `hover` / `wheel` / `scroll-to` / `focus` / `blur` / `fill` / `select` / `press` | 操作控件 |
| `browser_tabs` | `list` / `create` / `select` / `close` / `borrow` / `return` | 管理标签页，可临时“借用”你自己的标签页 |
| `browser_assist` | `resize` / `emulate` / `request-help` | 改窗口、模拟设备、请求人工协助 |

### 4.3 典型流程

```text
browser_session({ action: "start" })                       → 拿到 sessionId
browser_page({ action: "navigate", session: "<id>", url: "https://example.com" })
browser_inspect({ action: "observe", session: "<id>" })    → 拿到 @e3 这类 ref
browser_interact({ action: "fill", session: "<id>", target: "@e3", value: "文本" })
browser_inspect({ action: "observe", session: "<id>" })    → 确认结果
browser_session({ action: "stop", session: "<id>" })       → 收尾
```

**Ref 会失效**：导航后、大范围 DOM 变化后 `@eN` 全部作废，必须重新 `observe`。

### 4.4 多会话与归属边界

- 一个对话可以同时开多个浏览器会话（`maxSessions` 默认 5）。
- 所有操作工具都有可选 `session` 参数；省略则作用于“当前会话”（最近启动或使用的那个）。
- 每次结果都会回显它实际操作的 session id。
- **归属边界**（重要）：`bsk` daemon 可能被别的 agent / 终端 / dsh 实例共用。
  插件**只看得到、只操作得了自己创建的会话**。传一个别家的 session id 会被拒绝，
  `list` 也只列插件自己创建的会话，卸载/清理永远不会动别人的会话。

### 4.5 `borrow` — 借用你正在用的标签页

登录态、需要人工确认的场景，用 `browser_tabs` 的 `borrow` 把你自己窗口里的标签页
临时挪进 Agent Window，用完 `return`（`stop` 会话时也会自动归还）。
借用可能弹出确认框，取决于 Browser Automation 设置。

### 4.6 人工协助

遇到登录、验证码、OTP、支付确认、同意条款，或连续两次尝试没有进展时，
模型可以调 `browser_assist` 的 `request-help`，用 `prompt` 告诉你该做什么，
并用 `completionCriteria`（`urlContains` / `selectorExists` / `textExists` / `stableForMs` 等）
自动判定你完成了没有。

### 4.7 不支持的

- 任意页面脚本执行（无 `evaluate` 暴露给模型）
- 交互录制
- 想点 Canvas 上的东西，得先 `screenshot` 拿 `captureId`，再用**原始 PNG 像素坐标**
  调 `click`；capture 一次性、2 分钟过期。

---

## 五、Web UI 实时观察

dsh Web UI 右侧栏会多出一个 **Browser Skill** 标签页：

- 显示每个会话当前动作、耗时、最近截图
- 当前对话首次拥有浏览器会话时自动打开；之后不会自动重开你手动关掉的标签
- **Interrupt** 按钮可取消当前浏览器命令（agent 之后可以继续做别的）
- 侧栏不可用时自动降级为浮动面板，支持拖拽、缩放、Pop out（画中画）
- “Use floating view” / “Move to sidebar” 手动切换，刷新页面即失效（不持久化）

安全模型：观察相关的 HTTP 路由（SSE `/bsk-observation/events`、`/state`、
`/interrupt`、`/stop`、`/thumbnail/<id>`）要求 **loopback Host**
（`localhost` / `127.0.0.0/8` / `[::1]`），且校验 Origin、拒绝 `sec-fetch-site: cross-site`。
**把 dsh web 绑到 `0.0.0.0` 再从局域网访问会故意失败**——这是设计如此，不要挂在
非 loopback 的反向代理后面。

---

## 六、配置

文件：`C:\Users\YU\.dsh\profiles\web\cordis.patch.yml`（已写入，当前内容如下）

```yaml
- id: browserskill
  config:
    bskPath: 'C:\Users\YU\.local\bin\bsk.exe'
    defaultTimeoutMs: 120000
    maxSessions: 5
    observationEnabled: true
    thumbnailIntervalMs: 1500
    idleIntervalMs: 8000
    lazyTools: true
```

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `bskPath` | `bsk` | CLI 路径；不在 PATH 上就写绝对路径 |
| `defaultTimeoutMs` | `120000` | 单条命令默认超时 |
| `maxSessions` | `5` | 本插件并发会话上限 |
| `observationEnabled` | `true` | 是否记录观察状态（动作/URL/缩略图） |
| `thumbnailIntervalMs` | `1500` | 活跃会话截图间隔 |
| `idleIntervalMs` | `8000` | 空闲会话截图间隔 / 最近活动窗口 |
| `lazyTools` | `true` | `true` 时调用技能后才注册工具；`false` 启动即注册 |

**坑**：patch 会**整体替换**该条目的 `config` 对象。所以你需要的每个非默认值
都必须一起写在这个对象里，否则会掉回默认值。

改完保存即可（`web` profile 是 `patchReload: live`）。但**升级插件后必须重启**。

---

## 七、升级

```powershell
cd C:\QQQQQ\claudeCode\dsh-playground
pnpm dsh plugin --profile web update "@wxg-prc-cpg/browser-skill-dsh-plugin" --latest
# 然后重启 dsh profile
```

当前装的是 **0.2.1**。npm 上 `latest` 是 **0.3.0**，但它是 30 分钟前才发布的，
pnpm 的 `minimumReleaseAge` 供应链冷却策略把它挡下来了（这是好事）。
等冷却期过去后上面的命令会自然升到 0.3.0；急着要可以显式钉版本：

```powershell
pnpm dsh plugin --profile web add "@wxg-prc-cpg/browser-skill-dsh-plugin@0.3.0"
```

`bsk` CLI 的升级是独立的：

```powershell
bsk update
```

---

## 八、排错

| 现象 | 处理 |
| --- | --- |
| 工具不出现 | 先 `/browser-skill` 触发技能（`lazyTools: true` 的预期行为）；或把 `lazyTools` 改 `false` 后重启 |
| `bsk probe failed` 警告 | `bskPath` 不对。跑 `bsk doctor` 确认，或写绝对路径 |
| `extension connected` FAIL | 装扩展、打开连接开关；确认扩展里的端口和 `bsk status` 的 `ws_port` 一致 |
| daemon 没起来 | `bsk daemon start --foreground`（在持久终端里）；沙箱环境需 `BSK_AUTO_START=0` 复用宿主 daemon |
| 右侧栏没出现 | 页面刷新一次；或点侧栏里的引导重新打开；或改用浮动面板 |
| ref 失效报错 | 正常现象，重新 `observe` 再操作 |

诊断三连：

```powershell
bsk doctor          # 全量体检
bsk status --json   # daemon 状态、端口、在线浏览器
bsk logs            # daemon 日志
```

---

## 九、当前环境备注

- `bsk` 0.3.0 → `C:\Users\YU\.local\bin\bsk.exe`，已加入用户 PATH（新终端生效）
- daemon 正在运行：pid 55156，`ws://127.0.0.1:52800`，管道 `\\.\pipe\bsk-daemon-eb54e482bac26f3b`
- 插件 0.2.1 → `C:\Users\YU\.dsh\profiles\web\node_modules\@wxg-prc-cpg\browser-skill-dsh-plugin`
- profile `web` 的 bundles 已含 `@wxg-prc-cpg/browser-skill-dsh-plugin`
- `dsh --profile web --dump-config` 已验证组合正确
