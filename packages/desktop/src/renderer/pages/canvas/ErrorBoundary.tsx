/**
 * 画布运行时错误捕获（诊断用）
 *
 * React 19 下若渲染/钩子抛错且无边界，会卸载整棵组件树导致"白屏"。
 * 该组件把渲染错误 + 全局未捕获错误渲染成可见文本，便于在用户机器上
 * 截图定位，而不是只有一片白。
 */
import React, { useEffect, useState } from 'react';

type CaptureState = {
  hasError: boolean;
  message: string;
  stack: string;
  logs: string[];
};

const pushLog = (logs: string[], msg: string): string[] => {
  const next = logs.concat(msg);
  // 最多保留最近 20 条
  return next.length > 20 ? next.slice(next.length - 20) : next;
};

export class CanvasErrorBoundary extends React.Component<
  React.PropsWithChildren<{ label?: string }>,
  CaptureState
> {
  constructor(props: React.PropsWithChildren<{ label?: string }>) {
    super(props);
    this.state = { hasError: false, message: '', stack: '', logs: [] };
  }

  static getDerivedStateFromError(error: Error): Partial<CaptureState> {
    return { hasError: true, message: error?.message ?? String(error), stack: error?.stack ?? '' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const extra = `[componentDidCatch] ${error?.message ?? ''}\n${error?.stack ?? ''}\n${info?.componentStack ?? ''}`;
    // eslint-disable-next-line no-console
    console.error('[CanvasErrorBoundary]', extra);
  }

  private appendLog = (msg: string) => {
    this.setState((s) => ({ ...s, logs: pushLog(s.logs, msg) }));
  };

  override componentDidMount() {
    const onError = (e: ErrorEvent) => {
      this.appendLog(`[window.onerror] ${e.message ?? ''} @ ${e.filename ?? ''}:${e.lineno ?? ''}`);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const r: unknown = e.reason;
      this.appendLog(
        `[unhandledrejection] ${r instanceof Error ? `${r.message}\n${r.stack}` : String(r)}`,
      );
    };
    const onUnhandledError = (e: unknown) => {
      this.appendLog(`[console.error] ${String(e)}`);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    // 捕获部分框架直接把错误抛到 console.error 的场景
    // eslint-disable-next-line no-console
    const origError = console.error;
    // eslint-disable-next-line no-console
    console.error = (...args: unknown[]) => {
      try {
        origError(...args);
      } catch {
        /* noop */
      }
      try {
        onUnhandledError(args.map(String).join(' '));
      } catch {
        /* noop */
      }
    };

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      // eslint-disable-next-line no-console
      console.error = origError;
    };
  }

  override render() {
    const { hasError, message, stack, logs } = this.state;
    if (hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', fontSize: 12, color: '#c0392b', background: '#fff' }}>
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: 16 }}>画布渲染出错（ErrorBoundary 捕获）</h3>
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            <strong>错误信息：</strong>
            {message || '(无)'}
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', borderTop: '1px solid #eee', marginTop: 12, paddingTop: 12, maxHeight: 300, overflow: 'auto' }}>
            {stack || '(无堆栈)'}
          </pre>
          <hr />
          <h4>运行日志 / 全局错误</h4>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 300, overflow: 'auto', color: '#555' }}>
            {logs.length ? logs.join('\n') : '(暂无)'}
          </pre>
        </div>
      );
    }

    if (logs.length) {
      // 无错误但有全局异常记录时，用一个低调的浮动条提示
      return (
        <React.Fragment>
          {this.props.children}
          <div
            style={{
              position: 'absolute',
              left: 12,
              bottom: 60,
              zIndex: 9999,
              maxWidth: '80vw',
              maxHeight: 240,
              overflow: 'auto',
              padding: 8,
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid #ffccc7',
              borderRadius: 8,
              color: '#cf1322',
              fontFamily: 'monospace',
              fontSize: 11,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {logs.slice(-12).join('\n')}
          </div>
        </React.Fragment>
      );
    }

    return this.props.children;
  }
}
