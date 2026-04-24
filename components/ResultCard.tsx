import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ResultCard({ title, value, accent = "teal" }: { title: string; value: string; accent?: "teal" | "green" }) {
  return (
    <Card
      className={cn(
        "overflow-hidden transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-xl",
        accent === "green" ? "border-emerald-200/80 ring-1 ring-emerald-100/60" : "border-teal-200/80 ring-1 ring-teal-100/60"
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "bg-gradient-to-br bg-clip-text text-2xl font-bold tracking-tight text-transparent md:text-3xl",
            accent === "green" ? "from-emerald-600 to-teal-600" : "from-teal-600 to-cyan-600"
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
