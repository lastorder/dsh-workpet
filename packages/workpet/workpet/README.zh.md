# dsh-workpet

[English](README.md) | 中文

DeepSeek Harness 的工作宠物能力，也是需要安装的组合包。

## 概要

- **Service Definition** —— 提供 `ctx.workpet`（`WorkpetService`）：注册形象（`WorkpetSkin`）并以不可变快照发布；每个已注册的形象都是屏幕上的一只宠物。类型以 `dsh-workpet/contract` 发布。
- **Consumer** —— `shell.overlay` 里每个已注册形象一只可拖拽的宠物，都反映主视图会话；`conversation.composer.dock` 里不可见的探针，读取实时 Chat 活动；本组合包在插件管理页上的一块区域（`plugins.bundle.config`，key 为 `dsh-workpet`），每个形象一张卡片，下面是动作预览：每个动作都是一个按钮，点一下所有卡片都会表演它。
- **组合包** —— `cordis.patch.yml` 插入 `dsh-workpet` 和 `dsh-workpet-cat` 两行，且 `dsh-workpet-cat` 是依赖，所以安装本组合包就会带上默认小猫。DeepSeek Harness 0.2.0 首次安装后需重启一次，小猫那一行才能解析。

## 导出

| 入口 | 内容 |
|---|---|
| `.` | Host 半侧（`lib/index.js`）：没有行为，只是让 Loader 行送出 Client 半侧 |
| `./client` | Client 半侧（`lib/client.js`）：`inject = ['slots', 'locale']`、`apply(ctx)` |
| `./contract` | 仅类型：`WorkpetActivity`、`WorkpetScene`、`WorkpetSkin`、`WorkpetFigureProps`、`WorkpetService`、`WorkpetSnapshot`、`WorkpetProviderContext` |

## 行为

- 屏幕上有哪些宠物由插件管理决定：形象的插件启用时就会画出来。关闭 `dsh-workpet-cat` 行，小猫就会消失。
- 每只宠物的位置保存在 `localStorage`（`dsh-workpet:position:<形象 id>`），并限制在窗口内。没拖动过的宠物按 `order` 从右下角往左排；排第一的还会读取旧的唯一键 `dsh-workpet:position`。
- 宠物们共享会话状态，拖拽和抚摸各管各的。需要提醒时，每只宠物下方的状态气泡都会常驻。
- Figure 抛异常会被错误边界拦住。
- 状态规则与时长见 [docs/architecture.zh.md](../../../docs/architecture.zh.md#activity-precedence)。

## 已知限制

- 只反映主视图会话。
- 实时活动来自 Chat 目标的 `legacy` 兼容切片。
- 没有 Host 配置：时长是 `src/client/overlay.tsx` 里的常量。
