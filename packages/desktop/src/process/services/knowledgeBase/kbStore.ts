/**
 * @license
 * Copyright 2026 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type { TKbNoteMeta, TKbNoteType, TKbSearchHit } from '@/common/knowledge/types';

/**
 * File-system layer of the 知识笔记 vault.
 *
 * The vault is a plain folder of Markdown files (Obsidian-style). Layout:
 *
 *   <root>/
 *     notes/    — chat distillations and manually created notes
 *     imports/  — distillations produced from imported documents
 *     uploads/  — original files kept for later reference (reserved)
 *     .kb/      — internal cache (reserved)
 */

export const KB_NOTES_DIR = 'notes';
export const KB_IMPORTS_DIR = 'imports';
export const KB_UPLOADS_DIR = 'uploads';
const KB_HIDDEN_DIRS = new Set(['.kb', KB_UPLOADS_DIR]);

export interface KbNoteRecord {
  meta: TKbNoteMeta;
  body: string;
  mtimeMs: number;
}

const FRONTMATTER_KEY_RE = /^([A-Za-z0-9_-]+):\s*(.*)$/;
const FRONTMATTER_TAGS_KEY = 'tags';

function dateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function toDatePrefix(d = new Date()): string {
  return dateKey(d);
}

/** Strip characters that are illegal in file names on Windows. */
export function toSafeFileName(title: string): string {
  const illegal = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*']);
  let cleaned = '';
  for (const ch of title) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 32 || illegal.has(ch)) continue;
    cleaned += ch;
  }
  cleaned = cleaned.replace(/\s+/g, ' ').trim().slice(0, 80);
  return (cleaned || '未命名').replace(/\.+$/, '');
}

/** Guard against path traversal: relPath must stay inside the vault root and be a .md file. */
export function isSafeRelPath(root: string, relPath: string): boolean {
  if (!relPath || path.isAbsolute(relPath) || !relPath.endsWith('.md')) {
    return false;
  }
  const abs = path.resolve(root, relPath);
  const rel = path.relative(root, abs);
  if (rel === '' || rel.startsWith('..')) {
    return false;
  }
  for (const seg of rel.split(path.sep)) {
    if (seg === '.kb') return false;
  }
  return true;
}

export async function ensureVaultRoot(root: string): Promise<void> {
  await Promise.all(
    [KB_NOTES_DIR, KB_IMPORTS_DIR, KB_UPLOADS_DIR, '.kb'].map((d) => fs.mkdir(path.join(root, d), { recursive: true }))
  );
}

/** Return a `dir/<date>-<slug>[-(n)].md` path that does not exist yet. */
export async function uniqueMdRelPath(root: string, dir: string, desiredBase: string): Promise<string> {
  const base = `${toDatePrefix()}-${toSafeFileName(desiredBase) || 'note'}`;
  let candidate = `${dir}/${base}.md`;
  for (let i = 2; ; i += 1) {
    try {
      await fs.access(path.join(root, candidate));
    } catch {
      return candidate;
    }
    candidate = `${dir}/${base}-${i}.md`;
  }
}

function parseScalar(raw: string): string {
  let value = raw.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value.replace(/\\"/g, '"');
}

function parseTags(raw: string): string[] {
  const value = raw.trim();
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((s) => parseScalar(s))
      .filter(Boolean);
  }
  if (!value) return [];
  return [parseScalar(value)];
}

export function parseFrontmatter(raw: string): { meta: Record<string, string | string[]>; body: string } {
  const meta: Record<string, string | string[]> = {};
  let body = raw;
  if (raw.startsWith('---\n')) {
    const end = raw.indexOf('\n---', 4);
    if (end !== -1) {
      const head = raw.slice(4, end);
      body = raw.slice(end + 5);
      for (const line of head.split('\n')) {
        const m = FRONTMATTER_KEY_RE.exec(line);
        if (m) {
          meta[m[1]] = m[1] === FRONTMATTER_TAGS_KEY ? parseTags(m[2]) : parseScalar(m[2]);
        }
      }
    }
  }
  return { meta, body };
}

function yamlScalar(value: string): string {
  const special = new Set([':', '#', '[', ']', '{', '}', ',', '&', '*', '!', '|', '>', "'", '"', '%', '@', '`']);
  const needsQuote =
    value.startsWith(' ') || value.startsWith('-') || value.startsWith('?') || [...value].some((ch) => special.has(ch));
  if (needsQuote) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
}

function buildFrontmatter(meta: TKbNoteMeta): string {
  const lines = [
    '---',
    `title: ${yamlScalar(meta.title)}`,
    `type: ${meta.type}`,
    `tags: [${meta.tags.map((t) => yamlScalar(t)).join(', ')}]`,
    `date: ${yamlScalar(meta.date)}`,
  ];
  if (meta.source) lines.push(`source: ${yamlScalar(meta.source)}`);
  if (meta.model) lines.push(`model: ${yamlScalar(meta.model)}`);
  lines.push('---');
  return lines.join('\n');
}

function metaFromRecord(raw: string, relPath: string, mtimeMs: number): TKbNoteMeta {
  const { meta, body } = parseFrontmatter(raw);
  const rawTitle = typeof meta.title === 'string' ? meta.title : '';
  const dir = relPath.split('/')[0];
  const type: TKbNoteType =
    typeof meta.type === 'string' && (meta.type === 'note' || meta.type === 'chat' || meta.type === 'import')
      ? meta.type
      : dir === KB_IMPORTS_DIR
        ? 'import'
        : 'note';
  const tags = Array.isArray(meta.tags) ? meta.tags.map(String) : [];
  const date = typeof meta.date === 'string' && meta.date ? meta.date : new Date(mtimeMs).toISOString();
  const title = rawTitle || path.basename(relPath, '.md');
  return {
    relPath,
    title,
    type,
    tags,
    date,
    source: typeof meta.source === 'string' ? meta.source : undefined,
    model: typeof meta.model === 'string' ? meta.model : undefined,
  };
}

async function walkMarkdownFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  const scan = async (dir: string): Promise<void> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!KB_HIDDEN_DIRS.has(entry.name)) await scan(path.join(dir, entry.name));
      } else if (entry.name.endsWith('.md')) {
        out.push(path.relative(root, path.join(dir, entry.name)).split(path.sep).join('/'));
      }
    }
  };
  for (const d of [KB_NOTES_DIR, KB_IMPORTS_DIR]) {
    try {
      await scan(path.join(root, d));
    } catch {
      // directory may not exist yet
    }
  }
  return out;
}

export async function countNotes(root: string): Promise<number> {
  const files = await walkMarkdownFiles(root);
  return files.length;
}

export async function listNotes(root: string): Promise<TKbNoteMeta[]> {
  const files = await walkMarkdownFiles(root);
  const records: Array<{ meta: TKbNoteMeta; mtimeMs: number }> = [];
  for (const relPath of files) {
    try {
      const stat = await fs.stat(path.join(root, relPath));
      const raw = await fs.readFile(path.join(root, relPath), 'utf8');
      records.push({ meta: metaFromRecord(raw, relPath, stat.mtimeMs), mtimeMs: stat.mtimeMs });
    } catch {
      // unreadable file — skip it
    }
  }
  records.sort((a, b) => b.mtimeMs - a.mtimeMs || a.meta.relPath.localeCompare(b.meta.relPath));
  return records.map((r) => r.meta);
}

export async function readNoteFile(root: string, relPath: string): Promise<KbNoteRecord> {
  if (!isSafeRelPath(root, relPath)) {
    throw new Error('非法文件路径');
  }
  const abs = path.join(root, relPath);
  const stat = await fs.stat(abs);
  const raw = await fs.readFile(abs, 'utf8');
  const { body } = parseFrontmatter(raw);
  return { meta: metaFromRecord(raw, relPath, stat.mtimeMs), body, mtimeMs: stat.mtimeMs };
}

export interface WriteNoteOptions {
  body: string;
  title?: string;
  type?: TKbNoteType;
  tags?: string[];
  source?: string;
  model?: string;
  /** When set, `date` is kept for updates and only used on creation. */
  keepDate?: boolean;
}

export async function writeNoteFile(root: string, relPath: string, opts: WriteNoteOptions): Promise<TKbNoteMeta> {
  if (!isSafeRelPath(root, relPath)) {
    throw new Error('非法文件路径');
  }
  const abs = path.join(root, relPath);
  let existing: TKbNoteMeta | undefined;
  try {
    const stat = await fs.stat(abs);
    const raw = await fs.readFile(abs, 'utf8');
    existing = metaFromRecord(raw, relPath, stat.mtimeMs);
  } catch {
    // new file
  }
  const meta: TKbNoteMeta = {
    relPath,
    title: opts.title ?? existing?.title ?? path.basename(relPath, '.md'),
    type: opts.type ?? existing?.type ?? 'note',
    tags: opts.tags ?? existing?.tags ?? [],
    date: opts.keepDate && existing ? existing.date : new Date().toISOString(),
    source: opts.source ?? existing?.source,
    model: opts.model ?? existing?.model,
  };
  await fs.mkdir(path.dirname(abs), { recursive: true });
  const content = `${buildFrontmatter(meta)}\n\n${opts.body.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')}`;
  await fs.writeFile(abs, content, 'utf8');
  return meta;
}

export async function deleteNoteFile(root: string, relPath: string): Promise<void> {
  if (!isSafeRelPath(root, relPath)) {
    throw new Error('非法文件路径');
  }
  const abs = path.join(root, relPath);
  try {
    await fs.access(abs);
  } catch {
    throw new Error('笔记不存在');
  }
  await fs.unlink(abs);
}

/** Find the vault-relative path of the chat note bound to a conversation id (upsert target). */
export async function findChatNoteRelPath(root: string, conversationId: string): Promise<string | null> {
  if (!conversationId) return null;
  const metas = await listNotes(root);
  const hit = metas.find((m) => m.type === 'chat' && m.source === conversationId);
  return hit?.relPath ?? null;
}

function sanitizeText(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

function buildSnippet(body: string, token: string): string {
  const haystack = body.replace(/\s+/g, ' ');
  const idx = token ? haystack.toLowerCase().indexOf(token.toLowerCase()) : -1;
  const start = Math.max(0, (idx > -1 ? idx : 0) - 40);
  const sliced = haystack.slice(start, start + 200);
  return sliced.length < haystack.length ? `${sliced}…` : sliced;
}

export async function searchNotes(root: string, keyword: string, typeFilter?: string): Promise<TKbSearchHit[]> {
  const keywordClean = keyword.trim();
  const tokens = keywordClean ? keywordClean.split(/\s+/).filter(Boolean) : [];
  const allTokens = new Set(tokens);
  for (const t of tokens) {
    if (t.length > 2) {
      // CJK bigram style: searching for the whole phrase is more precise than bigrams.
      allTokens.add(t);
    }
  }
  const files = await walkMarkdownFiles(root);
  const hits: TKbSearchHit[] = [];
  for (const relPath of files) {
    try {
      const stat = await fs.stat(path.join(root, relPath));
      const raw = await fs.readFile(path.join(root, relPath), 'utf8');
      const meta = metaFromRecord(raw, relPath, stat.mtimeMs);
      if (typeFilter && meta.type !== typeFilter) continue;
      const { body } = parseFrontmatter(raw);
      const bodyClean = sanitizeText(body);
      const titleLower = meta.title.toLowerCase();
      const bodyLower = bodyClean.toLowerCase();
      let score = 0;
      let firstBodyToken: string | null = null;
      for (const token of allTokens) {
        const lower = token.toLowerCase();
        if (titleLower.includes(lower)) score += 20;
        if (meta.tags.some((tag) => tag.toLowerCase().includes(lower))) score += 15;
        if (relPath.toLowerCase().includes(lower)) score += 8;
        const occurrences = bodyLower.split(lower).length - 1;
        if (occurrences > 0) {
          score += Math.min(occurrences, 6) * 2;
          firstBodyToken ??= token;
        }
      }
      if (score <= 0) continue;
      hits.push({
        relPath,
        title: meta.title,
        snippet: buildSnippet(body, firstBodyToken ?? tokens[0] ?? ''),
        score,
      });
    } catch {
      // skip unreadable files
    }
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, 50);
}
