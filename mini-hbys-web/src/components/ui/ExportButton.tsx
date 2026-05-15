import { useState } from "react";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "./Button";

interface Props {
  onExport: () => Promise<void>;
  label?: string;
  disabled?: boolean;
}

export function ExportButton({
  onExport,
  label = "Excel'e Aktar",
  disabled,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onExport();
      toast.success("Excel dosyası indirildi.");
    } catch {
      toast.error("Excel dosyası indirilemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleClick}
      loading={loading}
      disabled={disabled}
      icon={<Download className="w-4 h-4" />}
    >
      {label}
    </Button>
  );
}
