import Link from "next/link";
import { ArrowRight, WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-4 py-10">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          <WifiOff className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">You are offline</h1>
        <p className="mt-2 text-sm text-slate-600">
          BudgetBoy saved basic pages for offline use. Reconnect to run fresh analysis and sync latest telecom data.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to home
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
