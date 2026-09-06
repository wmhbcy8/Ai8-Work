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
  /** Whether AI settings (OpenAI-compatible endpoint) are configured. */
  aiConfigured: boolean;
  /** Total number of notes in the vault. */
  count: number;
}

export interface TKbAiSettings {
  /** OpenAI-compatible base URL, e.g. https://api.openai.com/v1 or http://127.0.0.1:11434/v1 */
  baseUrl: string;
  apiKey: string;
  model: string;
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
