# 蜘蛛纸牌 Spider Solitaire

![version](https://img.shields.io/badge/version-1.0.0-green) ![Electron](https://img.shields.io/badge/Electron-33-47848F?logo=electron&logoColor=white) ![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)

一款使用 Electron + Vue 3 打造的桌面版蜘蛛纸牌。带新手向导、双模式进度系统、合法走法轮换提示、GSAP 驱动的发牌与拖拽动画，以及 WebAudio 实时合成音效——无任何后端与网络依赖，数据全部本地存储。

## 功能特性

- **三步开局向导**：起名（头像 + 骰子随机起名）→ 选择模式 → 选择难度
- **双模式进度系统**：自由模式即开即玩；关卡模式带经验等级、累计积分与逐关变难的关卡曲线，进度按玩家名分别存档
- **合法走法轮换提示**：每次点击提示切换到下一个可行走法，源牌金色高亮、目标牌绿色高亮
- **完整撤销**：单步撤销与一键撤销全部，分数随快照回滚
- **断线续玩**：中途关闭自动存档，下次进入可继续对局
- **流畅动画**：GSAP 拖拽跟手 / 吸附 / 晃动反馈，逐张飞入的发牌动画
- **主题外观**：写实花牌 / 卡通牌面双主题，多种牌背与牌桌配色
- **合成音效**：发牌、移动、提示、完成、通关、错误音全部由 WebAudio 实时合成，零音频资源文件

## 玩法说明

### 基础规则

- 共 **104 张牌**（两副），牌桌分 **10 列**：开局 4 列各 6 张、6 列各 5 张（共 54 张），每列只有最顶一张翻开
- 剩余 **50 张** 分 **5 轮** 存放在右下角发牌堆，点击即向每列发 1 张（有空列时不能发牌）
- **目标**：把每种花色从 K 到 A 按降序接龙，同花色 K→A 凑齐一组即自动移除，凑满 **8 组** 通关

### 移动规则

- 牌只能放在**比它大 1 点**的牌上（如 ♠7 放到任意花色的 ♠8/♥8/♦8/♣8 上），不限花色
- 拖拽时只能整串移动**同花色降序连续**的牌（如 ♠9-♠8-♠7），不同花色的串不能整体拖动
- **空列**可以放任何牌或牌串

### 计分规则

| 事件 | 分值 |
| --- | --- |
| 每局开局 | 500 分 |
| 移动一次 / 发一轮牌 | −1 分 |
| 完成一组同花色 K→A | +100 分 |
| 下限 | 0 分（不为负） |

最终分 = 500 − 总步数 + 100 × 完成组数，通关步数越少分越高。撤销会整体回滚快照，分数一并恢复。

### 模式与进度

- **自由模式**：自选 1 / 2 / 4 花色难度，普通一局，不计经验与累计积分
- **关卡模式**：从当前关卡继续，难度由内置曲线自动决定，通关后进入下一关

| 关卡 | 难度 |
| --- | --- |
| 第 1 – 3 关 | 1 花色（入门） |
| 第 4 – 9 关 | 2 花色（进阶） |
| 第 10 关起 | 4 花色（大师） |

- 通关经验：1 花色 +100，2 花色 +250，4 花色 +600，经验决定玩家等级
- 每位玩家名拥有独立档案（关卡 / 等级 / 累计积分），数据保存在本地

## 技术栈

| 类别 | 技术 | 说明 |
| --- | --- | --- |
| 桌面壳 | Electron 33 | 跨平台桌面容器 |
| 前端框架 | Vue 3.5（`<script setup>`） | 组合式 API |
| 语言 | TypeScript 5 | 全量类型检查（vue-tsc） |
| 构建 | electron-vite 2 | 开发 / 构建一体化 |
| 打包 | electron-builder 25 | Windows 安装包 |
| 动画 | GSAP 3 | 拖拽跟手、吸附、发牌动效 |
| 图标 | @vicons/fluent | Microsoft Fluent UI 图标 |

- 状态管理：自研轻量 store（`src/renderer/src/game/store.ts`），无额外依赖
- 音效：Web Audio API 实时合成，无音频文件
- 存储：localStorage（玩家档案、对局存档）

## 快速开始

环境要求：Node.js ≥ 18

```bash
# 安装依赖
npm install

# 开发调试
npm run dev

# 类型检查
npm run typecheck

# 构建 Windows 安装包
npm run build:win
```

## 目录结构

```
├── electron-builder.yml     # 打包配置（NSIS 安装包）
├── scripts/afterPack.cjs    # 打包后体积裁剪脚本
└── src
    ├── main/                # Electron 主进程
    ├── preload/             # 预加载脚本
    ├── shared/              # 主/渲染共享类型
    └── renderer/src
        ├── assets/
        │   ├── cards/       # Bellot 花牌 SVG（12 张）
        │   └── icons/       # 自绘图标
        ├── components/      # 界面组件（向导 / 牌桌 / HUD / 弹窗）
        ├── composables/     # 拖拽、音效、外观、进度、通知
        └── game/            # 发牌 / 规则 / 状态（核心逻辑）
```

## 开源许可

本项目使用的第三方开源组件及其许可证：

| 组件 | 用途 | 许可证 |
| --- | --- | --- |
| [Vue](https://github.com/vuejs/core) | 前端框架 | MIT |
| [Electron](https://github.com/electron/electron) | 桌面容器 | MIT |
| [electron-vite](https://github.com/alex8088/electron-vite) | 构建工具 | MIT |
| [electron-builder](https://github.com/electron-userland/electron-builder) | 打包分发 | MIT |
| [GSAP](https://gsap.com/) | 动画引擎 | GSAP Standard "No Charge" License（免费商用） |
| [@vicons/fluent](https://github.com/07akioni/vicons) | Fluent 图标集 | MIT（图标源：Microsoft Fluent UI System Icons, MIT） |
| [TypeScript](https://github.com/microsoft/TypeScript) / vue-tsc | 类型系统 | Apache-2.0 / MIT |
| Bellot 花牌 SVG（`src/renderer/src/assets/cards/`） | 扑克牌面 | **LGPL-2.1**（随牌面附完整许可证文本，见 `cards/LICENSE.txt`） |

- 自绘资源：蜘蛛 Logo（`icons/spider.svg`）、卡通牌面、骰子图标为本项目原创，无第三方版权约束
- 音效为运行时合成，不含第三方音频素材
