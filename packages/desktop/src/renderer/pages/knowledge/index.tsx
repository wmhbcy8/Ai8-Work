/**
 * @license
 * Copyright 2026 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Message, Modal, Space } from '@arco-design/web-react';
import { FolderOpen, Notebook, SettingConfig } from '@icon-park/react';
import { ipcBridge } from '@/common';
import type { TKbNoteMeta, TKbOverview } from '@/common/knowledge/types';
import AiSettingsModal from './components/AiSettingsModal';
import NoteEditorPane from './components/NoteEditorPane';
import NoteListPanel from './components/NoteListPanel';

const { confirm } = Modal;

/** Unwrap the TKbResult envelope shared by every knowledge bridge call. */
async function invoke<T>(promise: Promise<{ ok: boolean; data?: T; error?: string }>): Promise<T> {
  const result = await promise;
  if (!result.ok || result.data === undefined) {
    throw new Error(result.error ?? '未知错误');
  }
  return result.data;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const KnowledgeBasePage: React.FC = () => {
  const { t } = useTranslation();

  const [overview, setOverview] = React.useState<TKbOverview | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState<TKbNoteMeta[]>([]);
  const [keyword, setKeyword] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<'all' | TKbNoteMeta['type']>('all');
  const [searchHits, setSearchHits] = React.useState<Set<string> | null>(null);
  const [selected, setSelected] = React.useState<TKbNoteMeta | null>(null);
  const [aiSettingsOpen, setAiSettingsOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const loadAll = React.useCallback(async () => {
    const ov = await invoke(ipcBridge.knowledge.getOverview.invoke());
    setOverview(ov);
    setLoadError(null);
    if (ov.root) {
      setNotes(await invoke(ipcBridge.knowledge.listNotes.invoke()));
    }
  }, []);

  React.useEffect(() => {
    loadAll().catch((err) => setLoadError(errorMessage(err)));
  }, [loadAll]);

  const refresh = React.useCallback(async () => {
    const list = await invoke(ipcBridge.knowledge.listNotes.invoke());
    setNotes(list);
  }, []);

  const handleChooseFolder = React.useCallback(async () => {
    try {
      const dir = await invoke(ipcBridge.knowledge.selectRoot.invoke());
      if (dir) {
        await loadAll();
        Message.success(t('knowledge.folderSelected'));
      }
    } catch (err) {
      Message.error(errorMessage(err));
    }
  }, [loadAll, t]);

  const handleOpenFolder = React.useCallback(async () => {
    if (!overview?.root) return;
    try {
      await invoke(ipcBridge.knowledge.openFolder.invoke({ dir: overview.root }));
    } catch (err) {
      Message.error(errorMessage(err));
    }
  }, [overview]);

  // Debounced full-text search across titles / tags / bodies.
  React.useEffect(() => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      setSearchHits(null);
      return;
    }
    const timer = window.setTimeout(() => {
      invoke(ipcBridge.knowledge.search.invoke({ keyword: trimmed }))
        .then((hits) => setSearchHits(new Set(hits.map((h) => h.relPath))))
        .catch((err: unknown) => {
          Message.error(errorMessage(err));
          setSearchHits(new Set());
        });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  const visibleNotes: TKbNoteMeta[] = notes.filter((note) => {
    const typeOk = typeFilter === 'all' || note.type === typeFilter;
    if (!typeOk) return false;
    const trimmed = keyword.trim();
    if (!trimmed) return true;
    const text = `${note.title} ${note.tags.join(' ')} ${note.relPath}`.toLowerCase();
    if (text.includes(trimmed.toLowerCase())) return true;
    return searchHits?.has(note.relPath) ?? false;
  });

  const handleCreateNote = React.useCallback(async () => {
    const title = window.prompt(t('knowledge.titlePlaceholder'), '');
    if (!title || !title.trim()) return;
    const tagsRaw = window.prompt(t('knowledge.tagsPlaceholder'), '');
    const tags = (tagsRaw ?? '')
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8);
    try {
      const meta = await invoke(
        ipcBridge.knowledge.writeNote.invoke({
          content: `# ${title.trim()}\n\n`,
          title: title.trim(),
          tags,
        })
      );
      await loadAll();
      setSelected(meta);
    } catch (err) {
      Message.error(errorMessage(err));
    }
  }, [loadAll, t]);

  const handleImportFiles = React.useCallback(async () => {
    setBusy(true);
    try {
      const filePaths = await invoke(ipcBridge.knowledge.chooseImportFiles.invoke());
      if (!filePaths || filePaths.length === 0) return;
      const loading = Message.loading({ content: t('knowledge.importProcessing'), duration: 0 });
      try {
        const results = await invoke(ipcBridge.knowledge.importFiles.invoke({ filePaths }));
        const errors = results.filter((r) => r.error);
        const okCount = results.length - errors.length;
        if (errors.length > 0) {
          Modal.warning({
            title: t('knowledge.importFinishedTitle'),
            content: (
              <div className='text-13px break-all max-h-320px overflow-y-auto'>
                {okCount > 0 && <p>✓ {okCount}</p>}
                {errors.map((r) => (
                  <p key={r.filePath} className='mb-4px'>
                    {r.filePath}
                    <span className='text-red-500'> — {r.error}</span>
                  </p>
                ))}
              </div>
            ),
          });
        } else {
          Message.success(`${t('knowledge.importFinishedTitle')} (${okCount})`);
        }
        await loadAll();
      } finally {
        loading();
      }
    } catch (err) {
      Message.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [loadAll, t]);

  const handleDeleteNote = React.useCallback(
    (note: TKbNoteMeta) => {
      confirm({
        title: t('knowledge.confirmDeleteTitle'),
        content: t('knowledge.deleteConfirm'),
        okButtonProps: { status: 'danger' },
        onOk: async () => {
          try {
            await invoke(ipcBridge.knowledge.deleteNote.invoke({ relPath: note.relPath }));
            if (selected?.relPath === note.relPath) {
              setSelected(null);
            }
            await refresh();
            Message.success(t('knowledge.noteDeletedMessage'));
          } catch (err) {
            Message.error(errorMessage(err));
          }
        },
      });
    },
    [refresh, selected, t]
  );

  if (loadError) {
    return (
      <div className='h-full w-full flex flex-col items-center justify-center gap-16px text-t-secondary'>
        <div className='text-28px'>📖</div>
        <div className='text-14px'>{loadError}</div>
        <Button onClick={() => loadAll().catch((err) => setLoadError(errorMessage(err)))}>Retry</Button>
      </div>
    );
  }

  if (!overview || !overview.root) {
    return (
      <div className='h-full w-full flex flex-col items-center justify-center gap-24px px-24px text-center'>
        <div className='size-64px flex items-center justify-center rd-16px bg-fill-3 text-t-primary'>
          <Notebook theme='outline' size='32' fill='currentColor' />
        </div>
        <div>
          <div className='text-18px font-[600] text-t-primary mb-8px'>{t('knowledge.noRootTitle')}</div>
          <div className='text-13px text-t-secondary max-w-460px leading-22px'>{t('knowledge.noRootDesc')}</div>
        </div>
        <Space>
          <Button type='primary' icon={<FolderOpen />} onClick={() => void handleChooseFolder()}>
            {t('knowledge.chooseFolder')}
          </Button>
          <Button icon={<SettingConfig />} onClick={() => setAiSettingsOpen(true)}>
            {t('knowledge.aiSettings')}
          </Button>
        </Space>
      </div>
    );
  }

  return (
    <div className='h-full w-full flex overflow-hidden bg-bg-1'>
      <NoteListPanel
        notes={visibleNotes}
        keyword={keyword}
        typeFilter={typeFilter}
        selectedRelPath={selected?.relPath ?? null}
        onKeywordChange={setKeyword}
        onFilterChange={(type) => setTypeFilter(type)}
        onSelect={setSelected}
        onChooseFolder={() => void handleChooseFolder()}
        onOpenFolder={() => void handleOpenFolder()}
        onNewNote={() => void handleCreateNote()}
        onImport={() => void handleImportFiles()}
        onAiSettings={() => setAiSettingsOpen(true)}
        busy={busy}
      />
      <div className='flex-1 min-w-0 h-full flex flex-col'>
        {selected ? (
          <NoteEditorPane
            key={selected.relPath}
            note={selected}
            onSaved={(meta) => {
              setSelected(meta);
              void refresh();
            }}
            onDeleted={() => void handleDeleteNote(selected)}
          />
        ) : (
          <div className='h-full w-full flex flex-col items-center justify-center gap-12px text-t-tertiary select-none'>
            <div className='text-24px'>📝</div>
            <div className='text-13px'>{keyword.trim() ? t('knowledge.noNotesMatch') : t('knowledge.emptyNotes')}</div>
            {!keyword.trim() && (
              <Button
                type='outline'
                icon={<Notebook theme='outline' size='16' fill='currentColor' />}
                onClick={() => void handleCreateNote()}
              >
                {t('knowledge.newNote')}
              </Button>
            )}
          </div>
        )}
      </div>
      <AiSettingsModal
        visible={aiSettingsOpen}
        onClose={() => setAiSettingsOpen(false)}
        onSaved={() => void loadAll().catch((err) => setLoadError(errorMessage(err)))}
      />
    </div>
  );
};

export default KnowledgeBasePage;
