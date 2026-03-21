import type { FallbackProps } from "react-error-boundary";

export default function PageErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm font-medium text-red-800">This page crashed unexpectedly.</p>
      <p className="mt-1 text-xs text-red-600">
        {error instanceof Error ? error.message : "Unknown error"}
      </p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="mt-3 text-sm font-medium text-red-700 hover:underline"
      >
        Try again
      </button>
    </div>
  );
}
