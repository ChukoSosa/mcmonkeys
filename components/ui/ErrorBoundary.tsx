"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("UI error boundary caught an error", { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-3xl px-6 py-10">
          <ErrorMessage message={this.props.fallbackMessage ?? "Something went wrong while rendering this page."} />
        </div>
      );
    }

    return this.props.children;
  }
}