<p align="center">
  <img src="./resources/aionui-banner-1.png" alt="Ai8 Work — 本地 AI 工作台" width="100%">
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

> ## 🚀 Ai8 Work — 你的本地 AI 工作台 / *Your Local AI Workbench*
>
> 基于 [AionUi](https://github.com/iOfficeAI/AionUi)（Apache-2.0）深度定制的开源 AI 协作平台，
> **内置无限画布（Infinite Canvas）**，让 AI 智能体不仅会聊天，还会在你的电脑上
> 读文件、写代码、生成文档，并在可视化画布上与你共创内容。
>
> **本项目特色：**
> - 🎨 **无限画布工作区** — 全新 `/canvas` 工作台，节点式画布嵌入，AI 创作可视化
> - 🔌 **模型零配置打通** — 画布自动复用你在「设置 → 模型」中配置的 OpenAI 兼容模型通道，无需二次配置
> - 🛡️ **模型通道增强（v2.1.65）** — 自动拉取供应商权威 `/v1/models`，修复模型名错乱与聊天 "Failed to fetch"，模型 ID 确定性解析
> - 🏷️ **百技助手** — 内置助手品牌升级，中文界面更贴合本地化场景
> - 🤖 **完整继承 AionUi** — 内置智能体、多 Agent 协作、远程访问、24/7 定时任务等全部能力
>
> <sub>上游项目：<a href="https://github.com/iOfficeAI/AionUi">iOfficeAI/AionUi</a> · 画布引擎：<a href="https://github.com/basketikun/infinite-canvas">basketikun/infinite-canvas</a> · 开源协议：Apache-2.0</sub>
>
> 🌐 官方网站：**[https://ai8.app](https://ai8.app)** —— 产品介绍 / 下载 / 文档 / 三语支持

---

## 🔄 近期更新 / *What's New*

> 最新版本：**v2.1.65**（2026-08-25）

- **模型通道可靠性** — 针对聊天 "Failed to fetch" 与卡片模型名错乱的问题，改为直接拉取供应商权威 `/v1/models`，确定性生成模型 `_uid`，并对模型做统一分类；`configRef` 竞态修复，多通道切换不串配置。
- **品牌升级** — 内置助手入口更名为「**百技助手**」；画布欢迎页由 "Tapnow Studio" 改为 "**Ai8 Studio**"。
- **无限画布持续增强** — 画布作为独立工作区嵌入，AI 创作可视化，节点式编排更顺滑。

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

## 📋 目录 / *Contents*

- [✨ 新增功能：无限画布](#-新增功能无限画布)
- [🖥️ Cowork —— 与你并肩工作的 AI 智能体](#️-cowork--与你并肩工作的-ai-智能体)
- [🚀 快速开始](#-快速开始)
- [📦 技术架构](#-技术架构)
- [🔨 构建与开发](#-构建与开发)
- [📜 许可证与致谢](#-许可证与致谢)

---

## ✨ 新增功能：无限画布

> ### Infinite Canvas — 让 AI 创作「看得见」/ *Visualize AI creation*

无限画布是 Ai8 Work 在 AionUi 之上**新增加的旗舰功能**：将
[basketikun/infinite-canvas](https://github.com/basketikun/infinite-canvas)
以子应用形式无缝嵌入桌面应用，作为一个独立的工作区页面（左侧导航 →「无限画布」）。

| 能力 | 说明 |
| --- | --- |
| **节点式无限画布** | 自由拖拽、缩放、连线、节点组织；内置小地图（Minimap）与撤销/重做 |
| **AI 文生图 / 图生图** | 在画布上直接生成与编辑图片，支持参考图、多轮迭代 |
| **AI 视频 / 音频生成** | 接入 OpenAI 兼容的视频、音频生成模型 |
| **画布问答（Canvas QA）** | 选中节点即可对画布内容提问，AI 结合上下文作答 |
| **模型零配置** | ✅ **画布自动使用「设置 → 模型」里配置的模型通道**，无需在画布内再填任何 API Key |
| **本地优先存储** | 数据保存在本地（IndexedDB），支持 WebDAV 云同步、导入/导出 |
| **插件系统** | 支持画布节点插件扩展（TypeScript SDK） |

> 🎯 **设计要点：一套 API，处处可用**
> 你在 Ai8 Work「设置 → 模型」中配置的 OpenAI 兼容供应商（API 地址 + Key + 模型），
> 会通过内置桥接（postMessage）自动注入画布并持久化。**画布侧零配置**，改模型只需在设置里改一处。
>
> 画布内的 AI 生成能力（文生图 / 视频 / 音频）默认使用注入通道的文本模型；
> 如需专门的分支模型，可在画布「设置」面板中按需补充，已注入的通道会自动出现在模型列表中。

> 🤖 **智能体会话也能操作画布（内置 MCP）**
> Ai8 Work 内置了「无限画布 MCP」（基于 [canvas-agent](https://github.com/basketikun/infinite-canvas/tree/main/canvas-agent)，
> 本地自包含 bundle，离线可用）。启用后，聊天中的 AI 智能体可以直接在你的画布上
> **创建节点、生成图片/视频/音频、连线编排、读取画布状态**，画布成为智能体的可视化协作区。
>
> **启用方式**：设置 → 工具 → MCP → 找到 **Infinite Canvas** → 打开开关（`node .../builtin-mcp-canvas-agent.js mcp`，开箱即用，无需联网）。
> 使用前需在画布页右上角开启「Agent」连接（本地 Canvas Agent 服务）。

<p align="center">
  <img src="./resources/offica-ai BANNER-function.png" alt="Ai8 Work 功能总览" width="800">
</p>

---

## 🖥️ Cowork —— 与你并肩工作的 AI 智能体

> ### AI Agents That Work Alongside You

**Ai8 Work 远不止是一个聊天客户端。** 它是一个 **Cowork（协作）平台**——AI 智能体在你的电脑上与你并肩工作：
读取文件、编写代码、浏览网页、自动完成任务。你全程可见、随时可控。

| 能力对比 | 传统 AI 聊天工具 | **Ai8 Work（Cowork）** |
| :--- | :--- | :--- |
| AI 操作你的本地文件 | 受限或没有 | **✅ 内置智能体，完整文件访问权限** |
| AI 执行多步骤任务 | 受限 | **✅ 自主执行 + 你的审批确认** |
| 手机远程访问 | 很少见 | **✅ WebUI + 微信/飞书/钉钉/Telegram** |
| 定时自动化 | 没有 | **✅ Cron 定时任务，7×24 无人值守** |
| 同时运行多个 AI 智能体 | 没有 | **✅ 数十种外部智能体统一管理** |
| 价格 | 免费/付费 | **✅ 免费 & 开源** |

### 🤖 内置智能体 —— 安装即用，零配置

- 无需单独安装任何 CLI 工具，**内置完整智能体引擎**（aionrs）
- 粘贴任意 API Key 即可开始使用
- 完整能力：文件读写、联网搜索、图片生成、MCP（模型上下文协议）工具
- **21 个内置专业助手（「百技助手」）**开箱即用：Cowork、PPT 创作、Word 创作、Excel 创作、Morph PPT、Pitch Deck、Dashboard、学术论文、金融模型等

<p align="center">
  <img src="./resources/homepage.png" alt="内置智能体与助手" width="800">
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

### 👨‍👩‍👧 团队模式 —— 多智能体协同作战

以 **Leader + Teammates** 结构组织多智能体协作：Leader 接收指令、拆解子任务，
通过内置 Team MCP Server 分派给 Teammates 并行执行，结果经异步邮箱汇总、写入共享任务板。

- **并行多智能体执行** — Leader 拆解任务 → Teammates 并行执行（各自使用所选后端的模型）
- **Leader 编排** — 支持 Claude Code、Codex、Hermes、Gemini、Snow CLI、Aion CLI 等后端
- **团队隔离工作区** — 所有智能体共享同一目录，各自独立审批弹窗 + 侧边栏待审批角标
- **动态扩缩容** — 团队运行中可增删 Teammates；静默智能体自动升级为失败并可一键移除

<p align="center">
  <img src="./resources/AionUi_team.gif" alt="团队模式" width="800">
</p>

### 🔑 任意 API Key，获得完整 Cowork 能力

| 你的 API Key | 你将获得 |
| :--- | :--- |
| Gemini API Key | Gemini 驱动的 Cowork 智能体 |
| OpenAI API Key | GPT 驱动的 Cowork 智能体 |
| Anthropic API Key | Claude 驱动的 Cowork 智能体 |
| AWS Bedrock 凭据 | Bedrock 驱动的智能体 |
| Ollama / LM Studio（本地） | 本地模型 Cowork 智能体 |
| NewAPI 网关 | 一个网关聚合 20+ 模型 |

**支持 30+ AI 平台**：官方平台（Gemini / Anthropic / OpenAI / Vertex AI）、云厂商（AWS Bedrock / NewAPI 网关）、
国内平台（通义千问 / 智谱 / Kimi / 百度千帆 / 腾讯混元 / 零一万物 / ModelScope / 硅基流动 / 天翼云 / StepFun / PPIO 等）、
国际平台（DeepSeek / MiniMax / Novita / OpenRouter / xAI / 火山方舟 / Poe 等）、本地模型（Ollama / LM Studio）。
文件读写、联网搜索、图片生成、工具调用等能力与模型无关，全部可用。

<p align="center">
  <img src="./resources/llm_newapi.png" alt="30+ AI 平台支持" width="800">
</p>

### 🧩 可扩展的助手与技能体系

- **自定义助手** — 用自己的规则与能力定义专属助手
- **三级技能系统** — 内置技能（随应用发布）、自定义技能（你的专属）、扩展技能（第三方扩展 SDK 贡献）；按会话开关，聊天头部技能指示器实时显示
- **21 个内置专业助手** — 详见上文「内置智能体」；技能包括 `pptx`、`docx`、`pdf`、`xlsx`、`mermaid` 等

<p align="center">
  <img src="./resources/assitants.png" alt="助手与技能生态" width="800">
</p>

### 🌍 随处访问 —— 你的 7×24 AI 助手

- **WebUI 模式** — 手机 / 平板 / 任意电脑浏览器访问；支持局域网、跨网、服务器部署；二维码或密码登录
- **聊天平台集成** — **Telegram** · **飞书（Lark）** · **钉钉（DingTalk，AI 卡片流式 + 自动降级）** · **微信（个人号）** · 企业微信 / Slack / Discord 即将到来

> 配置：Ai8 Work → 设置 → WebUI 设置 → Channel，填入 Bot Token 即可。

<p align="center">
  <img src="./resources/webui-remote.gif" alt="WebUI 远程访问" width="800">
</p>

### ⏰ 定时任务 —— 让 AI 自动驾驶

*设置一次，AI 智能体按计划自动运行，真正做到 24/7 无人值守。*

- **自然语言** — 像聊天一样告诉智能体做什么
- **三种调度模式** — 标准 Cron 表达式（支持时区）/ 固定间隔（每 N 分钟/小时）/ 一次性触发
- **AI 自主创建任务** — 对话中智能体可直接创建定时任务
- **典型场景** — 定时数据汇总、日报/周报生成、文件整理、提醒通知

<p align="center">
  <img src="./resources/alart-task.png" alt="定时任务" width="800">
</p>

<details>
<summary><strong>🔍 定时任务详情（点击展开）</strong></summary>

<br>

- **执行模式** — 「在现有会话中继续」（保留完整上下文）/「每次新建会话」（适合独立周期性报告）
- **会话绑定** — 每个任务绑定一个会话，上下文与历史自动延续
- **防休眠** — 任务运行期间自动阻止系统休眠，唤醒后检测补跑错过的任务
- **高级配置** — 每个任务可独立设置模型、工作目录、推理强度
- **示例** — 每日天气报告 · 每周销售数据汇总 · 每月备份整理 · 自定义提醒

</details>

### 👁️ 预览面板 —— 即时查看 AI 生成结果

*支持 10+ 种格式：PDF、Word、Excel、PPT、代码、Markdown、图片、HTML、Diff……无需切换应用。*

- **即时预览** — 智能体生成文件后立即查看
- **实时跟踪 + 可编辑** — 自动跟踪文件变化；Markdown、代码、HTML 支持实时编辑
- **多标签页** — 同时打开多个文件，各自独立标签页

**支持的格式**：文档（PDF / Word / Excel / PowerPoint / ODT / ODS / CSV）、代码（JS / TS / Python / Java / Go / Rust / C/C++ / 30+ 语言）、标记（Markdown / HTML）、图片（PNG / JPG / GIF / SVG / WebP / BMP / AVIF）、其他（Diff / Patch）

<p align="center">
  <img src="./resources/preview.gif" alt="预览面板" width="800">
</p>

### 🗂️ 智能文件管理 —— 文件操作自动化

- **自动整理** — 识别内容自动分类，文件夹井井有条
- **高效批处理** — 一键重命名、合并文件
- **自动执行** — AI 智能体独立执行文件操作
- **场景** — 整理下载文件夹 · 照片批量重命名 · 多文档合并 · 按内容自动归档

### 📈 Excel 数据处理 —— AI 驱动的数据分析

- **智能分析** — AI 分析数据模式并生成洞察
- **自动美化** — 专业样式自动格式化 Excel 报表
- **数据变换** — 自然语言完成数据转换、合并、重构
- **报表生成** — 从原始数据一键生成完整报告

<p align="center">
  <img src="./resources/generate_xlsx.gif" alt="Excel 数据处理" width="800">
</p>

### 🎨 AI 图片生成与编辑

- **文生图** — 自然语言描述生成图片
- **图片编辑** — 修改与增强已有图片
- **图片识别** — 分析并描述图片内容
- **批量处理** — 一次生成多张图片

<p align="center">
  <img src="./resources/Image_Generation.gif" alt="AI 图片生成" width="800">
</p>

### 📄 文档生成 —— PPT、Word、Markdown

- **PPTX 生成器** — 从大纲/主题生成专业演示文稿
- **Word 文档** — 结构规范的格式化文档
- **Markdown 文件** — 技术文档写作
- **PDF 转换** — 多格式互转

### 🎨 界面个性化定制

- **CSS 自定义** — 通过 CSS 代码自由定制界面颜色、风格、布局，打造专属体验

<p align="center">
  <img src="./resources/css with skin.gif" alt="CSS 界面定制" width="800">
</p>

### ⚡ 多任务并行处理

- **独立上下文** — 每个会话独立维护上下文与历史
- **并行执行** — 多任务同时运行互不干扰
- **智能管理** — 会话间轻松切换，状态可视化

<p align="center">
  <img src="./resources/multichat-side-by-side.gif" alt="多任务并行" width="800">
</p>

---

## 🚀 快速开始

> ### Quick Start

### 1. 下载安装

从 [Releases](https://github.com/wmhbcy8/Ai8-Work/releases) 下载对应平台安装包（macOS / Windows / Linux），安装即用。

### 2. 配置模型（一次配置，全局可用）

1. 打开 **设置 → 模型**
2. 添加你的 OpenAI 兼容供应商（如 DeepSeek / 通义千问 / NewAPI / 本地 Ollama 等）：填写 **API 地址（Base URL）**、**API Key**、模型列表
3. 也可以直接选择官方平台：Gemini / OpenAI / Anthropic / 智谱 / Kimi 等

> ✅ 完成之后，**无限画布自动复用这套配置**——无需在画布内再次配置任何 API Key。

### 3. 开始使用

- **对话工作区** — 打开任意助手开始 Cowork
- **无限画布** — 点击左侧导航「无限画布」进入画布工作区，直接与 AI 共创图片、视频、脑图
- **定时任务** — 设置 → 定时任务，让 AI 24/7 自动驾驶

---

## 📦 技术架构

> ### Architecture

```
┌──────────────────────────── Ai8 Work (Electron) ────────────────────────────┐
│ 桌面端 renderer (React + Arco Design)                                        │
│   ├─ 会话 / 团队 / 定时任务 / 设置 工作区                                     │
│   └─ /canvas 无限画布工作区（iframe 嵌入）                                    │
│         ▲ postMessage 配置桥（aionui:canvas:*）                              │
│  web-host 静态服务器（本地 25808 端口）                                      │
│   └─ /canvas/* ← Infinite Canvas 子应用（VITE_BASE=/canvas/ 构建）            │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **桌面壳**：Electron + React + TypeScript + Arco Design（monorepo：desktop / web-cli / web-host）
- **智能体引擎**：内置 aionrs 引擎 + 外部 CLI 智能体（ACP 协议）+ MCP 工具统一管理
- **无限画布**：以静态子应用嵌入，升级隔离——上游更新只需重跑 `scripts/sync-canvas.js`
- **模型打通**：设置 → 模型 的 OpenAI 兼容供应商 → postMessage 桥 → 画布 localStorage（零配置注入）
- **数据存储**：会话/设置本地存储；画布数据 IndexedDB + WebDAV 同步

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

# 同步无限画布子应用（画布上游升级后执行）
node scripts/sync-canvas.js --src <infinite-canvas/web 路径>

# 无头 E2E 验证（画布配置注入）
node scripts/verify-canvas-e2e.js
```

---

## 📜 许可证与致谢

> ### License & Credits

本项目基于 [Apache-2.0](LICENSE) 开源许可发布。

- 上游基础：**[iOfficeAI/AionUi](https://github.com/iOfficeAI/AionUi)**（Apache-2.0）
- 画布引擎：**[basketikun/infinite-canvas](https://github.com/basketikun/infinite-canvas)**（MIT）
- Office 文档能力：**[iOfficeAI/OfficeCLI](https://github.com/iOfficeAI/OfficeCLI)**

感谢所有开源项目与社区的支持。🙏
