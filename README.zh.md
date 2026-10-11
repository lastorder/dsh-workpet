# dsh-workpet

[English](README.md) | 中文

DeepSeek Harness 的悬浮**工作宠物**，用动作表现当前会话在做什么：思考时歪头、写作时敲键盘、调用工具时跑起来、需要你时挥手、一轮结束时欢呼、闲着没事就打瞌睡。

宠物是一种定义了接口的**能力**，而不是一张固定的图。`dsh-workpet` 负责接口与行为；形象是注册进来的独立 npm 包。默认形象是一只手绘绘本画风的橘白小猫；其它组合包可以贡献更多形象，所有已注册的形象都会出现在插件页面的下拉框里。

## 目录

- [包](#packages)
- [安装](#install)
- [使用](#using-it)
- [开发自己的宠物](#create-your-own-pet)
- [开发](#development)
- [文档](#documentation)

-----

<a id="packages"></a>
## 包

| 包 | 角色 | 位置 |
|---|---|---|
| [`dsh-workpet`](packages/workpet/workpet/README.zh.md) | Service Definition（`ctx.workpet`）+ Consumer（悬浮宠物、形象下拉框）；组合包 | 本仓库 |
| [`dsh-workpet-cat`](packages/workpet/workpet-cat/README.zh.md) | Service Provider：默认小猫；随 `dsh-workpet` 一起安装 | 本仓库 |
| [`dsh-workpet-parrot`](https://github.com/lastorder/dsh-workpet-parrot) | Service Provider：玄凤鹦鹉，纯 JavaScript、免编译；开发新宠物的模板 | 独立仓库 |

角色、接口与状态规则见 [docs/architecture.zh.md](docs/architecture.zh.md)。

<a id="install"></a>
## 安装

安装 **`dsh-workpet`** 组合包时会一并装上默认小猫：`dsh-workpet-cat` 是 `dsh-workpet` 的依赖，组合包会插入它的那一行。其它形象（如 `dsh-workpet-parrot`）是独立的组合包。

从 npm 安装：在 Harness 会话里让智能体执行 `plugin_manager` 的 `install_bundle`：

```text
install_bundle  dsh-workpet          # 宠物 + 默认小猫
install_bundle  dsh-workpet-parrot   # 可选：玄凤鹦鹉
```

从源码安装：先构建，再安装目录：

```sh
pnpm install
pnpm run build
```

```text
install_bundle  /absolute/path/to/dsh-workpet/packages/workpet/workpet   # 宠物 + 默认小猫
install_bundle  /absolute/path/to/dsh-workpet-parrot                     # 可选：玄凤鹦鹉
```

如果是 CLI 管理的 profile（桌面应用的 `desktop` profile 只能由应用自己修改），用 `dsh plugin --profile <profile> add dsh-workpet`（或 `add link:/absolute/path/to/dsh-workpet/packages/workpet/workpet`），`dsh-workpet-parrot` 同理。

然后刷新 Harness 窗口。DeepSeek Harness 0.2.0 及更早版本**首次安装后需要重启一次应用**：这些版本只在启动时读取组合包的依赖，重启前小猫那一行会报 "failed to import"。更新的版本会立即生效。


<a id="using-it"></a>
## 使用

- 宠物悬浮在右下角，可以拖到任意位置并记住位置；点一下可以摸摸它。
- 鼠标悬停显示会话状态。会话等你处理、一轮刚完成或出错时，气泡会常驻。
- **插件 → 工作宠物** 页面有**形象**下拉框，列出所有已注册的形象；还有**预览动作**下拉框，可以查看当前形象在任意状态下的样子。

| 会话状态 | 小猫 |
|---|---|
| 没有打开会话 | 闭眼坐着 |
| 空闲 | 坐着眨眼、摇尾巴 |
| 空闲一段时间 | 蜷成一团睡觉 |
| 模型思考 | 歪头向上看 |
| 模型写作 | 在小笔记本上打字 |
| 调用工具 | 在飘落的树叶里奔跑，带工具角标 |
| 请求重试 | 螺旋眼，晕乎乎 |
| 等你批准 / 回答 / 看计划 | 举爪挥手 |
| 子智能体在跑 | 看着身边的小猫崽 |
| 一轮完成 | 开心地跳起来 |
| 一轮失败 | 耳朵耷拉、掉眼泪 |
| 被摸 | 眯眼呼噜 |
| 被拖拽 | 被拎着晃腿 |

<a id="create-your-own-pet"></a>
## 开发自己的宠物

从 **[dsh-workpet-parrot](https://github.com/lastorder/dsh-workpet-parrot)** 开始。它把一个完整的形象放在一个纯 JavaScript 文件里，免编译、不用 TypeScript，所以要改的几乎全是图像本身：

1. 复制这个仓库，改掉包名、`cordis.patch.yml` 里的 Loader 行、`window.__ModuleLoader__.load` 里的 `id`、形象的 `id`，以及 CSS 前缀 `wpp-`。
2. 替换 `client.js` 里的图像：调色板、身体部件、每个状态一个姿势，都是 100 × 80 画布里的 SVG 标记。它的 README 列出了所有状态、可复用的部件和动画规则。
3. 作为独立组合包，和 `dsh-workpet` 一起用 `install_bundle` 安装，打开 **插件 → 工作宠物**，在**形象**下拉框里选中它，再切换**预览动作**逐个检查。

宠物要实现的接口（`WorkpetSkin`、`WorkpetScene`、`ctx.workpet`）见 [docs/architecture.zh.md](docs/architecture.zh.md#the-interface)。如果想用 TypeScript 编译的方式写，参考 [`dsh-workpet-cat`](packages/workpet/workpet-cat)。

<a id="development"></a>
## 开发

```sh
pnpm run build       # 所有包：lib/index.js、lib/client.js（dsh-workpet 还有 lib/types）
pnpm run typecheck
pnpm run test        # 纯逻辑测试 + 构建产物冒烟测试
pnpm run verify      # 以上三项
```

目录结构仿照 DeepSeek Harness monorepo：包位于 `packages/<group>/<package>/`，每个包有 Host 半侧（`src/index.ts`）和 Client 半侧（`src/client/`）。约定和 npm 发布流程见 [AGENTS.md](AGENTS.md)。

<a id="documentation"></a>
## 文档

- [架构](docs/architecture.zh.md)：能力角色、接口、数据流、状态优先级、编写新形象。
- [包分组](packages/README.md)。
