"use client";

import { useEffect, useState } from "react";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "options", "head"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

function isHttpMethod(key: string): key is HttpMethod {
  return (HTTP_METHODS as readonly string[]).includes(key.toLowerCase());
}

type OperationObject = {
  tags?: string[];
  summary?: string;
  description?: string;
  responses?: Record<string, unknown>;
};

type OpenAPISpec = {
  openapi: string;
  info: { title: string; version: string; description?: string };
  paths: Record<string, Partial<Record<HttpMethod, OperationObject>>>;
};

const methodStyles: Record<HttpMethod, string> = {
  get: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  post: "bg-sky-100 text-sky-900 ring-sky-200",
  put: "bg-amber-100 text-amber-900 ring-amber-200",
  patch: "bg-violet-100 text-violet-900 ring-violet-200",
  delete: "bg-rose-100 text-rose-900 ring-rose-200",
  options: "bg-slate-100 text-slate-800 ring-slate-200",
  head: "bg-slate-100 text-slate-800 ring-slate-200",
};

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/openapi")
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed to load spec (${r.status})`);
        return r.json() as Promise<OpenAPISpec>;
      })
      .then((data) => {
        if (!cancelled) setSpec(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load OpenAPI document.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-600" role="status">
        Loading API reference…
      </div>
    );
  }

  const operations: { path: string; method: HttpMethod; op: OperationObject }[] = [];
  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    if (!pathItem || typeof pathItem !== "object") continue;
    for (const [key, op] of Object.entries(pathItem)) {
      if (!isHttpMethod(key) || !op || typeof op !== "object") continue;
      operations.push({ path, method: key.toLowerCase() as HttpMethod, op: op as OperationObject });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-10 shadow-sm">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">BudgetBoy · HTTP API</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{spec.info.title}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Version <span className="font-mono font-semibold">{spec.info.version}</span> — all routes live under{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">/api/v1</code>. Errors use a stable{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">error.code</code>; every response includes{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">x-request-id</code>.
          </p>
          {spec.info.description ? <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">{spec.info.description}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/api/v1/openapi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Download OpenAPI JSON
            </a>
            <a
              href="/wizard"
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Back to wizard
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <h2 className="text-lg font-semibold text-slate-800">Endpoints</h2>
        <ul className="space-y-4">
          {operations.map(({ path, method, op }) => (
            <li
              key={`${method}-${path}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-center gap-2 gap-y-2">
                <span
                  className={`inline-flex rounded-md px-2.5 py-1 font-mono text-xs font-bold uppercase ring-1 ${methodStyles[method]}`}
                >
                  {method}
                </span>
                <code className="break-all font-mono text-sm text-slate-800">{path}</code>
              </div>
              {op.summary ? <p className="mt-2 text-sm font-medium text-slate-800">{op.summary}</p> : null}
              {op.description ? <p className="mt-1 text-sm leading-relaxed text-slate-600">{op.description}</p> : null}
              {op.tags && op.tags.length > 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  Tags:{" "}
                  {op.tags.map((t) => (
                    <span key={t} className="mr-2 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                      {t}
                    </span>
                  ))}
                </p>
              ) : null}
            </li>
          ))}
        </ul>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Error envelope</h2>
          <p className="mt-2 text-sm text-slate-600">
            Failed requests return JSON: <code className="font-mono text-xs">{"{ error: { code, message, details? }, requestId }"}</code>.
            Codes are defined in <code className="font-mono text-xs">lib/api/errorCodes.ts</code>.
          </p>
        </section>
      </main>
    </div>
  );
}
