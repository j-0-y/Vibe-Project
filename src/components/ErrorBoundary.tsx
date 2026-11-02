import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackText?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-800 my-3">
          <p className="font-bold">⚠️ কিছু সমস্যা হয়েছে</p>
          <p className="text-xs text-red-600 mt-1">
            {this.state.error?.message || this.props.fallbackText || "পেজটি রিলোড দিন"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2.5 px-3 py-1.5 bg-red-700 text-white text-xs rounded-lg font-bold"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
