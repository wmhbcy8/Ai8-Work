import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Result, Spin, Typography } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import type { IWebUIStatus } from '@/common/adapter/ipcBridge';
import { fetchProviders } from '@renderer/hooks/agent/useModelProviderList';
import { providersToCanvasConfig, type CanvasAiConfig } from '@renderer/utils/canvas/aiConfig';

/**
 * Infinite Canvas workspace page.
 *
 * Embeds the canvas sub-app (packages/desktop/resources/canvas, served by the
 * web-host static server at <webuiLocalUrl>/canvas/index.html) in an iframe and
 * injects the OpenAI-compatible model config chosen in AionUi
 * (Settings -> Model) over postMessage. The bridge script inside the canvas
 * index.html (see scripts/sync-canvas.js) persists it into the canvas'
 * localStorage and reloads once so the canvas boots with the injected config.
 */
const CanvasPage = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [canvasUrl, setCanvasUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const sendConfigToCanvas = async () => {
    try {
      const providers = await fetchProviders();
      const config: CanvasAiConfig | null = providersToCanvasConfig(providers);
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      win.postMessage(
        {
          type: 'aionui:canvas-config',
          config,
          reload: true,
        },
        '*',
      );
    } catch (err) {
      console.error('[CanvasPage] failed to build canvas config:', err);
    }
  };

  useEffect(() => {
    let disposed = false;

    const ensureWebUi = async (): Promise<{ localUrl: string } | null> => {
      let state: IWebUIStatus | null = null;
      try {
        state = await ipcBridge.webui.getStatus.invoke();
      } catch (err) {
        console.warn('[CanvasPage] webui.getStatus failed:', err);
        state = null;
      }
      if (state?.running && state.localUrl) return state;
      // The web-host server is not running yet — start it so the canvas can be
      // served over http (postMessage channel works, IndexedDB is available).
      try {
        const started = await ipcBridge.webui.start.invoke({});
        if (started.localUrl) return started;
      } catch (err) {
        console.warn('[CanvasPage] webui.start failed:', err);
      }
      return state;
    };

    (async () => {
      try {
        const state = await ensureWebUi();
        if (disposed) return;
        const url = state?.localUrl;
        if (!url) {
          setStatus('error');
          setErrorMsg('webui-not-available');
          return;
        }
        setCanvasUrl(`${url.replace(/\/+$/, '')}/canvas/index.html`);
        setStatus('ready');
      } catch (err) {
        if (disposed) return;
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    })();

    // Answer the canvas bridge's config requests (it may load before we push).
    const onMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== 'object' || data.type !== 'aionui:canvas:request-config') return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      void sendConfigToCanvas();
    };
    window.addEventListener('message', onMessage);

    return () => {
      disposed = true;
      window.removeEventListener('message', onMessage);
    };
  }, []);

  const handleIframeLoad = () => {
    void sendConfigToCanvas();
  };

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Spin tip="Starting canvas…" loading style={{ fontSize: 14 }}>
          <div style={{ width: 320, height: 160 }} />
        </Spin>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Result
          status="error"
          title="Canvas failed to start"
          subTitle={errorMsg || 'unknown error'}
          extra={[
            <Button key="retry" type="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!canvasUrl ? (
        <Alert type="warning" content="Canvas URL not available." />
      ) : (
        <iframe
          ref={iframeRef}
          src={canvasUrl}
          onLoad={handleIframeLoad}
          style={{ flex: 1, width: '100%', border: 'none', background: '#fff' }}
          title="Infinite Canvas"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads"
        />
      )}
      <Typography.Text style={{ padding: '4px 12px', fontSize: 12, color: 'var(--color-text-3)' }}>
        Infinite Canvas · {canvasUrl}
      </Typography.Text>
    </div>
  );
};

export default CanvasPage;
