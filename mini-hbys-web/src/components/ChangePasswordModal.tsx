import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { KeyRound } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { FormField } from "./ui/FormField";
import { authService } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

interface FormValues {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      newPasswordConfirm: "",
    },
  });

  useEffect(() => {
    if (!open) {
      reset({ currentPassword: "", newPassword: "", newPasswordConfirm: "" });
    }
  }, [open, reset]);

  const newPassword = watch("newPassword");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Şifre başarıyla değiştirildi.");
      onClose();
    } catch {
      /* interceptor */
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={KeyRound}
      title="Şifre Değiştir"
      description="Mevcut şifrenizi onaylayıp yeni şifre belirleyin."
      size="sm"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={user?.email ?? ""}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          className="hidden"
        />

        <FormField
          label="Mevcut Şifre"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register("currentPassword", {
            required: "Mevcut şifre zorunludur.",
          })}
        />

        <FormField
          label="Yeni Şifre"
          type="password"
          autoComplete="new-password"
          hint="En az 10 karakter; büyük/küçük harf, rakam ve özel karakter içermeli."
          error={errors.newPassword?.message}
          {...register("newPassword", {
            required: "Yeni şifre zorunludur.",
            minLength: { value: 10, message: "En az 10 karakter olmalıdır." },
            validate: (v) => {
              if (!/[A-Z]/.test(v)) return "En az bir büyük harf içermelidir.";
              if (!/[a-z]/.test(v)) return "En az bir küçük harf içermelidir.";
              if (!/[0-9]/.test(v)) return "En az bir rakam içermelidir.";
              if (!/[^a-zA-Z0-9]/.test(v))
                return "En az bir özel karakter içermelidir.";
              return true;
            },
          })}
        />

        <FormField
          label="Yeni Şifre Tekrar"
          type="password"
          autoComplete="new-password"
          error={errors.newPasswordConfirm?.message}
          {...register("newPasswordConfirm", {
            required: "Yeni şifreyi tekrar giriniz.",
            validate: (v) =>
              v === newPassword || "Şifreler eşleşmiyor.",
          })}
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Vazgeç
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Değiştir
          </Button>
        </div>
      </form>
    </Modal>
  );
}
