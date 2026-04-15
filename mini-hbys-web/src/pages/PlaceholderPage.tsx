import { Construction } from "lucide-react";

interface Props {
  title: string;
}

export function PlaceholderPage({ title }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-medical-50 mb-4">
        <Construction className="w-7 h-7 text-medical-600" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="text-slate-500 mt-2">Bu sayfa sonraki aşamada tamamlanacak.</p>
    </div>
  );
}
