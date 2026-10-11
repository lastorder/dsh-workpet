# dsh-workpet

[English](README.md) | 中文

DeepSeek Harness 的工作宠物能力，也是需要安装的组合包。

## 概要

- **Service Definition** —— 提供 `ctx.workpet`（`WorkpetService`）：注册形象（`WorkpetSkin`）、保存用户选择、发布不可变快照。类型以 `dsh-workpet/contract` 发布。
- **Consumer** —— `shell.overlay` 里可拖拽的宠物，反映主视图会话；`conversation.composer.dock` 里不可见的探针，读取实时 Chat 活动；本组合包在插件管理页上的一块区域（`plugins.bundle.config`，key 为 `dsh-workpet`），包含**形象**下拉框和实时预览。
- **组合包** —— `cordis.patch.yml` 插入 `dsh-workpet` 和 `dsh-workpet-cat` 两行，且 `dsh-workpet-cat` 是依赖，所以安装本组合包就会带上默认小猫。DeepSeek Harness 0.2.0 首次安装后需重启一次，小猫那一行才能解析。

## 导出

| 入口 | 内容 |
|---|---|
| `.` | Host 半侧（`lib/index.js`）：没有行为，只是让 Loader 行送出 Client 半侧 |
| `./client` | Client 半侧（`lib/client.js`）：`inject = ['slots', 'locale']`、`apply(ctx)` |
| `./contract` | 仅类型：`WorkpetActivity`、`WorkpetScene`、`WorkpetSkin`、`WorkpetFigureProps`、`WorkpetService`、`WorkpetSnapshot`、`WorkpetProviderContext` |

## 行为

- 选择保存在 `localStorage`（`dsh-workpet:skin`），多个标签页同步。选中的形象未注册时退回 `order` 最小的形象，但不会忘记原来的选择。
- 宠物位置保存在 `localStorage`（`dsh-workpet:position`），并限制在窗口内。
- Figure 抛异常会被错误边界拦住。
- 状态规则与时长见 [docs/architecture.zh.md](../../../docs/architecture.zh.md#activity-precedence)。

## 已知限制

- 只反映主视图会话。
- 实时活动来自 Chat 目标的 `legacy` 兼容切片。
- 没有 Host 配置：时长是 `src/client/overlay.tsx` 里的常量。
