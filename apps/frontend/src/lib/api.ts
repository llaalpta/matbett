import axios, {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

// Endpoints centralizados
export const ENDPOINTS = {
  DEPOSITS: {
    LIST: '/deposits',
    BY_ID: (id: string) => `/deposits/${id}`,
    CREATE: '/deposits',
    UPDATE: (id: string) => `/deposits/${id}`,
    DELETE: (id: string) => `/deposits/${id}`,
    // Endpoints REST jerárquicos para tracking
    ADD_TO_QUALIFY_TRACKING: (promotionId: string, phaseId: string, rewardId: string, qualifyConditionId: string) => 
      `/promotions/${promotionId}/phases/${phaseId}/rewards/${rewardId}/qualify-conditions/${qualifyConditionId}/deposits`,
    UPDATE_IN_QUALIFY_TRACKING: (promotionId: string, phaseId: string, rewardId: string, qualifyConditionId: string, depositId: string) => 
      `/promotions/${promotionId}/phases/${phaseId}/rewards/${rewardId}/qualify-conditions/${qualifyConditionId}/deposits/${depositId}`,
  },
  PROMOTIONS: {
    LIST: '/promotions',
    BY_ID: (id: string) => `/promotions/${id}`,
    CREATE: '/promotions',
    UPDATE: (id: string) => `/promotions/${id}`,
    DELETE: (id: string) => `/promotions/${id}`,
    UPDATE_STATUS: (id: string) => `/promotions/${id}/status`,
  }
} as const;

// Cliente HTTP configurado
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Agrega auth automáticamente
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor - Maneja errores globalmente
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado - logout automático
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export { apiClient };
