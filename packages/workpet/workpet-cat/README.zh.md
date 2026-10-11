# dsh-workpet-cat

[English](README.md) | 中文

工作宠物的默认形象：系着红色小围巾和铜铃铛的橘白小猫，手绘绘本画风（温暖的渐变、棕色墨线、红扑扑的脸颊、草丛、随风飘落的树叶）。

## 概要

`ctx.workpet` 的 Service Provider。Client 半侧声明 `inject = ['workpet', 'locale']`，在 `ctx.effect` 里注册形象 `cat`（`order: 0`）。它本身不是组合包：`dsh-workpet` 组合包依赖它并插入 `dsh-workpet-cat` 这一行，所以会随宠物一起安装。在组合包页面关闭这一行，小猫就会从下拉框消失。

## 动作

| 状态 | 动作 |
|---|---|
| `absent` | 闭眼坐着 |
| `idle` | 坐着眨眼、摇尾巴 |
| `sleeping` | 蜷成一团，尾巴绕在身前，慢慢呼吸 |
| `thinking` | 歪头、眼睛向上，尾巴轻甩 |
| `writing` | 在小笔记本上打字 |
| `tool` | 奔跑，围巾飘动，树叶飞过 |
| `retrying` | 螺旋眼，摇晃 |
| `awaiting` | 举爪挥手，睁大眼睛 |
| `delegating` | 左右张望 |
| `done` | 眯眼笑，跳起来 |
| `error` | 耳朵耷拉、难过、掉眼泪、发抖 |
| `petted` | 眯眼、脸更红、呼噜 |
| `dragged` | 被拎着晃腿 |

## 源码

- `src/client/parts.tsx` —— 调色板、带眼睛和嘴巴变化的头部、围巾、地面、树叶。
- `src/client/figure.tsx` —— 各个姿势以及状态到姿势的映射。
- `src/client/styles.ts` —— `wpc-` 前缀的动画；遵守 `prefers-reduced-motion`。
