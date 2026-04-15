import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Sil",
  cancelText = "Vazgeç",
  loading,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="flex gap-3">
        <div className="shrink-0 w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm text-slate-600 pt-1.5">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
