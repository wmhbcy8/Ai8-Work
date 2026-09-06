/**
 * @license
 * Copyright 2026 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Message, Tag } from '@arco-design/web-react';
import { Delete, Save } from '@icon-park/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ipcBridge } from '@/common';
import type { TKbNoteMeta } from '@/common/knowledge/types';

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

const MARKDOWN_CSS = `
.knowledge-markdown-preview { color: var(--color-text-1); }
.knowledge-markdown-preview h1 { font-size: 20px; font-weight: 600; margin: 0 0 12px; line-height: 1.5; }
.knowledge-markdown-preview h2 { font-size: 17px; font-weight: 600; margin: 18px 0 8px; line-height: 1.5; }
.knowledge-markdown-preview h3 { font-size: 15px; font-weight: 600; margin: 14px 0 6px; line-height: 1.5; }
.knowledge-markdown-preview p { margin: 8px 0; line-height: 1.75; }
.knowledge-markdown-preview ul, .knowledge-markdown-preview ol { padding-left: 22px; margin: 8px 0; line-height: 1.75; }
.knowledge-markdown-preview li { margin: 2px 0; }
.knowledge-markdown-preview blockquote { border-left: 3px solid var(--color-fill-3); padding-left: 12px; margin: 10px 0; color: var(--color-text-2); }
.knowledge-markdown-preview code { background: var(--color-fill-2); padding: 1px 6px; border-radius: 4px; font-size: 0.92em; font-family: var(--font-family-mono); }
.knowledge-markdown-preview pre { background: var(--color-fill-2); padding: 12px; border-radius: 8px; overflow-x: auto; margin: 10px 0; }
.knowledge-markdown-preview pre code { background: transparent; padding: 0; }
.knowledge-markdown-preview table { border-collapse: collapse; margin: 10px 0; width: max-content; max-width: 100%; }
.knowledge-markdown-preview th, .knowledge-markdown-preview td { border: 1px solid var(--color-fill-3); padding: 5px 10px; }
.knowledge-markdown-preview th { background: var(--color-fill-2); }
.knowledge-markdown-preview a { color: rgb(var(--primary-6)); }
.knowledge-markdown-preview hr { border: none; border-top: 1px solid var(--color-fill-3); margin: 14px 0; }
.knowledge-markdown-preview img { max-width: 100%; border-radius: 8px; }
`;

interface NoteEditorPaneProps {
  note: TKbNoteMeta;
  onSaved: (meta: TKbNoteMeta) => void;
  onDeleted: () => void;
}

const NoteEditorPane: React.FC<NoteEditorPaneProps> = ({ note, onSaved, onDeleted }) => {
  const { t } = useTranslation();
  const [draftTitle, setDraftTitle] = React.useState(note.title);
  const [draftTags, setDraftTags] = React.useState(note.tags.join(', '));
  const [draftBody, setDraftBody] = React.useState('');
  const [mode, setMode] = React.useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setDraftTitle(note.title);
    setDraftTags(note.tags.join(', '));
    setDraftBody('');
    setMode('edit');
    let cancelled = false;
    invoke(ipcBridge.knowledge.readNote.invoke({ relPath: note.relPath }))
      .then((record) => {
        if (!cancelled) {
          setDraftBody(record.content);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          Message.error(errorMessage(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [note.relPath, note.title, note.tags]);

  const handleSave = React.useCallback(async () => {
    const title = draftTitle.trim() || t('knowledge.untitled');
    const tags = draftTags
      .split(/[,，]/)
      .map((s) => s.trim().replace(/^#/, ''))
      .filter(Boolean)
      .slice(0, 8);
    setSaving(true);
    try {
      const meta = await invoke(
        ipcBridge.knowledge.writeNote.invoke({
          relPath: note.relPath,
          content: draftBody,
          title,
          tags,
        })
      );
      Message.success(t('knowledge.savedMessage'));
      onSaved(meta);
    } catch (err) {
      Message.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [draftBody, draftTags, draftTitle, note.relPath, onSaved, t]);

  const typeLabel =
    note.type === 'chat'
      ? t('knowledge.typeChat')
      : note.type === 'import'
        ? t('knowledge.typeImport')
        : t('knowledge.typeNote');
  const typeColor = note.type === 'chat' ? 'arcoblue' : note.type === 'import' ? 'green' : 'orange';

  return (
    <div className='h-full w-full flex flex-col bg-bg-1'>
      <style>{MARKDOWN_CSS}</style>
      {/* Header */}
      <div className='shrink-0 flex flex-col gap-8px px-16px py-10px border-b border-solid border-fill-2'>
        <div className='flex items-center gap-10px'>
          <Input
            value={draftTitle}
            className='text-16px font-[600]'
            onChange={setDraftTitle}
            placeholder={t('knowledge.untitled')}
          />
          <Tag color={typeColor} bordered={false}>
            {typeLabel}
          </Tag>
          <div className='flex items-center gap-4px shrink-0'>
            <Button size='small' type={mode === 'edit' ? 'primary' : 'outline'} onClick={() => setMode('edit')}>
              {t('knowledge.edit')}
            </Button>
            <Button size='small' type={mode === 'preview' ? 'primary' : 'outline'} onClick={() => setMode('preview')}>
              {t('knowledge.preview')}
            </Button>
            <Button
              size='small'
              type='text'
              loading={saving}
              icon={<Save theme='outline' size='15' fill='currentColor' />}
              onClick={() => void handleSave()}
            >
              {t('knowledge.save')}
            </Button>
            <Button
              size='small'
              type='text'
              status='danger'
              icon={<Delete theme='outline' size='15' fill='currentColor' />}
              onClick={onDeleted}
            />
          </div>
        </div>
        <Input
          size='small'
          value={draftTags}
          onChange={setDraftTags}
          placeholder={t('knowledge.tagsPlaceholder')}
          prefix='#'
        />
      </div>

      {/* Body */}
      <div className='flex-1 min-h-0 overflow-hidden'>
        {mode === 'edit' ? (
          <textarea
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            spellCheck={false}
            className='w-full h-full resize-none outline-none p-16px text-14px leading-24px text-t-primary bg-bg-1 font-mono'
          />
        ) : (
          <div className='h-full overflow-y-auto p-16px knowledge-markdown-preview'>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{draftBody || '*empty*'}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteEditorPane;
