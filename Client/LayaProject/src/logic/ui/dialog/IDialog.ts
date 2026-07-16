export interface DialogOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    showClose?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
    onClose?: () => void;
    onClosed?: (confirmed: boolean) => void;
}

export interface DialogHandle {
    close(): void;
}
