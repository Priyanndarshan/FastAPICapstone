import { modal, modalPanel, btnSecondary, btnDanger } from "../../../styles/ui";

export interface ConfirmModalProps {
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    message,
    confirmLabel,
    cancelLabel,
    loading,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    return (
        <div className={modal} role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
            <div className={modalPanel}>
                <p id="confirm-modal-title" className="text-slate-700">
                    {message}
                </p>
                <div className="mt-6 flex gap-3">
                    <button type="button" onClick={onCancel} className={btnSecondary + " flex-1"}>
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={btnDanger + " flex-1 py-2.5"}
                    >
                        {loading ? "…" : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
