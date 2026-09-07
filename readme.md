<p align="center">
  <img src="./docs/screenshots/banner.jpg" alt="Ai8 Work — AI ∞ · 无穷创造" width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/wmhbcy8/Ai8-Work?style=flat-square&color=32CD32" alt="Version">
  &nbsp;
  <img src="https://img.shields.io/badge/license-Apache--2.0-32CD32?style=flat-square&logo=apache&logoColor=white" alt="License">
  &nbsp;
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-6C757D?style=flat-square&logo=linux&logoColor=white" alt="Platform">
  &nbsp;
  <img src="https://img.shields.io/badge/免费-Free-32CD32?style=flat-square" alt="Free & Open Source">
</p>

---

> ## 🚀 Ai8 Work — AI ∞ · 无穷创造 / _Your Infinite AI Workbench_
>
> **ai8 = ai∞**：把「8」放倒，就是数学中的无穷符号 **∞**。
>
> Ai8 Work 相信：AI 新时代里真正属于你的产品，应该带来 **无穷无尽的创造力与解决方案**——一个桌面，拥有**无穷多的 AI 数字员工**：写方案、做 PPT、跑数据、写代码、整理知识、定时干活、跨端协办……创造没有上限。
>
> **我们把立场说清楚（我们的 FLAG）：**
>
> - 🔓 **不捆绑任何人的数据** — 笔记、文档、对话都以你的本地文件保存（纯 Markdown / 纯文本），随时带走，永远属于你
> - 🔌 **不捆绑任何模型** — 聚合 30+ 模型平台，也支持任意 OpenAI 兼容 API 与本地模型；随时更换、自由组合
> - 🖥️ **不锁定任何平台** — Windows / macOS / Linux 桌面端 + 浏览器 WebUI（手机 / 平板 / PWA），一处工作、随处访问
> - 👥 **无穷无尽的 AI 数字员工** — 内置 21 位「百技助手」开箱即用 + 自动接入 Claude Code / Codex 等数十种外部 CLI 智能体，统一管理、并行协作、组队攻坚
>
> <sub>开源协议：Apache-2.0 · 画布引擎：Ai8 Studio（节点式画布） · 官方网站：**[https://ai8.app](https://ai8.app)**</sub>

---

## 🔄 近期更新 / _What's New_

> 最新版本：**v2.1.71**（2026-09-07）

- 📝 **知识笔记（全新）** — 左侧导航新增「知识笔记」工作区：把任意本地文件夹变成你的**第二大脑**
  - **导入即笔记** — 拖入 PDF / Word / Excel / PPT / TXT / Markdown / 网页 / 文件夹… 自动提炼要点、生成结构化笔记
  - **对话一键存档** — 任何一段 AI 对话都能一键保存为笔记，方法与结论统统留档
  - **长文可追溯** — 超长文档自动摘要 + 原文附录，阅读流畅、随时回查
  - **纯 Markdown 本地保存** — 笔记就是你自己的 `.md` 文件，可用 Obsidian 或任何工具打开；数据不离开你的电脑
- 🐛 **体验修复** — 修复「新建笔记无反应」「知识库长文无法滚动到底」等问题
- 🏷️ **渠道增强（v2.1.70）** — 渠道设置全新界面：Telegram / Slack / Discord / 飞书（Lark）/ 钉钉 / 企业微信，一处配置
- **历史更新** — v2.1.65：模型通道可靠性（自动拉取供应商权威 `/v1/models`，修复聊天 "Failed to fetch"）；v2.1.62：品牌升级「百技助手」、画布引擎迁移至「Ai8 Studio」

---

<p align="center">
  <strong>免费 · 开源 · 本地部署 · 数据自主可控</strong><br>
  <em>内置智能体 | 零配置上手 | 任意 API Key | 多 Agent 协作 | 远程访问 | 跨平台 | 24/7 自动化</em>
</p>

<p align="center">
  <a href="https://github.com/wmhbcy8/Ai8-Work/releases">
    <img src="https://img.shields.io/badge/⬇️%20Download%20Now-Latest%20Release-32CD32?style=for-the-badge&logo=github&logoColor=white" alt="下载最新版本" height="50">
  </a>
</p>

<p align="center">
  📖 本文档以中文为主，英文为辅（*This README is primarily in Chinese, with English as a supplement*）
</p>

---

## 📋 目录 / _Contents_

- [✨ 旗舰功能：无限画布](#-旗舰功能无限画布)
- [🖥️ Cowork —— 与你并肩工作的 AI 智能体](#️-cowork--与你并肩工作的-ai-智能体)
- [📝 知识笔记 —— 本地第二大脑](#-知识笔记--本地第二大脑)
- [🚀 快速开始（下载安装）](#-快速开始下载安装)
- [📦 技术架构](#-技术架构)
- [🔨 构建与开发](#-构建与开发)
- [📜 许可证与致谢](#-许可证与致谢)

---

## ✨ 旗舰功能：无限画布

> ### Infinite Canvas — 让 AI 创作「看得见」/ _Visualize AI creation_

无限画布是 Ai8 Work 的**旗舰功能**：将自包含的
**「Ai8 Studio」节点式画布引擎**以单文件 HTML 形式嵌入桌面应用，
作为一个独立的工作区页面（左侧导航 →「无限画布」）。

在这里，**节点即模型、连线即流程**：把「对话 / 图片 / 视频」三类节点拖到画布上，
连线搭出你的 AI 工作流，一键运行。

| 能力                     | 说明                                                                              |
| ------------------------ | --------------------------------------------------------------------------------- |
| **节点式 AI 工作流画布** | 自由拖拽、缩放、连线、编排节点，整条工作流一键运行                                |
| **Chat 对话节点**        | 调用注入的对话/文本模型，沿流程连续推理（支持多步链式创作）                       |
| **Image 图片节点**       | 文生图 / 图生图，自动识别并优先使用具备图片生成能力的模型                         |
| **Video 视频节点**       | 接入视频生成模型；由模型 id 关键词自动识别映射（视频/音频类模型统一入口）         |
| **模型零配置**           | ✅ **画布自动使用「设置 → 模型」里配置的模型通道**，无需在画布内再填任何 API Key  |
| **权威模型清单**         | 自动拉取供应商 `/v1/models`，模型 id 与卡片名称确定性对齐，杜绝 "Failed to fetch" |
| **沙箱化嵌入**           | 画布以单文件 HTML 在隔离 iframe（Blob URL）中运行，安全隔离、独立升级             |

> 🎯 **设计要点：一套 API，处处可用**
> 你在 Ai8 Work「设置 → 模型」中配置的 OpenAI 兼容 / Gemini 供应商（API 地址 + Key + 模型），
> 会通过内置桥接（postMessage `aionui:config`）自动注入画布，并按能力分类映射到 **Chat / Image / Video** 节点。
> **画布侧零配置**，改模型只需在设置里改一处，画布即自动同步；供应商 `/v1/models` 会在后台拉取以校准模型 id。

<p align="center">
  <img src="./docs/screenshots/canvas.jpg" alt="无限画布工作区（Ai8 Work 实拍）" width="800">
</p>

---

## 🖥️ Cowork —— 与你并肩工作的 AI 智能体

> ### AI Agents That Work Alongside You

**Ai8 Work 远不止是一个聊天客户端。** 它是一个 **Cowork（协作）平台**——AI 数字员工在你的电脑上与你并肩工作：
读取文件、编写代码、浏览网页、自动完成任务。你全程可见、随时可控。

| 能力对比               | 传统 AI 聊天工具 | **Ai8 Work（Cowork）**                 |
| :--------------------- | :--------------- | :------------------------------------- |
| AI 操作你的本地文件    | 受限或没有       | **✅ 内置智能体，完整文件访问权限**    |
| AI 执行多步骤任务      | 受限             | **✅ 自主执行 + 你的审批确认**         |
| 手机远程访问           | 很少见           | **✅ WebUI + 微信/飞书/钉钉/Telegram** |
| 定时自动化             | 没有             | **✅ Cron 定时任务，7×24 无人值守**    |
| 同时运行多个 AI 智能体 | 没有             | **✅ 数十种外部智能体统一管理**        |
| 价格                   | 免费/付费        | **✅ 免费 & 开源**                     |

### 🤖 内置智能体 —— 安装即用，零配置

- 无需单独安装任何 CLI 工具，**内置完整智能体引擎**（aionrs）
- 粘贴任意 API Key 即可开始使用
- 完整能力：文件读写、联网搜索、图片生成、MCP（模型上下文协议）工具
- **21 个内置专业助手（「百技助手」）**开箱即用：Cowork、PPT 创作、Word 创作、Excel 创作、Morph PPT、Pitch Deck、Dashboard、学术论文、金融模型等

<p align="center">
  <img src="./docs/screenshots/home.jpg" alt="Ai8 Work 主界面（百技助手随叫随到）" width="800">
</p>

### 💬 对话即工作台 —— 一个对话框，完成真实工作

把文件、文件夹拖给 AI，它读取、执行、产出，全程可见：

<p align="center">
  <img src="./docs/screenshots/chat.jpg" alt="真实 AI 对话：读取文件、调用工具、完成任务" width="800">
</p>

### 📊 Office 办公助手 —— PPT / Word / Excel

- **PPT 助手** — 输出可编辑的 Morph 动画 PPT（`.pptx`），流畅的幻灯片转场与叙事节奏
- **Word 助手** — 输出可编辑的 Word（`.docx`），论文写作与生产级文档编辑
- **Excel 助手** — 输出可用的 Excel（`.xlsx/.xlsm/.csv`），数据分析、自动格式化与图表
- 底层由 [OfficeCLI](https://github.com/iOfficeAI/OfficeCLI) 驱动，产出即所得、直接可二次编辑

### 👥 多 Agent 模式 —— 已有 CLI 智能体？直接接入

已安装 Claude Code、Codex、Qwen Code、Hermes、OpenClaw 等 CLI 智能体？
Ai8 Work 自动检测并统一管理，在一个界面里与它们全部协作。

**支持智能体：** 内置智能体（aionrs 引擎）· Claude Code · Codex · Qwen Code · Gemini CLI · Goose · OpenClaw · Augment Code · CodeBuddy · Kimi CLI · OpenCode · Factory Droid · GitHub Copilot · Qoder · Mistral Vibe · Nanobot · Snow · Hermes · Cursor Agent · Pi · MiMo Code · omp · Antigravity · 等

- 🔍 **自动检测** — 自动识别已安装的 CLI 工具
- 🔗 **统一界面** — 一个平台管理所有 AI 智能体
- ⚡ **并行会话** — 多智能体同时运行，上下文相互独立
- 🧩 **MCP 统一管理** — 一处管理 MCP 工具，按各智能体能力自动注入/同步传输层
- 🚀 **YOLO / 全自动模式** — 支持无人值守模式的智能体可一键开启（具体权限行为取决于所选智能体）

<p align="center">
  <img src="./docs/screenshots/agents.jpg" alt="设置 → Agents：数十种智能体统一管理（v2.1.71 实拍）" width="800">
</p>

### 👨‍👩‍👧 团队模式 —— 多智能体协同作战

以 **Leader + Teammates** 结构组织多智能体协作：Leader 接收指令、拆解子任务，
通过内置 Team MCP Server 分派给 Teammates 并行执行，结果经异步邮箱汇总、写入共享任务板。

- **并行多智能体执行** — Leader 拆解任务 → Teammates 并行执行（各自使用所选后端的模型）
- **Leader 编排** — 支持 Claude Code、Codex、Hermes、Gemini、Snow CLI、Aion CLI 等后端
- **团队隔离工作区** — 所有智能体共享同一目录，各自独立审批弹窗 + 侧边栏待审批角标
- **动态扩缩容** — 团队运行中可增删 Teammates；静默智能体自动升级为失败并可一键移除

### 🔑 任意 API Key，获得完整 Cowork 能力

| 你的 API Key               | 你将获得                    |
| :------------------------- | :-------------------------- |
| Gemini API Key             | Gemini 驱动的 Cowork 智能体 |
| OpenAI API Key             | GPT 驱动的 Cowork 智能体    |
| Anthropic API Key          | Claude 驱动的 Cowork 智能体 |
| AWS Bedrock 凭据           | Bedrock 驱动的智能体        |
| Ollama / LM Studio（本地） | 本地模型 Cowork 智能体      |
| NewAPI 网关                | 一个网关聚合 20+ 模型       |

**支持 30+ AI 平台**：官方平台（Gemini / Anthropic / OpenAI / Vertex AI）、云厂商（AWS Bedrock / NewAPI 网关）、
国内平台（通义千问 / 智谱 / Kimi / 百度千帆 / 腾讯混元 / 零一万物 / ModelScope / 硅基流动 / 天翼云 / StepFun / PPIO 等）、
国际平台（DeepSeek / MiniMax / Novita / OpenRouter / xAI / 火山方舟 / Poe 等）、本地模型（Ollama / LM Studio）。
文件读写、联网搜索、图片生成、工具调用等能力与模型无关，全部可用。

### 🧩 可扩展的助手与技能体系

- **三级技能系统** — 内置技能（随应用发布）、自定义技能（你的专属）、扩展技能（第三方扩展 SDK 贡献）；按会话开关，聊天头部技能指示器实时显示
- **21 个内置专业助手** — 详见上文「内置智能体」；技能包括 `pptx`、`docx`、`pdf`、`xlsx`、`mermaid` 等

### 🌍 随处访问 —— 你的 7×24 AI 数字员工

- **WebUI 模式** — 手机 / 平板 / 任意电脑浏览器访问；支持局域网、跨网、服务器部署；二维码或密码登录
- **聊天平台集成** — **Telegram** · **飞书（Lark）** · **钉钉（DingTalk，AI 卡片流式 + 自动降级）** · **微信（个人号）** · 企业微信 / Slack / Discord 等持续扩展

> 配置：Ai8 Work → 设置 → 渠道，填入 Bot Token 即可。

<p align="center">
  <img src="./docs/screenshots/channels.jpg" alt="设置 → 渠道：Telegram / Slack / Discord / 飞书 / 钉钉 / 企业微信" width="800">
</p>

### ⏰ 定时任务 —— 让 AI 自动驾驶

_设置一次，AI 智能体按计划自动运行，真正做到 24/7 无人值守。_

- **自然语言** — 像聊天一样告诉智能体做什么
- **三种调度模式** — 标准 Cron 表达式（支持时区）/ 固定间隔（每 N 分钟/小时）/ 一次性触发
- **AI 自主创建任务** — 对话中智能体可直接创建定时任务
- **典型场景** — 定时数据汇总、日报/周报生成、文件整理、提醒通知

<details>
<summary><strong>🔍 定时任务详情（点击展开）</strong></summary>

<br>

- **执行模式** — 「在现有会话中继续」（保留完整上下文）/「每次新建会话」（适合独立周期性报告）
- **会话绑定** — 每个任务绑定一个会话，上下文与历史自动延续
- **防休眠** — 任务运行期间自动阻止系统休眠，唤醒后检测补跑错过的任务
- **高级配置** — 每个任务可独立设置模型、工作目录、推理强度
- **示例** — 每日天气报告 · 每周销售数据汇总 · 每月备份整理 · 自定义提醒

</details>

---

## 📝 知识笔记 —— 本地第二大脑

> ### Knowledge Notes — 把知识沉淀成你自己的

_不用再在「云端笔记」和「你的数据」之间做选择。知识笔记把任意本地文件夹变成你的私人知识库，一切以纯 Markdown 保存在你自己的硬盘上。_

- **📥 导入即笔记** — 拖入 PDF / Word / Excel / PPT / 网页 / TXT / Markdown 甚至整个文件夹，AI 自动提炼要点、生成结构化 Markdown 笔记（超长内容自动摘要 + 原文附录，可追溯）
- **💾 对话一键存档** — 聊天窗口一键把整段对话保存为笔记，标题、正文、标签自动整理
- **📂 本地文件夹即知识库** — 选择任意目录作为「知识笔记」根目录，笔记以 `.md` 文件存放，随时可以用 Obsidian / Typora / VS Code 等任何工具打开
- **🔍 随时检索** — 全部笔记统一检索，让沉淀的知识随时可被调取

<p align="center">
  <img src="./docs/screenshots/knowledge.jpg" alt="知识笔记（Ai8 Work v2.1.71 实拍）" width="800">
</p>

---

## 🚀 快速开始

> ### Quick Start

### 1. 下载安装（GitHub 最新版）

从 **[GitHub Releases](https://github.com/wmhbcy8/Ai8-Work/releases/latest)** 下载对应平台安装包，安装即用：

| 平台               | 安装包（v2.1.71）                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| **Windows** x64    | [Ai8Work-2.1.71-win-x64.exe](https://github.com/wmhbcy8/Ai8-Work/releases/download/v2.1.71/Ai8Work-2.1.71-win-x64.exe) |
| **Windows** arm64  | [Ai8Work-2.1.71-win-arm64.exe](https://github.com/wmhbcy8/Ai8-Work/releases/download/v2.1.71/Ai8Work-2.1.71-win-arm64.exe) |
| **macOS** Apple 芯片 | [Ai8Work-2.1.71-mac-arm64.dmg](https://github.com/wmhbcy8/Ai8-Work/releases/download/v2.1.71/Ai8Work-2.1.71-mac-arm64.dmg) |
| **macOS** Intel    | [Ai8Work-2.1.71-mac-x64.dmg](https://github.com/wmhbcy8/Ai8-Work/releases/download/v2.1.71/Ai8Work-2.1.71-mac-x64.dmg)     |
| **Linux** amd64    | [Ai8Work-2.1.71-linux-amd64.deb](https://github.com/wmhbcy8/Ai8-Work/releases/download/v2.1.71/Ai8Work-2.1.71-linux-amd64.deb) |
| **Linux** arm64    | [Ai8Work-2.1.71-linux-arm64.deb](https://github.com/wmhbcy8/Ai8-Work/releases/download/v2.1.71/Ai8Work-2.1.71-linux-arm64.deb) |
| **安卓 / 手机**     | 无需安装原生包：浏览器直接访问 **WebUI（PWA）** 即可使用，或自行部署 WebUI 服务后随处访问               |

### 2. 配置模型（一次配置，全局可用）

1. 打开 **设置 → 模型**
2. 添加你的 OpenAI 兼容供应商（如 DeepSeek / 通义千问 / NewAPI / 本地 Ollama 等）：填写 **API 地址（Base URL）**、**API Key**、模型列表
3. 也可以直接选择官方平台：Gemini / OpenAI / Anthropic / 智谱 / Kimi 等

> ✅ 完成之后，**无限画布自动复用这套配置**——无需在画布内再次配置任何 API Key。

### 3. 开始使用

- **对话工作区** — 打开任意助手开始 Cowork
- **无限画布** — 点击左侧导航「无限画布」进入画布工作区，用 Chat / 图片 / 视频节点搭出你的 AI 工作流
- **知识笔记** — 左侧导航「知识笔记」选择本地目录，拖入文件或保存对话，开始沉淀你的第二大脑
- **定时任务** — 设置 → 定时任务，让 AI 24/7 自动驾驶

---

## 📦 技术架构

> ### Architecture

```
┌──────────────────────────── Ai8 Work (Electron) ────────────────────────────┐
│ 桌面端 renderer (React + Arco Design)                                        │
│   ├─ 会话 / 团队 / 定时任务 / 知识笔记 / 设置 工作区                          │
│   └─ 无限画布工作区（iframe 嵌入）                                             │
│         ▲ postMessage 配置桥（aionui:config）                                │
│         └─ tapnow.html — Ai8 Studio 单文件画布引擎（?raw → Blob URL）         │
│  web-host 静态服务器（本地 25808 端口）                                      │
│   └─ 承载远程 WebUI / web-cli 等静态资源                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **桌面壳**：Electron + React + TypeScript + Arco Design（monorepo：desktop / web-cli / web-host）
- **智能体引擎**：内置 aionrs 引擎 + 外部 CLI 智能体（ACP 协议）+ MCP 工具统一管理
- **无限画布**：自包含的 Ai8 Studio 单文件画布引擎（tapnow.html），以 Blob URL 在 sandbox iframe 中运行，主进程隔离、独立升级
- **模型打通**：设置 → 模型 的 OpenAI 兼容 / Gemini 供应商 → postMessage（`aionui:config`）→ 画布内自动注入并按能力分类为 Chat / Image / Video（零配置）
- **数据存储**：会话/设置本地存储；笔记与文档为本地文件（Markdown）；画布数据随应用以 localStorage 本地持久化

---

## 🔨 构建与开发

> ### Build & Development

```bash
# 安装依赖（推荐 bun）
bun install

# 开发模式
bun run dev

# 构建
bun run make        # electron-vite build
bun run dist        # 完整打包（electron-builder）

# 画布引擎升级：替换 src/renderer/pages/canvas/tapnow.html（Ai8 Studio 单文件）后重新构建
# （模型注入 / 分类映射逻辑见 pages/canvas/index.tsx）

# 无头 E2E 验证（画布配置注入）
node scripts/verify-canvas-e2e.js
```

---

## 📜 许可证与致谢

> ### License & Credits

本项目基于 [Apache-2.0](LICENSE) 开源许可发布。

- 🙏 **特别感谢 [AionUi 项目组](https://github.com/iOfficeAI/AionUi)（iOfficeAI）** — Ai8 Work 站在巨人的肩膀上：本项目始于 AionUi（Apache-2.0）并深度演进为独立产品，感谢 AionUi 项目组与社区的无私开源贡献
- 上游基础：**[iOfficeAI/AionUi](https://github.com/iOfficeAI/AionUi)**（Apache-2.0）
- 画布引擎：**[Tapnow Studio](https://github.com/chapterv/Tapnow-Studio-PP)**（节点式 AI 工作流画布，衍生为「Ai8 Studio」单文件引擎；其上游遵循 GPLv3，分发时请注意，本仓库整体仍以 Apache-2.0 发布）
- Office 文档能力：**[iOfficeAI/OfficeCLI](https://github.com/iOfficeAI/OfficeCLI)**

感谢所有开源项目与社区的支持。🙏
