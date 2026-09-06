/**
 * @license
 * Copyright 2026 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Message, Tooltip } from '@arco-design/web-react';
import { BookmarkOne } from '@icon-park/react';
import { ipcBridge } from '@/common';
import type { TMessage } from '@/common/chat/chatLib';
import { loadAllConversationMessagesPaged } from '@renderer/utils/chat/messagePagination';

interface KbChatSaveButtonProps {
  conversation_id: string;
  conversationTitle: string;
}

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

function messageToLine(message: TMessage): string | null {
  if (message.type !== 'text') return null;
  const content = message.content?.content;
  if (typeof content !== 'string' || !content.trim()) return null;
  const speaker = message.position === 'right' ? '用户' : '助手';
  return `${speaker}：${content}`;
}

/** Header action: distill the current conversation into the 知识笔记 vault. */
const KbChatSaveButton: React.FC<KbChatSaveButtonProps> = ({ conversation_id, conversationTitle }) => {
  const { t } = useTranslation();
  const [saving, setSaving] = React.useState(false);

  const handleSave = React.useCallback(async () => {
    setSaving(true);
    try {
      const messages = await loadAllConversationMessagesPaged(conversation_id, { contentMode: 'full' });
      const transcript = messages
        .map(messageToLine)
        .filter((line): line is string => Boolean(line))
        .join('\n');
      if (!transcript.trim()) {
        Message.warning('当前会话没有可保存的消息内容');
        return;
      }
      const result = await invoke(
        ipcBridge.knowledge.saveChat.invoke({
          title: conversationTitle || t('knowledge.untitled'),
          conversationId: conversation_id,
          tags: [],
          transcript,
        })
      );
      Message.success(
        result.updated ? t('knowledge.chatSavedMessage') + '（已更新）' : t('knowledge.chatSavedMessage')
      );
    } catch (err) {
      Message.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [conversationTitle, conversation_id, t]);

  return (
    <Tooltip content={t('knowledge.saveChatTitle')}>
      <Button
        size='mini'
        type='text'
        loading={saving}
        icon={<BookmarkOne theme='outline' size='16' fill='currentColor' />}
        onClick={() => void handleSave()}
      />
    </Tooltip>
  );
};

export default KbChatSaveButton;
