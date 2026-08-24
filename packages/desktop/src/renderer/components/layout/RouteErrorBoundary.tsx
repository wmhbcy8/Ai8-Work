/**
 * 路由级错误边界
 *
 * React.lazy 动态 import 失败（例如 chunk 模块初始化抛错）时，Suspense 只能
 * 兜住 loading 阶段，一旦 import() reject 或懒加载组件首次渲染抛错，错误会
 * 一路冒泡到 React 根节点，把整棵树卸载 —— 表现为"整个软件白屏"。
 *
 * 该边界包裹在 Suspense 外层，任何懒加载失败都会被就地捕获并渲染成可见的
 * 错误信息（含消息 + 堆栈 + 重新加载按钮），而不是一片空白。
 */
import React from 'react';

type State = { error: Error | null };

export class RouteErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[RouteErrorBoundary]', error?.message, error?.stack, info?.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  override render() {
    const { error } = this.state;
    if (error) {
      return (
        <div
          style={{
            padding: 24,
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#c0392b',
            background: '#fff',
            height: '100%',
            overflow: 'auto',
          }}
        >
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: 16 }}>页面加载出错（RouteErrorBoundary 捕获）</h3>
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            <strong>错误信息：</strong>
            {error.message || '(无)'}
          </div>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              borderTop: '1px solid #eee',
              marginTop: 12,
              paddingTop: 12,
              maxHeight: 320,
              overflow: 'auto',
            }}
          >
            {error.stack || '(无堆栈)'}
          </pre>
          <button
            type='button'
            onClick={this.handleReload}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid #ccc',
              background: '#fafafa',
            }}
          >
            重新加载
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
