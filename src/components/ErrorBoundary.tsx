import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl animate-in fade-in zoom-in-95 duration-200" dir="rtl">
          <div className="flex flex-col items-center justify-center text-center p-8">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {this.props.fallbackTitle || 'حدث خطأ غير متوقع في هذا الجزء'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
              عذراً، واجه النظام مشكلة برمجية أثناء عرض هذه البيانات. يمكنك المحاولة مرة أخرى أو تحديث الصفحة لاستعادة استقرار النظام.
            </p>
            {this.state.error && (
              <pre className="text-[10px] font-mono bg-black/5 dark:bg-black/30 p-3 rounded-lg text-left max-w-full overflow-x-auto text-red-600 dark:text-red-300 mb-6 max-h-32" dir="ltr">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw size={14} className="animate-spin-slow" />
              <span>تحديث واستعادة المكون</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
