import { Link } from "wouter";
import { ArrowLeft, FileText, Shield, AlertCircle, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSEO } from '@/hooks/useSEO';

// ---------------------------------------------------------------------------
// Skeleton placeholder shown while terms are loading
// ---------------------------------------------------------------------------
function SectionSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm animate-pulse">
      <div className="flex items-center gap-4 px-8 py-5 border-b border-border bg-muted/30">
        <div className="w-9 h-9 rounded-xl bg-muted flex-shrink-0" />
        <div className="h-5 bg-muted rounded w-48" />
      </div>
      <div className="px-8 py-6 space-y-3">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-5/6" />
        <div className="h-3 bg-muted rounded w-4/5" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function TermsConditions() {
  useSEO({
    title: 'Terms & Conditions',
    description: 'CB Travel booking terms and conditions — everything you need to know before booking your holiday with us.',
  });
  const { data, isLoading, isError, refetch, isFetching } = trpc.terms.get.useQuery(undefined, {
    staleTime: 1000 * 60 * 60, // treat as fresh for 1 hour client-side
    retry: 2,
  });

  return (
    <div className="min-h-screen bg-muted/20">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-border pt-24 pb-12">
        <div className="container max-w-4xl">
          <Link href="/">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer mb-8">
              <ArrowLeft size={15} />
              Back to home
            </span>
          </Link>
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText size={26} className="text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-4xl font-bold text-foreground mb-3">
                Terms &amp; Conditions
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-2xl">
                These Booking Terms &amp; Conditions, together with any other written information we
                brought to your attention before your booking was confirmed, form the basis of your
                contract. Issued by Janine Loves Ltd t/a The JLT Group — PTS No. 6090 · ATOL No. 12564.
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                {data?.lastUpdated
                  ? `Last updated: ${data.lastUpdated}`
                  : "Last updated: March 2026"}
                &nbsp;·&nbsp; CB Travel, United Kingdom
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Important Notice ────────────────────────────────────────────────── */}
      <div className="container max-w-4xl py-8">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900 mb-1">Important Notice</p>
            <p className="text-sm text-amber-800 leading-relaxed">
              Please read these terms carefully before making a booking. By proceeding with a
              booking, you confirm that you have read, understood, and agree to be bound by these
              Terms &amp; Conditions. If you have any questions, please contact us at{" "}
              <a href="mailto:hello@cbtravel.uk" className="font-semibold underline">
                hello@cbtravel.uk
              </a>{" "}
              or call{" "}
              <a href="tel:07495823953" className="font-semibold underline">
                07495 823953
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────────────────────────── */}
      <div className="container max-w-4xl pb-20">
        {/* Error state */}
        {isError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">
                Could not load terms at this time.
              </p>
              <p className="text-sm text-red-700">Please try refreshing the page.</p>
            </div>
            <button
              onClick={() => refetch()}
              className="text-sm font-semibold text-red-700 hover:underline inline-flex items-center gap-1"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <SectionSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Sections */}
        {data?.sections && (
          <div className="space-y-6">
            {data.sections.map((section) => (
              <div
                key={section.number}
                className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm"
              >
                {/* Section header */}
                <div className="flex items-center gap-4 px-8 py-5 border-b border-border bg-muted/30">
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">{section.number}</span>
                  </div>
                  <h2 className="font-serif text-xl font-semibold text-foreground">
                    {section.title}
                  </h2>
                </div>

                {/* Section body — HTML from JLT rendered with CB Travel styling */}
                <div className="px-8 py-6">
                  <div
                    className="jlt-terms-content"
                    dangerouslySetInnerHTML={{ __html: section.contentHtml }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh indicator (subtle) */}
        {isFetching && !isLoading && (
          <p className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-1">
            <RefreshCw size={12} className="animate-spin" />
            Checking for updated terms…
          </p>
        )}

        {/* Footer note */}
        <div className="mt-10 bg-white rounded-2xl border border-border p-8 flex gap-4">
          <Shield size={22} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground mb-2">Questions about these Terms?</p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              If you have any questions or concerns about these Terms &amp; Conditions, please
              don't hesitate to get in touch with our team. We're here to help.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="mailto:hello@cbtravel.uk"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                hello@cbtravel.uk
              </a>
              <span className="text-muted-foreground">·</span>
              <a
                href="tel:07495823953"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                07495 823953
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
