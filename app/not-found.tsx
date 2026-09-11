import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-xl rounded-xl border border-teal-100 bg-white p-8 text-center shadow-[0_20px_48px_-42px_rgba(28,79,80,0.34)] sm:p-12">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-teal-200/80 bg-teal-50 text-teal-700 ring-4 ring-teal-50/50">
          <FileQuestion size={26} />
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-[0.42em] text-teal-700">
          Error 404
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Page not found
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
          The page you&apos;re looking for doesn&apos;t exist, or the record was
          archived or moved.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <Button asChild size="sm" className="rounded-md font-medium">
            <Link href="/">Back to Home</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="rounded-md font-medium"
          >
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
