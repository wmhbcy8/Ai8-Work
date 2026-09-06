/**
 * @license
 * Copyright 2026 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  TKbAiSettings,
  TKbImportFileResult,
  TKbNoteMeta,
  TKbOverview,
  TKbSaveChatInput,
  TKbSaveChatResult,
  TKbSearchHit,
} from '@/common/knowledge/types';
import {
  countNotes,
  deleteNoteFile,
  ensureVaultRoot,
  findChatNoteRelPath,
  listNotes,
  readNoteFile,
  searchNotes,
  uniqueMdRelPath,
  writeNoteFile,
  KB_IMPORTS_DIR,
  KB_NOTES_DIR,
} from './kbStore';
import { extractFile, distillConversation, distillImport, isSupportedImportFile } from './kbIngest';
import { isAiConfigured } from './kbLlm';

interface KbSettingsFile {
  root?: string;
  ai?: TKbAiSettings;
}

const MAX_TRANSCRIPT_CHARS = 200_000;

export class KnowledgeBaseService {
  private settingsFile: string;
  private settings: KbSettingsFile;

  constructor(settingsFilePath: string) {
    this.settingsFile = settingsFilePath;
    this.settings = {};
  }

  private async loadSettings(): Promise<KbSettingsFile> {
    try {
      const raw = await fs.readFile(this.settingsFile, 'utf8');
      this.settings = JSON.parse(raw) as KbSettingsFile;
    } catch {
      this.settings = {};
    }
    return this.settings;
  }

  private async persistSettings(): Promise<void> {
    await fs.mkdir(path.dirname(this.settingsFile), { recursive: true });
    await fs.writeFile(this.settingsFile, JSON.stringify(this.settings, null, 2), 'utf8');
  }

  async getRoot(): Promise<string | null> {
    await this.loadSettings();
    return this.settings.root ?? null;
  }

  async setRoot(root: string | null): Promise<void> {
    await this.loadSettings();
    if (root) {
      await ensureVaultRoot(root);
    }
    this.settings.root = root;
    await this.persistSettings();
  }

  private requireRoot(): Promise<string> {
    return this.loadSettings().then((s) => {
      if (!s.root) {
        throw new Error('尚未选择知识库目录，请先点击「选择目录」');
      }
      return s.root;
    });
  }

  async getAiSettings(): Promise<TKbAiSettings> {
    await this.loadSettings();
    return this.settings.ai ?? { baseUrl: '', apiKey: '', model: '' };
  }

  async saveAiSettings(ai: TKbAiSettings): Promise<void> {
    await this.loadSettings();
    this.settings.ai = {
      baseUrl: (ai.baseUrl ?? '').trim(),
      apiKey: ai.apiKey ?? '',
      model: (ai.model ?? '').trim(),
    };
    await this.persistSettings();
  }

  async getOverview(): Promise<TKbOverview> {
    const root = await this.getRoot();
    const ai = await this.getAiSettings();
    return {
      root,
      aiConfigured: isAiConfigured(ai),
      count: root ? await countNotes(root) : 0,
    };
  }

  async listNotes(): Promise<TKbNoteMeta[]> {
    const root = await this.requireRoot();
    return listNotes(root);
  }

  async readNote(relPath: string): Promise<{ content: string; meta: TKbNoteMeta }> {
    const root = await this.requireRoot();
    const record = await readNoteFile(root, relPath);
    return { content: record.body, meta: record.meta };
  }

  async writeNote(input: {
    relPath?: string;
    content: string;
    title?: string;
    tags?: string[];
    type?: 'note' | 'chat' | 'import';
    source?: string;
    model?: string;
  }): Promise<TKbNoteMeta> {
    const root = await this.requireRoot();
    const relPath = input.relPath || (await uniqueMdRelPath(root, KB_NOTES_DIR, input.title || 'note'));
    return writeNoteFile(root, relPath, {
      body: input.content,
      title: input.title,
      type: input.type,
      tags: input.tags,
      source: input.source,
      model: input.model,
      keepDate: true,
    });
  }

  async deleteNote(relPath: string): Promise<void> {
    const root = await this.requireRoot();
    await deleteNoteFile(root, relPath);
  }

  async search(keyword: string, typeFilter?: string): Promise<TKbSearchHit[]> {
    const root = await this.requireRoot();
    return searchNotes(root, keyword, typeFilter);
  }

  async createManualNote(title: string, tags: string[]): Promise<TKbNoteMeta> {
    const root = await this.requireRoot();
    const relPath = await uniqueMdRelPath(root, KB_NOTES_DIR, title);
    return writeNoteFile(root, relPath, {
      body: `# ${title}\n\n`,
      title,
      type: 'note',
      tags,
      keepDate: false,
    });
  }

  async saveChat(input: TKbSaveChatInput): Promise<TKbSaveChatResult> {
    const root = await this.requireRoot();
    const ai = await this.getAiSettings();
    if (!isAiConfigured(ai)) {
      throw new Error('请先在知识笔记的「AI 设置」中配置模型服务，再执行「存入知识笔记」');
    }
    const transcript = (input.transcript ?? '').slice(0, MAX_TRANSCRIPT_CHARS);
    if (!transcript.trim()) {
      throw new Error('当前会话没有可保存的消息内容');
    }
    const result = await distillConversation(ai, input.title || '未命名对话', transcript);

    const existingRelPath = input.conversationId ? await findChatNoteRelPath(root, input.conversationId) : null;
    const relPath = existingRelPath ?? (await uniqueMdRelPath(root, KB_NOTES_DIR, result.title));
    await writeNoteFile(root, relPath, {
      body: result.markdown.replace(/^#\s+.*\n?/, ''),
      title: result.title,
      type: 'chat',
      tags: [...(input.tags ?? []), ...result.tags],
      source: input.conversationId || undefined,
      keepDate: true,
      model: ai.model,
    });
    return { relPath, title: result.title, updated: Boolean(existingRelPath) };
  }

  async importFiles(filePaths: string[]): Promise<TKbImportFileResult[]> {
    const root = await this.requireRoot();
    const ai = await this.getAiSettings();
    if (!isAiConfigured(ai)) {
      throw new Error('请先在知识笔记的「AI 设置」中配置模型服务，再导入文件');
    }
    const results: TKbImportFileResult[] = [];
    for (const filePath of filePaths) {
      try {
        const baseName = path.basename(filePath, path.extname(filePath));
        const supported = isSupportedImportFile(filePath);
        if (!supported) {
          results.push({ filePath, error: '不支持的文件格式（支持 docx/xlsx/pdf/txt/md/csv/图片）' });
          continue;
        }
        const source = await extractFile(filePath);
        const distilled = await distillImport(ai, source, path.basename(filePath));
        const relPath = await uniqueMdRelPath(root, KB_IMPORTS_DIR, distilled.title || baseName);
        await writeNoteFile(root, relPath, {
          body: distilled.markdown.replace(/^#\s+.*\n?/, ''),
          title: distilled.title || baseName,
          type: 'import',
          tags: distilled.tags,
          keepDate: false,
          model: ai.model,
        });
        results.push({ filePath, relPath, title: distilled.title || baseName });
      } catch (err) {
        results.push({ filePath, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return results;
  }
}
