export async function api<T = any>(url: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const res = await fetch(url, { ...options, headers, credentials: 'same-origin' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
    }
    return data as T;
}

export function post<T = any>(url: string, body: unknown): Promise<T> {
    return api<T>(url, { method: 'POST', body: JSON.stringify(body) });
}

export function put<T = any>(url: string, body: unknown): Promise<T> {
    return api<T>(url, { method: 'PUT', body: JSON.stringify(body) });
}

export function del<T = any>(url: string): Promise<T> {
    return api<T>(url, { method: 'DELETE' });
}

export function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Something went wrong';
}
