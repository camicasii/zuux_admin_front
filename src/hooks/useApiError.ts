import { AxiosError } from 'axios';
import { APIResponse, ValidationError } from '@/lib/api-client';

export interface FormattedError {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
    statusCode?: number;
}

export function useApiError() {
    const formatError = (error: unknown): FormattedError => {
        // Si es un error de Axios
        if (error instanceof AxiosError) {
            const response = error.response?.data as APIResponse<any>;
            const statusCode = error.response?.status;

            // Error de validación (422)
            if (statusCode === 422 && response?.error?.details) {
                const fieldErrors: Record<string, string> = {};
                (response.error.details as ValidationError[]).forEach((err) => {
                    fieldErrors[err.field] = err.message;
                });

                return {
                    code: response.error.code,
                    message: response.error.message,
                    fieldErrors,
                    statusCode,
                };
            }

            // Otros errores con respuesta de la API
            if (response?.error) {
                return {
                    code: response.error.code,
                    message: response.error.message,
                    statusCode,
                };
            }

            // Error de red o timeout
            if (error.code === 'ECONNABORTED') {
                return {
                    code: 'TIMEOUT',
                    message: 'La petición tardó demasiado. Intenta de nuevo.',
                    statusCode: 408,
                };
            }

            if (error.code === 'ERR_NETWORK') {
                return {
                    code: 'NETWORK_ERROR',
                    message: 'No se pudo conectar al servidor. Verifica tu conexión.',
                    statusCode: 0,
                };
            }

            // Error genérico de HTTP
            return {
                code: 'HTTP_ERROR',
                message: error.message || 'Ocurrió un error inesperado',
                statusCode: error.response?.status,
            };
        }

        // Error desconocido
        return {
            code: 'UNKNOWN_ERROR',
            message: 'Ocurrió un error inesperado',
        };
    };

    const getErrorMessage = (error: unknown): string => {
        const formatted = formatError(error);
        return formatted.message;
    };

    return { formatError, getErrorMessage };
}
