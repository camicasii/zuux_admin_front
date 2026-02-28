// A lightweight API wrapper that automatically attaches the 'validation' header.

const API_BASE_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3000';

export async function fetchBotApi(endpoint: string, options: RequestInit = {}) {
    // Try to get token from localStorage on the client side
    let token = '';
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('botAdminToken') || '';
    }

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { validation: token }),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // If unauthorized, could potentially clear token and redirect, but we'll let the UI handle it for now.
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
}
