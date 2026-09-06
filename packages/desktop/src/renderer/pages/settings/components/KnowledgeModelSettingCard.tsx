/**
 * @license
 * Copyright 2026 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Message, Select } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import type { IProvider } from '@/common/config/storage';
import type { TKbAiSettings } from '@/common/knowledge/types';
import { useProvidersQuery } from '@/renderer/hooks/agent/useModelProviderList';

async function invoke<T>(promise: Promise<{ ok: boolean; data?: T; error?: string }>): Promise<T> {
  const result = await promise;
  if (!result.ok) {
    throw new Error(result.error ?? '未知错误');
  }
  return result.data as T;
}

const DEFAULT_VALUE = '__default__';

function isUsableProvider(provider: IProvider): boolean {
  return provider.enabled !== false && Boolean(provider.base_url) && (provider.models ?? []).length > 0;
}

function usableModels(provider: IProvider): string[] {
  return (provider.models ?? []).filter((model) => provider.model_enabled?.[model] !== false);
}

/**
 * A dedicated Knowledge Notes model setting on the Settings → Models page.
 *
 * Lets the user pin which already-added model service Knowledge Notes uses for
 * chat distillation / document import. Leaving it at "follow default" uses the
 * first usable configured model automatically.
 */
const KnowledgeModelSettingCard: React.FC = () => {
  const { t } = useTranslation();
  const { data: providersData } = useProvidersQuery();

  const [bound, setBound] = React.useState<TKbAiSettings | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [providerId, setProviderId] = React.useState<string>(DEFAULT_VALUE);
  const [model, setModel] = React.useState<string>(DEFAULT_VALUE);
  const [saving, setSaving] = React.useState(false);

  const usable = React.useMemo(() => (providersData ?? []).filter(isUsableProvider), [providersData]);

  React.useEffect(() => {
    let mounted = true;
    if (bound !== null) return;
    invoke(ipcBridge.knowledge.getAiSettings.invoke())
      .then((settings: unknown) => {
        if (!mounted) return;
        const ai = (settings ?? {}) as TKbAiSettings;
        setBound(ai);
        setProviderId(ai.providerId?.trim() ? ai.providerId : DEFAULT_VALUE);
        setModel(ai.model?.trim() ? ai.model : DEFAULT_VALUE);
      })
      .catch((err) => {
        if (!mounted) return;
        setBound({});
        Message.error(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [bound]);

  const currentProvider = usable.find((p) => p.id === providerId);
  const currentModels = currentProvider ? usableModels(currentProvider) : [];

  const handleSave = React.useCallback(async () => {
    setSaving(true);
    try {
      const ai: TKbAiSettings =
        providerId === DEFAULT_VALUE ? {} : { providerId, model: model === DEFAULT_VALUE ? undefined : model };
      await invoke(ipcBridge.knowledge.saveAiSettings.invoke(ai));
      setBound(ai);
      Message.success(t('knowledge.aiSettingsSaved'));
    } catch (err) {
      Message.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [model, providerId, t]);

  return (
    <div className='flex flex-col gap-12px rounded-16px border border-border-2 bg-[var(--color-bg-2)] px-16px py-16px md:px-24px md:py-18px'>
      <div className='flex items-center justify-between gap-8px flex-wrap'>
        <div className='flex flex-col gap-4px'>
          <div className='text-16px font-600 text-t-primary'>{t('knowledge.aiSettings')}</div>
          <div className='text-12px text-t-secondary leading-20px'>{t('knowledge.aiSettingsDesc')}</div>
        </div>
      </div>

      {!loaded || providersData === undefined ? (
        <div className='py-12px text-13px text-t-secondary'>{t('knowledge.loading')}</div>
      ) : usable.length === 0 ? (
        <div className='py-4px text-13px text-t-secondary leading-22px'>
          {t('knowledge.aiCardNoProviderOnThisPage')}
        </div>
      ) : (
        <div className='flex flex-col gap-12px'>
          <div className='flex flex-wrap items-center gap-10px'>
            <div className='flex items-center gap-6px'>
              <span className='text-13px text-t-primary whitespace-nowrap'>{t('knowledge.aiProviderLabel')}</span>
              <Select
                className='min-w-220px'
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
            <div className='flex items-center gap-6px'>
              <span className='text-13px text-t-primary whitespace-nowrap'>{t('knowledge.aiModelLabel')}</span>
              {providerId === DEFAULT_VALUE ? (
                <div className='text-12px text-t-secondary'>{t('knowledge.aiDefaultModelHint')}</div>
              ) : (
                <Select
                  className='min-w-220px'
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
            <Button type='primary' size='small' loading={saving} onClick={() => void handleSave()}>
              {t('knowledge.save')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeModelSettingCard;
