declare global {
    interface Window {
        snap?: {
            pay: (
                snapToken: string,
                callbacks?: {
                    onSuccess?: (result: unknown) => void;
                    onPending?: (result: unknown) => void;
                    onError?: (result: unknown) => void;
                    onClose?: () => void;
                },
            ) => void;
        };
    }
}

let loading: Promise<void> | null = null;

/**
 * Loads the Midtrans Snap.js script once and resolves when `window.snap` is ready.
 */
export function loadSnap(clientKey: string, isProduction: boolean): Promise<void> {
    if (typeof window === 'undefined') {
        return Promise.resolve();
    }

    if (window.snap) {
        return Promise.resolve();
    }

    if (loading) {
        return loading;
    }

    loading = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = isProduction
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', clientKey);
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Gagal memuat Midtrans Snap.js'));
        document.head.appendChild(script);
    });

    return loading;
}

export {};
