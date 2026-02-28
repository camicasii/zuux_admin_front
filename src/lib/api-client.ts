import axios, { AxiosError } from 'axios';

// Tipos base
export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: APIError;
    metadata?: APIMetadata;
    pagination?: PaginationData;
}

export interface APIError {
    code: string;
    message: string;
    details?: ValidationError[] | null;
}

export interface ValidationError {
    field: string;
    message: string;
    tag?: string;
    value?: any;
}

export interface APIMetadata {
    timestamp: string;
    request_id?: string;
    cached: boolean;
}

export interface PaginationData {
    current_page: number;
    per_page: number;
    total_pages: number;
    total_records: number;
    has_next: boolean;
    has_prev: boolean;
}

// Ensure the correct url is resolved even if the user still uses WEB_API_URL
const resolveApiUrl = () => {
    const url = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_WEB_API_URL || 'http://localhost:8080/api/v1';
    if (url.includes('snotrasys.com') && !url.includes('/api/v1')) {
        return `${url}/api/v1`;
    }
    return url;
};

// Cliente configurado
const apiClient = axios.create({
    baseURL: resolveApiUrl(),
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para logging (opcional)
apiClient.interceptors.request.use(
    (config) => {
        // console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejo de respuestas
apiClient.interceptors.response.use(
    (response) => {
        // Agregar info de rate limit si existe
        if (response.headers['x-ratelimit-remaining']) {
            // console.log(`[Rate Limit] ${response.headers['x-ratelimit-remaining']}/${response.headers['x-ratelimit-limit']} restantes`);
        }
        return response;
    },
    (error: AxiosError<APIResponse<any>>) => {
        // Aquí puedes agregar logging global de errores
        console.error('[API Error]', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default apiClient;
