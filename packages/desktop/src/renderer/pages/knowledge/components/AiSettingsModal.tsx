/**
 * @license
 * Copyright 2026 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input, Message, Modal } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import type { TKbAiSettings } from '@/common/knowledge/types';

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

interface AiSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface AiSettingsFormValues {
  baseUrl: string;
  apiKey: string;
  model: string;
}

const AiSettingsModal: React.FC<AiSettingsModalProps> = ({ visible, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<AiSettingsFormValues>();
  const [saving, setSaving] = React.useState(false);

  const handleOpen = React.useCallback(async () => {
    form.resetFields();
    try {
      const settings = await invoke(ipcBridge.knowledge.getAiSettings.invoke());
      form.setFieldsValue(settings);
    } catch (err) {
      Message.error(errorMessage(err));
    }
  }, [form]);

  const handleSave = React.useCallback(async () => {
    const values = (await form.validate()) as AiSettingsFormValues;
    setSaving(true);
    try {
      await invoke(
        ipcBridge.knowledge.saveAiSettings.invoke({
          baseUrl: values.baseUrl.trim(),
          apiKey: values.apiKey.trim(),
          model: values.model.trim(),
        })
      );
      Message.success(t('knowledge.aiSettingsSaved'));
      onSaved?.();
      onClose();
    } catch (err) {
      Message.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [form, onClose, onSaved, t]);

  return (
    <Modal
      title={t('knowledge.aiSettings')}
      visible={visible}
      onCancel={onClose}
      onOk={() => void handleSave()}
      confirmLoading={saving}
      okText={t('knowledge.save')}
      cancelText={t('knowledge.cancel')}
      unmountOnExit
      afterOpen={() => void handleOpen()}
    >
      <div className='mb-16px text-12px text-t-secondary leading-20px'>{t('knowledge.aiSettingsDesc')}</div>
      <Form form={form} layout='vertical' style={{ width: '100%' }}>
        <Form.Item
          label={t('knowledge.baseUrlLabel')}
          field='baseUrl'
          rules={[{ required: true, message: t('knowledge.baseUrlLabel') }]}
        >
          <Input placeholder='https://api.openai.com/v1 或 http://127.0.0.1:11434/v1' />
        </Form.Item>
        <Form.Item
          label={t('knowledge.modelLabel')}
          field='model'
          rules={[{ required: true, message: t('knowledge.modelLabel') }]}
        >
          <Input placeholder='gpt-4o / deepseek-chat / qwen-vl-max …' />
        </Form.Item>
        <Form.Item label={t('knowledge.apiKeyLabel')} field='apiKey'>
          <Input.Password placeholder='sk-…' />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AiSettingsModal;
