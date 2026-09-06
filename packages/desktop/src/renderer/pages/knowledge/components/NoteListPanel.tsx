/**
 * @license
 * Copyright 2026 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Tag, Tooltip } from '@arco-design/web-react';
import { Add, FolderOne, UploadOne, FolderOpen, SettingConfig } from '@icon-park/react';
import type { TKbNoteMeta } from '@/common/knowledge/types';

interface NoteListPanelProps {
  notes: TKbNoteMeta[];
  keyword: string;
  typeFilter: 'all' | TKbNoteMeta['type'];
  selectedRelPath: string | null;
  busy: boolean;
  onKeywordChange: (keyword: string) => void;
  onFilterChange: (type: 'all' | TKbNoteMeta['type']) => void;
  onSelect: (note: TKbNoteMeta) => void;
  onChooseFolder: () => void;
  onOpenFolder: () => void;
  onNewNote: () => void;
  onImport: () => void;
  onAiSettings: () => void;
}

const TYPE_TAG_COLOR: Record<TKbNoteMeta['type'], 'arcoblue' | 'green' | 'orange'> = {
  chat: 'arcoblue',
  import: 'green',
  note: 'orange',
};

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const NoteListPanel: React.FC<NoteListPanelProps> = ({
  notes,
  keyword,
  typeFilter,
  selectedRelPath,
  busy,
  onKeywordChange,
  onFilterChange,
  onSelect,
  onChooseFolder,
  onOpenFolder,
  onNewNote,
  onImport,
  onAiSettings,
}) => {
  const { t } = useTranslation();

  const filters: Array<{ key: 'all' | TKbNoteMeta['type']; label: string }> = [
    { key: 'all', label: t('knowledge.tagAll') },
    { key: 'note', label: t('knowledge.tagNote') },
    { key: 'chat', label: t('knowledge.tagChat') },
    { key: 'import', label: t('knowledge.tagImport') },
  ];

  return (
    <div className='h-full w-300px shrink-0 flex flex-col bg-bg-1 border-r border-solid border-fill-2'>
      {/* Toolbar */}
      <div className='flex items-center justify-between gap-8px px-12px py-10px shrink-0'>
        <div className='flex items-center gap-4px'>
          <Tooltip content={t('knowledge.newNote')}>
            <Button
              size='small'
              shape='circle'
              type='text'
              icon={<Add theme='outline' size='16' fill='currentColor' />}
              onClick={onNewNote}
            />
          </Tooltip>
          <Tooltip content={t('knowledge.importFiles')}>
            <Button
              size='small'
              shape='circle'
              type='text'
              loading={busy}
              icon={<UploadOne theme='outline' size='15' fill='currentColor' />}
              onClick={onImport}
            />
          </Tooltip>
          <Tooltip content={t('knowledge.aiSettings')}>
            <Button
              size='small'
              shape='circle'
              type='text'
              icon={<SettingConfig theme='outline' size='15' fill='currentColor' />}
              onClick={onAiSettings}
            />
          </Tooltip>
        </div>
        <div className='flex items-center gap-4px'>
          <Tooltip content={t('knowledge.openFolder')}>
            <Button
              size='small'
              shape='circle'
              type='text'
              icon={<FolderOpen theme='outline' size='15' fill='currentColor' />}
              onClick={onOpenFolder}
            />
          </Tooltip>
          <Tooltip content={t('knowledge.changeFolder')}>
            <Button
              size='small'
              shape='circle'
              type='text'
              icon={<FolderOne theme='outline' size='15' fill='currentColor' />}
              onClick={onChooseFolder}
            />
          </Tooltip>
        </div>
      </div>

      {/* Search */}
      <div className='px-12px pb-8px shrink-0'>
        <Input
          size='small'
          allowClear
          value={keyword}
          placeholder={t('knowledge.searchPlaceholder')}
          onChange={(value) => onKeywordChange(value)}
        />
      </div>

      {/* Type filter */}
      <div className='px-12px pb-8px flex items-center gap-8px shrink-0'>
        {filters.map((f) => (
          <button
            key={f.key}
            type='button'
            className={`px-10px h-24px text-12px rd-6px cursor-pointer transition-colors ${
              typeFilter === f.key ? 'bg-fill-3 text-t-primary font-[500]' : 'text-t-secondary hover:bg-fill-3'
            }`}
            onClick={() => onFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Note list */}
      <div className='flex-1 min-h-0 overflow-y-auto px-8px pb-12px'>
        {notes.length === 0 ? (
          <div className='h-full flex items-center justify-center text-t-tertiary text-13px px-16px text-center leading-20px'>
            {keyword.trim() ? t('knowledge.noNotesMatch') : t('knowledge.emptyNotes')}
          </div>
        ) : (
          <div className='flex flex-col gap-4px'>
            {notes.map((note) => {
              const active = note.relPath === selectedRelPath;
              return (
                <button
                  key={note.relPath}
                  type='button'
                  className={`text-left w-full px-10px py-8px rd-8px cursor-pointer transition-colors group ${
                    active ? 'bg-fill-3' : 'hover:bg-fill-3'
                  }`}
                  onClick={() => onSelect(note)}
                >
                  <div className='flex items-center gap-6px mb-4px'>
                    <span className='text-13px font-[500] text-t-primary flex-1 min-w-0 truncate'>{note.title}</span>
                    <span className='shrink-0 text-11px text-t-tertiary'>{formatDate(note.date)}</span>
                  </div>
                  <div className='flex items-center gap-4px'>
                    <Tag size='small' color={TYPE_TAG_COLOR[note.type]} bordered={false}>
                      {note.type === 'chat'
                        ? t('knowledge.typeChat')
                        : note.type === 'import'
                          ? t('knowledge.typeImport')
                          : t('knowledge.typeNote')}
                    </Tag>
                    {note.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className='text-11px text-t-tertiary px-6px h-18px rd-4px leading-18px bg-fill-2 truncate max-w-90px'
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteListPanel;
