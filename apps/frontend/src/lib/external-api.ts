import axios, {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

// Cliente HTTP para API externa - Solo configuración común
class ExternalAPIClient {
  private client = axios.create({
    baseURL:
      process.env.EXTERNAL_API_BASE_URL ||
      "https://api-externa-placeholder.com",
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Solo auth externa
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Agregar API key de la API externa
        const externalApiKey = process.env.EXTERNAL_API_KEY;
        if (externalApiKey) {
          config.headers.Authorization = `Bearer ${externalApiKey}`;
        }

        // Headers adicionales si son necesarios
        config.headers["X-Client-Version"] = "1.0.0";

        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    // Response interceptor - Solo manejo básico
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        // Solo logging básico, no lógica de negocio
        console.error(
          `External API Error: ${error.response?.status}`,
          error.message
        );
        return Promise.reject(error);
      }
    );
  }

  // Métodos HTTP básicos
  async get(url: string, params?: Record<string, string | number>) {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post(url: string, data?: unknown) {
    const response = await this.client.post(url, data);
    return response.data;
  }

  async put(url: string, data?: unknown) {
    const response = await this.client.put(url, data);
    return response.data;
  }

  async delete(url: string) {
    const response = await this.client.delete(url);
    return response.data;
  }
}

// Instancia singleton
export const externalAPI = new ExternalAPIClient();
