import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({ title, subtitle, back, action }: { title: string; subtitle?: string; back?: string; action?: React.ReactNode }) {
  return (
    <header className="mb-4 flex items-start gap-2">
      {back && (
        <Link href={back} aria-label="Back" className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-sand-100 no-print">
          <ChevronLeft className="h-5 w-5" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold text-sand-800">{title}</h1>
        {subtitle && <p className="text-sm text-sand-600">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
