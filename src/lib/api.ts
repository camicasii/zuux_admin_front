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
        ...(token && { Authorization: token }), // Cambiado a Authorization como indica task.md
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Manejo global de expiración de token o falta de permisos
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('botAdminToken');
                // Redirigir al inicio y recargar la página para que el AuthContext actualice su estado
                window.location.href = '/';
            }
            throw new Error('Sesión expirada o no autorizada. Por favor, conéctate de nuevo.');
        }

        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
}
