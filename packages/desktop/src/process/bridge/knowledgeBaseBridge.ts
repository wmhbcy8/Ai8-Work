/**
 * @license
 * Copyright 2026 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import { app, dialog, shell, type OpenDialogOptions } from 'electron';
import { ipcBridge } from '@/common';
import type {
  TKbAiSettings,
  TKbImportFileResult,
  TKbNoteMeta,
  TKbOverview,
  TKbResult,
  TKbSaveChatInput,
  TKbSaveChatResult,
  TKbSearchHit,
  TKbWriteNoteInput,
} from '@/common/knowledge/types';
import { KnowledgeBaseService } from '../services/knowledgeBase/KnowledgeBaseService';

/**
 * Electron main-process bridge for the 知识笔记 vault.
 *
 * NOTE: the IPC bridge transport cannot propagate exceptions to the renderer —
 * a provider that throws would leave the renderer's promise pending forever.
 * Every handler therefore wraps its work in `toResult` and resolves the
 * TKbResult envelope instead.
 */

function toResult<T>(fn: () => Promise<T>): Promise<TKbResult<T>> {
  return Promise.resolve()
    .then(fn)
    .then((data) => ({ ok: true as const, data }))
    .catch((err) => ({ ok: false as const, error: err instanceof Error ? err.message : String(err) }));
}

function createService(): KnowledgeBaseService {
  const settingsFile = path.join(app.getPath('userData'), 'knowledge-base.json');
  return new KnowledgeBaseService(settingsFile);
}

export function initKnowledgeBaseBridge(): void {
  const service = createService();

  ipcBridge.knowledge.getOverview.provider(() => toResult<TKbOverview>(() => service.getOverview()));

  ipcBridge.knowledge.selectRoot.provider(() =>
    toResult<string | null>(async () => {
      const options: OpenDialogOptions = {
        title: '选择「知识笔记」存放目录',
        buttonLabel: '选择此目录',
        properties: ['openDirectory', 'createDirectory'],
      };
      const result = await dialog.showOpenDialog(options);
      const dir = result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
      if (dir) {
        await service.setRoot(dir);
      }
      return dir;
    })
  );

  ipcBridge.knowledge.listNotes.provider(() => toResult<TKbNoteMeta[]>(() => service.listNotes()));

  ipcBridge.knowledge.readNote.provider(({ relPath }) =>
    toResult<{ content: string; meta: TKbNoteMeta }>(() => service.readNote(relPath))
  );

  ipcBridge.knowledge.writeNote.provider((input: TKbWriteNoteInput) =>
    toResult<TKbNoteMeta>(() =>
      service.writeNote({
        relPath: input.relPath,
        content: input.content,
        title: input.title,
        tags: input.tags,
        type: input.relPath.startsWith('imports/') ? 'import' : 'note',
      })
    )
  );

  ipcBridge.knowledge.deleteNote.provider(({ relPath }) => toResult<void>(() => service.deleteNote(relPath)));

  ipcBridge.knowledge.search.provider(({ keyword, type }) =>
    toResult<TKbSearchHit[]>(() => service.search(keyword, type))
  );

  ipcBridge.knowledge.getAiSettings.provider(() => toResult<TKbAiSettings>(() => service.getAiSettings()));

  ipcBridge.knowledge.saveAiSettings.provider((ai: TKbAiSettings) => toResult<void>(() => service.saveAiSettings(ai)));

  ipcBridge.knowledge.saveChat.provider((input: TKbSaveChatInput) =>
    toResult<TKbSaveChatResult>(() => service.saveChat(input))
  );

  ipcBridge.knowledge.importFiles.provider(({ filePaths }) =>
    toResult<TKbImportFileResult[]>(() => service.importFiles(filePaths))
  );

  ipcBridge.knowledge.chooseImportFiles.provider(() =>
    toResult<string[]>(async () => {
      const options: OpenDialogOptions = {
        title: '选择要导入知识笔记的文件',
        buttonLabel: '导入',
        properties: ['openFile', 'multiSelections'],
        filters: [
          {
            name: '文档与图片',
            extensions: ['docx', 'xlsx', 'xls', 'pdf', 'txt', 'md', 'csv', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'],
          },
          { name: '全部文件', extensions: ['*'] },
        ],
      };
      const result = await dialog.showOpenDialog(options);
      return result.canceled ? [] : result.filePaths;
    })
  );

  ipcBridge.knowledge.openFolder.provider(({ dir }) =>
    toResult<void>(async () => {
      if (!dir) {
        throw new Error('目录为空');
      }
      const error = await shell.openPath(dir);
      if (error) {
        throw new Error(error);
      }
    })
  );
}
