# 架构

[English](architecture.md) | 中文

dsh-workpet 把「用宠物动作表现会话状态」做成 DeepSeek Harness 的一种**能力**，构建方式与 Harness 自己的能力（模型提供方、shell 执行器、文件系统访问）一致：一个能力分三个角色，角色各自独立演进时各占一个 npm 包。

## 目录

- [能力角色](#capability-roles)
- [包与组合](#packages-and-composition)
- [接口](#the-interface)
- [数据流](#data-flow)
- [状态优先级](#activity-precedence)
- [屏幕上的宠物与配置页](#pets-on-screen-and-the-configuration-page)
- [编写新形象](#writing-a-new-appearance)
- [已知限制](#limitations)

-----

<a id="capability-roles"></a>
## 能力角色

| 角色 | 负责什么 | 包 |
|---|---|---|
| **Service Definition（服务定义）** | `ctx.workpet`（`WorkpetService`）：形象注册表，以及词汇类型（`WorkpetScene`、`WorkpetSkin` 等） | `dsh-workpet` |
| **Service Provider（服务提供方）** | 一种形象：一个 `WorkpetSkin`，其 `Figure` 能为任意场景画出这只宠物 | `dsh-workpet-cat`（默认）、`dsh-workpet-parrot`（独立仓库）、任意第三方 |
| **Consumer（消费方）** | 读取主视图会话，每次渲染推导一个 `WorkpetScene`，为每个已注册的形象画一只宠物；另外还有给宠物供数据的 Chat 探针，以及配置页（形象卡片、动作预览） | `dsh-workpet` |

定义与消费方放在同一个包，因为它们是同一件事：注册表只为悬浮宠物和配置页服务。这里没有“选择”：形象的插件启用时它就在屏幕上，所以插件管理里的开关就是唯一的控制方式。提供方只在类型层面依赖定义；运行时通过依赖注入拿到 `ctx.workpet`，不引入它的任何代码。

```mermaid
flowchart LR
  subgraph def["dsh-workpet（定义 + 消费方）"]
    R["ctx.workpet<br/>WorkpetRegistry"]
    O["shell.overlay<br/>每个形象一只宠物"]
    PR["conversation.composer.dock<br/>Chat 探针"]
    CP["plugins.bundle.config<br/>形象卡片 + 动作预览"]
  end
  CAT["dsh-workpet-cat<br/>（默认形象）"] -- "register(skin)" --> R
  PAR["dsh-workpet-parrot<br/>（另一个组合包）"] -- "register(skin)" --> R
  R -- "形象列表" --> O
  R -- "形象列表" --> CP
  PR -- "ChatSignal" --> O
```

<a id="packages-and-composition"></a>
## 包与组合

包位于 `packages/<group>/<package>/`；`workpet` 分组承载这个能力族。

| 包 | Loader 行 | Host 半侧 | Client 半侧 |
|---|---|---|---|
| `dsh-workpet` | `dsh-workpet` | 空 `apply` | 提供 `ctx.workpet`；注册悬浮宠物、探针和配置页 |
| `dsh-workpet-cat` | `dsh-workpet-cat` | 空 `apply` | `inject = ['workpet', 'locale']`；注册形象 `cat` |

`dsh-workpet` 是**组合包（bundle）**：它的 `cordis.patch.yml` 插入两行，`package.json` 把 `dsh-workpet-cat` 声明为依赖。DeepSeek Harness 从 profile 以及每个已选组合包的依赖闭包（从组合包自己的目录解析）中解析行名，所以安装 `dsh-workpet` 后 `dsh-workpet-cat` 无需再装一次就能被解析。`dsh-workpet-cat` 本身不是组合包：两个组合包插入同一个行 id 会冲突。小猫站在默认角落，是因为它的 `order`（0）排在最前；在组合包页面关闭这一行，小猫就会消失，剩下其它形象。第三方形象是独立的组合包。

DeepSeek Harness 0.2.0 只在启动时计算这张包表，所以首次安装后需要重启一次，小猫那一行才能解析；0.2.1 会在每次安装后刷新。

两个 Host 半侧都是空的。只有当某个 Loader 行指名该包时，它的 Client 半侧才会被送到浏览器，所以每个包都保留一行。

两条相互独立的边保证启动顺序：

- 提供方 `package.json` 里的 `dsh.client.inject: ["dsh-workpet"]` 让模块表先送达能力包的工厂函数。
- 提供方 Client 半侧的 `export const inject = ['workpet', ...]` 让 Cordis 只在 `ctx.workpet` 存在时激活它，并在能力消失时释放它。

<a id="the-interface"></a>
## 接口

完整契约见 `packages/workpet/workpet/src/client/contract.ts`，以纯类型入口 `dsh-workpet/contract` 发布。

```ts
type WorkpetActivity =
  | 'absent' | 'idle' | 'sleeping' | 'thinking' | 'writing' | 'tool' | 'retrying'
  | 'awaiting' | 'delegating' | 'done' | 'error' | 'petted' | 'dragged'

interface WorkpetScene {
  readonly activity: WorkpetActivity
  readonly tool?: { readonly name: string; readonly category: WorkpetToolCategory } // activity 为 'tool' 时存在
  readonly awaiting?: 'approval' | 'question' | 'plan-review' | 'other'               // activity 为 'awaiting' 时存在
  readonly helpers: number                                                            // 正在运行的子智能体数
}

interface WorkpetSkin {
  readonly id: string        // 稳定的 [a-z0-9-]+；宠物在屏幕上的位置按 id 保存
  readonly order?: number    // 排列顺序：屏幕上从角落往左排，配置页上也按它排
  title(): string            // 本地化名称，渲染时读取
  description?(): string
  readonly Figure: ComponentType<{ scene: WorkpetScene; compact?: boolean }>
}

interface WorkpetService {            // ctx.workpet
  readonly stage: { width: 100; height: 80 }
  register(skin: WorkpetSkin): () => void   // 宠物出现；返回的函数让它消失
  getSnapshot(): { skins }                  // 所有已注册的形象，按顺序
  subscribe(listener: () => void): () => void
}
```

职责划分保证每种形象行为一致：

- **Figure** 只画宠物本身，画在 `viewBox="0 0 100 80"` 里，并覆盖全部状态。`compact` 为真时（子智能体小伙伴、预览）可以简化。
- **Consumer** 负责每只宠物的位置、拖拽、抚摸、状态气泡、工具角标（💻 🔍 ✏️ 🌐 🤝 📋 ❓ 🔧）、子智能体小伙伴（最多两个同一 Figure 的缩小版）以及特效：爱心、星星、`z`、`!`、`?`、`…`、`↻`。
- 抛异常的 Figure 会被错误边界拦住，slot 和页面其余部分照常工作。

<a id="data-flow"></a>
## 数据流

1. **探针**（`conversation.composer.dock`，会话作用域，不渲染任何内容）。通过标准的 `useChat` hook 读取会话的 Chat 目标——`legacy.runningCalls`、`legacy.partial`、`legacy.nodes`——发布一个 `ChatSignal`：实时活动（工具、重试、写作、思考）以及最新的已定节点是否为回合错误。
2. **悬浮宠物**（`shell.overlay`，根作用域）。读取标准的 `useSessions`、`useSessionStatus`、`usePanelInfo` hook：`retainedBy.mainView` 计数大于 0 的会话就是主视图会话；`running` 与 `pendingInteraction` 来自它的状态；小伙伴数是它的 `subagentCatalog` 投影里正在运行的条目数。把这些事实与探针信号、本地交互状态合并后调用 `deriveScene`。
3. **形象**。`snapshot.skins` 里每个形象画一只宠物。宠物们共享会话事实（运行、等你、回合结束的庆祝、打瞌睡），拖拽和抚摸则各管各的，所以拖小猫时只有小猫在晃。

插件不新增 Host 服务、不发网络请求、不写会话事件；它只读取对话视图本来就在渲染的 Client 状态。

<a id="activity-precedence"></a>
## 状态优先级

`deriveScene`（`src/client/scene.ts`）按顺序取第一条命中的规则：

| # | 条件 | 状态 |
|---|---|---|
| 1 | 没有主视图会话 | `absent` |
| 2 | 用户正在拖拽宠物 | `dragged` |
| 3 | 1.6 秒内被点击，且会话既没在运行也没在等待 | `petted` |
| 4 | 存在 `pendingInteraction` | `awaiting`（`approval` / `question` / `plan-review` / `other`） |
| 5 | 运行中，探针看到正在执行的工具调用 | `tool` |
| 6 | 运行中，最新的已定节点是已排期的重试 | `retrying` |
| 7 | 运行中，流式步骤已有可见文本或推理 | `writing` |
| 8 | 其它运行情况 | `thinking` |
| 9 | 空闲但子智能体仍在运行 | `delegating` |
| 10 | 刚刚停止（2.6 秒） | `done` |
| 11 | 刚刚因回合错误停止（5.2 秒） | `error` |
| 12 | 空闲超过 70 秒 | `sleeping` |
| 13 | 其它 | `idle` |

状态气泡在鼠标悬停时出现。`awaiting`、`done`、`error` 时每只宠物下方都会常驻，不管宠物被拖到哪里都能看到；默认位置间距足够，气泡不会互相重叠。

<a id="pets-on-screen-and-the-configuration-page"></a>
## 屏幕上的宠物与配置页

每个已注册的形象都是屏幕上的一只宠物。安装或启用一个形象插件，不用任何设置就会多一只宠物；关闭它，宠物立即消失，因为注册挂在提供方的 `ctx.effect` 上。默认小猫是**工作宠物**组合包页面上的 `dsh-workpet-cat` 行；其它形象是各自独立的组合包。

每只宠物的位置单独保存在 `localStorage` 的 `dsh-workpet:position:<形象 id>` 下，并限制在窗口内。没拖动过的宠物站在默认位置：按 `order` 排第一的在右下角，后面的每隔 150 px 往左排。排第一的宠物还会读取旧版本使用的唯一键 `dsh-workpet:position`，所以原来的小猫会留在原地。

**插件 → 工作宠物** 的组合包页面里有一块通过 `plugins.bundle.config` slot 贡献的区域，以包名 `dsh-workpet` 为 key：

- **形象卡片**：按 `order` 每个已注册形象一张，卡片里是一个小舞台、形象名称、描述和状态气泡；最后一张卡片说明怎样添加更多宠物，并链接到 dsh-workpet-parrot 仓库（没有任何形象时，说明怎样把小猫找回来）；标题旁的 **GitHub** 链接打开本仓库；
- **动作预览**：所有动作都以按钮列出，分为日常、工作中、等你、回合结束、互动五组。点一个就高亮它，所有卡片里的宠物同时表演这个动作；选中“用工具”时多出一排工具种类，用来切换角标。动作目录在 `src/client/preview.ts`。

<a id="writing-a-new-appearance"></a>
## 编写新形象

第三方提供方是一个只有一行 Loader 行和一个 Client 半侧的组合包（默认小猫是例外：它随 `dsh-workpet` 组合包一起发布）。有两种写法：

- **需要编译**（如 `dsh-workpet-cat`）：TypeScript/TSX 源码，从 `dsh-workpet/contract` 做 `import type`，由 `scripts/build.mjs` 构建。
- **免编译**（如独立仓库 [`dsh-workpet-parrot`](https://github.com/lastorder/dsh-workpet-parrot)，推荐作为模板）：手写一个 `client.js`，自己调用 `window.__ModuleLoader__.load`，用 `React.createElement`，用 SVG 标记字符串画图。它的 README 是一份逐步的绘制指南。

无论哪种写法：

1. `package.json`：`dsh.bundle.patch`、`./client` 导出、`dsh.client.inject: ["dsh-workpet"]`。
2. `cordis.patch.yml`：插入一行，名字就是包名。
3. Client 半侧：

   ```ts
   import type { WorkpetProviderContext, WorkpetSkin } from 'dsh-workpet/contract'

   export const inject = ['workpet', 'locale']

   export function apply(ctx: WorkpetProviderContext): void {
     ctx.effect(() => ctx.locale.register('mySkin', { en, zh }))
     const t = ctx.locale.bind('mySkin')
     const skin: WorkpetSkin = { id: 'axolotl', order: 20, title: () => t('title'), Figure: AxolotlFigure }
     ctx.effect(() => ctx.workpet.register(skin))
   }
   ```

4. Client 半侧必须是调用 `window.__ModuleLoader__.load({ id: '<包名>', factory })` 的经典脚本；`react` 与 `react/jsx-runtime` 通过工厂函数的 `require` 获得，不打进包里。`scripts/build.mjs` 从源码生成这种格式；免编译的形象直接手写这种格式。
5. 画全所有状态；渐变和裁剪 id 按实例生成（`useId`），因为小伙伴会同时渲染多个 Figure；CSS 类名加前缀，并遵守 `prefers-reduced-motion`。

<a id="limitations"></a>
## 已知限制

- 宠物只反映主视图会话。
- 工具分类按工具名匹配，不读取工具元数据。
- `legacy` 是 Chat 目标的兼容切片；如果将来的 Harness 移除它，探针将不报告任何内容，运行中的会话会一直显示 `thinking`，直到探针更新。
- 位置保存在浏览器的 `localStorage`，所以每个浏览器 profile（以及来自不同 origin 的桌面窗口）各自保存。
- 抚摸、庆祝、入睡等时长是 `overlay.tsx` 里的常量；Host 半侧没有把配置送到浏览器的通道。
