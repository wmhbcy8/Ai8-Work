/**
 * @license
 * Copyright 2026 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Message, Modal, Select } from '@arco-design/web-react';
import { SettingConfig } from '@icon-park/react';
import { ipcBridge } from '@/common';
import type { IProvider } from '@/common/config/storage';
import type { TKbAiSettings } from '@/common/knowledge/types';

async function invoke<T>(promise: Promise<{ ok: boolean; data?: T; error?: string }>): Promise<T> {
  const result = await promise;
  if (!result.ok) {
    throw new Error(result.error ?? '未知错误');
  }
  return result.data as T;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const DEFAULT_VALUE = '__default__';

interface AiSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

function isUsableProvider(provider: IProvider): boolean {
  return provider.enabled !== false && Boolean(provider.base_url) && (provider.models ?? []).length > 0;
}

function usableModels(provider: IProvider): string[] {
  return (provider.models ?? []).filter((model) => provider.model_enabled?.[model] !== false);
}

/**
 * AI 设置：不是让用户填写一套新的 API 地址/密钥，而是从
 * 「设置 → 模型」中已添加的模型服务里挑一个给知识笔记用。
 * 没有配置任何模型时引导用户前往设置页添加。
 */
const AiSettingsModal: React.FC<AiSettingsModalProps> = ({ visible, onClose, onSaved }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [providers, setProviders] = React.useState<IProvider[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [providerId, setProviderId] = React.useState<string>(DEFAULT_VALUE);
  const [model, setModel] = React.useState<string>(DEFAULT_VALUE);
  const [saving, setSaving] = React.useState(false);

  const usable = React.useMemo(() => providers.filter(isUsableProvider), [providers]);

  const handleOpen = React.useCallback(async () => {
    setLoaded(false);
    setSaving(false);
    try {
      const [settings, rows] = await Promise.all([
        invoke(ipcBridge.knowledge.getAiSettings.invoke()),
        // mode.listProviders is a REST endpoint (returns the raw provider list).
        ipcBridge.mode.listProviders.invoke().catch(() => [] as IProvider[]),
      ]);
      setProviders(rows as IProvider[]);
      const bound = (settings ?? {}) as TKbAiSettings;
      setProviderId(bound.providerId?.trim() ? bound.providerId : DEFAULT_VALUE);
      setModel(bound.model?.trim() ? bound.model : DEFAULT_VALUE);
    } catch (err) {
      Message.error(errorMessage(err));
    } finally {
      setLoaded(true);
    }
  }, []);

  const handleSave = React.useCallback(async () => {
    if (providerId === DEFAULT_VALUE && model !== DEFAULT_VALUE) {
      Message.warning(t('knowledge.aiPickProviderFirst'));
      return;
    }
    setSaving(true);
    try {
      const ai: TKbAiSettings =
        providerId === DEFAULT_VALUE ? {} : { providerId, model: model === DEFAULT_VALUE ? undefined : model };
      await invoke(ipcBridge.knowledge.saveAiSettings.invoke(ai));
      Message.success(t('knowledge.aiSettingsSaved'));
      onSaved?.();
      onClose();
    } catch (err) {
      Message.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [model, onClose, onSaved, providerId, t]);

  const currentProvider = usable.find((p) => p.id === providerId);
  const currentModels = currentProvider ? usableModels(currentProvider) : [];

  const goSettings = React.useCallback(() => {
    onClose();
    navigate('/settings/model');
  }, [navigate, onClose]);

  const hasAnyProvider = usable.length > 0;

  return (
    <Modal
      title={t('knowledge.aiSettings')}
      visible={visible}
      onCancel={onClose}
      onOk={() => void handleSave()}
      confirmLoading={saving}
      okText={t('knowledge.save')}
      cancelText={t('knowledge.cancel')}
      okButtonProps={{ disabled: !hasAnyProvider }}
      unmountOnExit
      afterOpen={() => void handleOpen()}
    >
      {!loaded ? (
        <div className='py-16px text-center text-t-secondary'>{t('knowledge.loading')}</div>
      ) : !hasAnyProvider ? (
        <div className='py-8px'>
          <div className='flex flex-col items-center gap-12px py-16px text-center'>
            <div className='text-13px leading-relaxed text-t-secondary'>{t('knowledge.aiNoProviderDesc')}</div>
            <Button type='primary' icon={<SettingConfig />} onClick={() => void goSettings()}>
              {t('knowledge.aiGoSettings')}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className='mb-16px text-12px leading-relaxed text-t-secondary'>{t('knowledge.aiSettingsDesc')}</div>
          <div className='mb-16px'>
            <div className='mb-6px text-13px text-t-primary'>{t('knowledge.aiProviderLabel')}</div>
            <Select
              style={{ width: '100%' }}
              value={providerId}
              onChange={(value: string) => {
                setProviderId(value);
                setModel(DEFAULT_VALUE);
              }}
            >
              <Select.Option value={DEFAULT_VALUE}>{t('knowledge.aiFollowDefault')}</Select.Option>
              {usable.map((provider) => (
                <Select.Option key={provider.id} value={provider.id}>
                  {provider.name || provider.id}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className='mb-16px'>
            <div className='mb-6px text-13px text-t-primary'>{t('knowledge.aiModelLabel')}</div>
            {providerId === DEFAULT_VALUE ? (
              <div className='text-12px leading-relaxed text-t-secondary'>{t('knowledge.aiDefaultModelHint')}</div>
            ) : (
              <Select
                style={{ width: '100%' }}
                value={model}
                onChange={(value: string) => setModel(value)}
                placeholder={t('knowledge.aiPickModelPlaceholder')}
              >
                {currentModels.map((modelName) => (
                  <Select.Option key={modelName} value={modelName}>
                    {modelName}
                  </Select.Option>
                ))}
              </Select>
            )}
          </div>
          <div className='text-12px text-t-secondary'>{t('knowledge.aiSettingsNote')}</div>
        </div>
      )}
    </Modal>
  );
};

export default AiSettingsModal;
