import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { connectToDB } from "@/lib/mongodb";
import { SharedScenario } from "@/models/SharedScenario";

type SharePageProps = {
  params: Promise<{ shareId: string }>;
};

export default async function SharedScenarioPage({ params }: SharePageProps) {
  const { shareId } = await params;
  const normalizedShareId = shareId.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];

  try {
    await connectToDB();
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900">Could not load shared plan right now.</p>
      </main>
    );
  }

  const doc = normalizedShareId
    ? await SharedScenario.findOneAndUpdate(
        {
          shareId: normalizedShareId,
          revoked: { $ne: true },
          expiresAt: { $gt: new Date() },
        },
        { $inc: { viewCount: 1 }, $set: { lastViewedAt: new Date() } },
        { new: true }
      ).lean<{
    scenarioName: string;
    snapshot: {
      currentCost: number;
      optimizedCost: number;
      savings: number;
      avoidableWaste: number;
      members: number;
      subscriptions: number;
      suggestions?: string[];
    };
    createdAt?: string;
    expiresAt?: string;
  } | null>()
    : null;

  if (!doc) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">This shared link is invalid or expired.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Shared BudgetBoy Playlist</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{doc.scenarioName}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Snapshot {doc.createdAt ? `created on ${new Date(doc.createdAt).toLocaleDateString()}` : "shared from BudgetBoy"}.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current monthly cost</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">Rs.{doc.snapshot.currentCost.toFixed(0)}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Optimized monthly cost</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">Rs.{doc.snapshot.optimizedCost.toFixed(0)}</p>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Estimated savings</p>
            <p className="mt-1 text-2xl font-bold text-indigo-900">Rs.{Math.max(0, doc.snapshot.savings).toFixed(0)}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Avoidable waste</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">Rs.{Math.max(0, doc.snapshot.avoidableWaste).toFixed(0)}</p>
          </div>
        </div>

        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          <Users className="h-3.5 w-3.5" />
          {doc.snapshot.members} members · {doc.snapshot.subscriptions} subscriptions
        </p>

        {doc.snapshot.suggestions?.length ? (
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-900">Top recommendations</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {doc.snapshot.suggestions.slice(0, 4).map((item) => (
                <li key={item} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-8">
          <Link
            href="/wizard"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Try your own optimization
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
