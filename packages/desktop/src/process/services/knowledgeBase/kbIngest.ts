/**
 * @license
 * Copyright 2026 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import pdfParse from 'pdf-parse';
import { extractRawText as mammothExtractRawText } from 'mammoth';
import * as XLSX from 'xlsx-republish';
import type { TKbAiSettings } from '@/common/knowledge/types';
import { chatCompletion } from './kbLlm';

/** Ingest helpers: turn office documents / PDF / images into distilled Markdown notes. */

export type ExtractedSource = { kind: 'text'; text: string } | { kind: 'image'; dataUrl: string; promptName: string };

export interface DistillResult {
  title: string;
  tags: string[];
  markdown: string;
}

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']);
const MAX_TEXT_CHARS = 120_000;

export function isSupportedImportFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return (
    IMAGE_EXTS.has(ext) ||
    ext === '.docx' ||
    ext === '.xlsx' ||
    ext === '.xls' ||
    ext === '.pdf' ||
    ext === '.txt' ||
    ext === '.md' ||
    ext === '.csv'
  );
}

function mimeForExt(ext: string): string {
  const map: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
  };
  return map[ext] ?? 'image/png';
}

function sheetToMarkdownRows(wb: XLSX.WorkBook): string {
  const parts: string[] = [];
  const sheetNames = wb.SheetNames.slice(0, 5);
  for (const sheetName of sheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    parts.push(`## 工作表：${sheetName}`);
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];
    for (const rawRow of rows.slice(0, 300)) {
      const row = Array.isArray(rawRow) ? rawRow : [rawRow];
      const cells: string[] = [];
      for (const cell of row) {
        cells.push(
          String(cell ?? '')
            .replace(/\|/g, '│')
            .replace(/\n/g, ' ')
            .trim()
        );
      }
      while (cells.length > 0 && cells[cells.length - 1] === '') {
        cells.pop();
      }
      if (cells.length > 0) {
        parts.push(`| ${cells.join(' | ')} |`);
      }
    }
  }
  return parts.join('\n');
}

/** Extract plain text (or an image data URL) from a single file. */
export async function extractFile(filePath: string): Promise<ExtractedSource> {
  const ext = path.extname(filePath).toLowerCase();
  if (!isSupportedImportFile(filePath)) {
    throw new Error(`暂不支持 .${ext || '未知'} 格式（支持 docx/xlsx/pdf/txt/md/csv/图片）`);
  }

  if (IMAGE_EXTS.has(ext)) {
    const buf = await fs.readFile(filePath);
    return {
      kind: 'image',
      dataUrl: `data:${mimeForExt(ext)};base64,${buf.toString('base64')}`,
      promptName: path.basename(filePath),
    };
  }

  if (ext === '.docx') {
    const result = await mammothExtractRawText({ path: filePath });
    return { kind: 'text', text: result.value.trim() || '（文档中没有提取到文字内容）' };
  }

  if (ext === '.doc') {
    throw new Error('暂不支持旧版 .doc 格式，请在 Word 中另存为 .docx 后再导入');
  }

  if (ext === '.xlsx' || ext === '.xls') {
    const wb = XLSX.readFile(filePath);
    return { kind: 'text', text: sheetToMarkdownRows(wb) };
  }

  if (ext === '.pdf') {
    const buf = await fs.readFile(filePath);
    const parsed = await pdfParse(buf);
    const text = parsed.text?.trim() ?? '';
    if (text.length < 20) {
      throw new Error('未能从 PDF 中提取到文字，可能为扫描件/图片型 PDF（暂不支持 OCR），请先转换为文本型 PDF');
    }
    return { kind: 'text', text };
  }

  const text = await fs.readFile(filePath, 'utf8');
  return { kind: 'text', text: text.trim() || '（文件内容为空）' };
}

function truncate(text: string): string {
  if (text.length <= MAX_TEXT_CHARS) return text;
  return `${text.slice(0, MAX_TEXT_CHARS)}\n\n（内容过长，已截断，省略 ${text.length - MAX_TEXT_CHARS} 字）`;
}

/** Tolerant first-line-JSON reader: `{"tags":[...]}` then the markdown body. */
function parseJsonHead(input: string): { tags?: string[]; markdown: string } | null {
  const lines = input.split('\n');
  let jsonText = '';
  let idx = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line.startsWith('{')) {
      jsonText = line;
      idx = i;
      break;
    }
    if (line.startsWith('```')) continue;
    if (line.length === 0) continue;
    if (line.startsWith('[')) {
      // tags-only line like [a, b]
      try {
        const tags = JSON.parse(line.replace(/^\[/, '["').replace(/\]$/, '"]')) as string[];
        return {
          tags,
          markdown: lines
            .slice(i + 1)
            .join('\n')
            .trim(),
        };
      } catch {
        continue;
      }
    }
  }
  if (!jsonText) return null;
  try {
    const parsed = JSON.parse(jsonText) as { tags?: string[] };
    const rest = lines
      .slice(idx + 1)
      .join('\n')
      .trim();
    return { tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).filter(Boolean) : undefined, markdown: rest };
  } catch {
    return null;
  }
}

function cleanTags(tags: string[] | undefined): string[] {
  return (tags ?? [])
    .map((t) => t.trim().replace(/^#/, '').slice(0, 20))
    .filter(Boolean)
    .slice(0, 8);
}

const IMPORT_SYSTEM_PROMPT = `你是「知识笔记」的知识库整理助手。用户会提供一份文档或图片的内容（可能是提取的文本或表格）。
你的任务：第一步思考这份材料的核心主题，第二步把材料整理成一篇清晰、可长期检索的 Markdown 笔记。
输出格式要求（严格遵守）：
第一行输出一行 JSON：{"tags": ["标签1", "标签2", "标签3"]}（标签 2-5 个，中文，贴合内容主题）；
空一行后，输出笔记正文 Markdown（用 # 开头的一级标题 + 若干二级标题组织）：
- 开头 200 字以内「摘要」：这份材料讲什么、适合什么场景复用；
- 正文用要点/表格/代码块把原文关键信息整理好：结论、数据、步骤、注意事项都要保留，不要编造原文没有的内容；
- 语言与原文一致；不要输出 JSON 之外的解释。`;

export async function distillImport(
  ai: TKbAiSettings,
  source: ExtractedSource,
  sourceName: string
): Promise<DistillResult> {
  const baseName = path.basename(sourceName, path.extname(sourceName));

  if (source.kind === 'image') {
    const system = `${IMPORT_SYSTEM_PROMPT}\n用户提供的是图片「${source.promptName}」，请识别图中的文字/表格/图表后整理成笔记。图片若为流程图/架构图请用文字结构描述。`;
    const output = await chatCompletion(ai, {
      system,
      user: '请按输出格式要求整理这张图片的内容。',
      imageDataUrl: source.dataUrl,
      maxTokens: 4096,
    });
    const head = parseJsonHead(output);
    const markdown = head?.markdown || output.trim();
    return { title: baseName, tags: cleanTags(head?.tags), markdown };
  }

  const text = truncate(source.text);

  // Stage 1 — analyze (cheap): title candidates + tags + outline
  const analyze = await chatCompletion(ai, {
    system:
      '你是知识库整理助手。请阅读下面材料，只输出一行 JSON（不要输出其他任何文字）：{"title": "建议的笔记标题(≤30字)", "tags": ["标签1","标签2"], "outline": ["要点1标题", "要点2标题"]}',
    user: text,
    maxTokens: 800,
  });
  let title = baseName;
  let tags: string[] = [];
  let outline: string[] = [];
  try {
    const firstLine = analyze.split('\n').find((l) => l.trim().startsWith('{'));
    if (firstLine) {
      const parsed = JSON.parse(firstLine) as { title?: string; tags?: string[]; outline?: string[] };
      title = parsed.title?.trim() || baseName;
      tags = cleanTags(parsed.tags);
      outline = Array.isArray(parsed.outline) ? parsed.outline.map(String).slice(0, 6) : [];
    }
  } catch {
    // tolerate a non-JSON stage-1 answer — fall through with defaults
  }

  // Stage 2 — write the final note guided by the outline
  const outlineHint = outline.length > 0 ? `\n建议大纲：\n${outline.map((o, i) => `${i + 1}. ${o}`).join('\n')}` : '';
  const system = `${IMPORT_SYSTEM_PROMPT}\n材料来源文件名：${sourceName}${outlineHint}`;
  const output = await chatCompletion(ai, {
    system,
    user: `标题候选：${title}。请依据这份材料写出完整笔记。\n\n${text}`,
    maxTokens: 4096,
  });
  const head = parseJsonHead(output);
  const body = head?.markdown || output.trim();
  const finalTags = head?.tags ? cleanTags(head.tags) : tags;
  return { title, tags: finalTags, markdown: body };
}

const CHAT_SYSTEM_PROMPT = `你是「知识笔记」的知识库整理助手。用户提供一段 AI 对话记录。
请把这段对话提炼成一篇可以长期复用的经验笔记：问题是什么、用了什么方法、关键操作流程/步骤、结论或踩坑点、可复用的技巧。
输出格式要求（严格遵守）：
第一行输出一行 JSON：{"tags": ["标签1", "标签2"]}；
空一行后，输出笔记正文 Markdown：
- 用 # 一级标题（标题用对话主题，不要用「对话总结」这类泛称）；
- 用二级标题组织：## 背景/问题、## 解决方案、## 操作流程、## 结论与注意点（按对话内容增减）；
- 尽量保留关键命令、参数、文件路径、报错与解决方式等细节；不要编造对话中没有的内容。`;

export async function distillConversation(
  ai: TKbAiSettings,
  conversationTitle: string,
  transcript: string
): Promise<DistillResult> {
  const system = CHAT_SYSTEM_PROMPT;
  const output = await chatCompletion(ai, {
    system,
    user: `对话主题：${conversationTitle}\n\n对话记录：\n${truncate(transcript)}`,
    maxTokens: 4096,
  });
  const head = parseJsonHead(output);
  const body = head?.markdown || output.trim();
  const fallbackTitle = conversationTitle.trim().slice(0, 60) || '未命名对话';
  // Prefer a real # heading from the body for the note title.
  const heading = /^#\s+(.+)$/m.exec(body);
  return {
    title: heading ? heading[1].trim().slice(0, 60) : fallbackTitle,
    tags: cleanTags(head?.tags),
    markdown: body,
  };
}
