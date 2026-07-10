/**
 * Minimal JSON fetch helpers for the public invitation endpoints (RSVP,
 * visitor counter). Sends the Laravel XSRF token so session-based CSRF
 * protection is satisfied without pulling in axios.
 */

function getCookie(name: string): string | null {
    const match = document.cookie.match(
        new RegExp('(^|; )' + name + '=([^;]*)'),
    );

    return match ? decodeURIComponent(match[2]) : null;
}

export interface ApiEnvelope<T> {
    success: boolean;
    data: T;
    message: string;
}

export class ApiError extends Error {
    constructor(
        public status: number,
        public errors: Record<string, string[]> = {},
        message = 'Request failed',
    ) {
        super(message);
    }
}

async function request<T>(
    url: string,
    options: RequestInit,
): Promise<ApiEnvelope<T>> {
    const response = await fetch(url, {
        ...options,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') ?? '',
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers,
        },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new ApiError(
            response.status,
            payload.errors ?? {},
            payload.message ?? 'Request failed',
        );
    }

    return payload as ApiEnvelope<T>;
}

export function postJson<T>(
    url: string,
    body: unknown,
): Promise<ApiEnvelope<T>> {
    return request<T>(url, { method: 'POST', body: JSON.stringify(body) });
}

export function getJson<T>(url: string): Promise<ApiEnvelope<T>> {
    return request<T>(url, { method: 'GET' });
}
