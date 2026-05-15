import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

const buildPageNumbers = (page: number, totalPages: number): (number | "…")[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "…")[] = [];
  const window = 1;

  pages.push(1);

  const left = Math.max(2, page - window);
  const right = Math.min(totalPages - 1, page + window);

  if (left > 2) pages.push("…");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push("…");

  pages.push(totalPages);
  return pages;
};

export function Pagination({
  page,
  totalPages,
  totalCount,
  onPageChange,
  itemLabel = "kayıt",
}: Props) {
  const safeTotal = Math.max(totalPages, 1);
  const canPrev = page > 1;
  const canNext = page < safeTotal;
  const pages = buildPageNumbers(page, safeTotal);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/50">
      <div className="text-xs text-slate-500">
        Toplam <span className="font-semibold text-slate-700 tabular-nums">{totalCount}</span> {itemLabel}
        {safeTotal > 1 && (
          <>
            {" · "}
            <span className="tabular-nums">
              Sayfa {page} / {safeTotal}
            </span>
          </>
        )}
      </div>

      {safeTotal > 1 && (
        <div className="inline-flex items-center gap-1 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => canPrev && onPageChange(page - 1)}
            disabled={!canPrev}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium
                       text-slate-600 bg-white border border-slate-200
                       hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Önceki sayfa"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Önceki
          </button>

          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`e-${i}`} className="px-2 text-xs text-slate-400 select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={`min-w-[28px] px-2 py-1.5 rounded-md text-xs font-medium tabular-nums
                            transition-colors border ${
                              p === page
                                ? "bg-medical-600 text-white border-medical-600 shadow-sm"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => canNext && onPageChange(page + 1)}
            disabled={!canNext}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium
                       text-slate-600 bg-white border border-slate-200
                       hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Sonraki sayfa"
          >
            Sonraki
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
