/**
 * @license
 * Copyright 2026 Ai8 Work
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared types for the 知识笔记 (personal knowledge base) feature.
 *
 * The vault lives on the user's disk as plain Markdown files (Obsidian-style).
 * All file/LLM work happens in the Electron main process; the renderer talks
 * to it through the `knowledge.*` IPC bridge namespace. On the WebUI build the
 * feature is unavailable — every bridge call resolves to `{ ok: false, ... }`.
 */

export type TKbNoteType = 'note' | 'chat' | 'import';

/** Metadata parsed from a knowledge note's YAML frontmatter. */
export interface TKbNoteMeta {
  /** File path relative to the knowledge base root, e.g. `notes/示例.md`. */
  relPath: string;
  /** Note title (frontmatter `title`, falls back to the file name). */
  title: string;
  type: TKbNoteType;
  tags: string[];
  /** ISO timestamp from frontmatter `date` (falls back to file mtime). */
  date: string;
  /** When type === 'chat': the originating conversation id. */
  source?: string;
  /** Model that produced the note, when AI-generated. */
  model?: string;
}

export interface TKbOverview {
  /** Absolute path of the vault root, or null when no directory was chosen yet. */
  root: string | null;
  /** Whether the AI settings currently bind a model (Settings 中已配置的模型). */
  aiConfigured: boolean;
  /** Total number of notes in the vault. */
  count: number;
}

/**
 * 知识笔记的 AI 模型绑定（不保存任何密钥/地址）。
 *
 * 复用「设置 → 模型」中已添加的模型服务：
 * - providerId/model 都为空 = 跟随默认（自动使用软件已配置的第一个可用模型）。
 * - 只填 providerId = 使用该服务下第一个可用模型。
 * - 两者都填 = 固定使用该模型。
 */
export interface TKbAiSettings {
  /** 绑定的 Provider id（设置页已添加的模型服务）。留空 = 跟随默认。 */
  providerId?: string;
  /** 绑定的模型名。留空 = 该 Provider 下第一个可用模型。 */
  model?: string;
}

export interface TKbSearchHit {
  relPath: string;
  title: string;
  snippet: string;
  score: number;
}

export interface TKbImportFileResult {
  filePath: string;
  relPath?: string;
  title?: string;
  error?: string;
}

export interface TKbSaveChatInput {
  /** Conversation title; used as the note title. */
  title: string;
  /** Conversation id — repeated saves update the same note (upsert). */
  conversationId: string;
  tags?: string[];
  /** Plain-text transcript to distill. */
  transcript: string;
}

export interface TKbWriteNoteInput {
  /** Target file path relative to the vault root. Omit (or pass '') to auto-create under notes/. */
  relPath?: string;
  /** Markdown body (without frontmatter — the main process owns frontmatter). */
  content: string;
  title?: string;
  tags?: string[];
}

export interface TKbSaveChatResult {
  relPath: string;
  title: string;
  /** Whether an existing note was updated instead of created. */
  updated: boolean;
}

/**
 * Discriminated envelope used by every knowledge bridge call.
 *
 * The IPC bridge transport cannot propagate provider exceptions back to the
 * renderer (an uncaught throw would leave the caller's promise pending), so
 * every provider resolves with this envelope instead.
 */
export type TKbResult<T> = { ok: true; data: T } | { ok: false; error: string };
