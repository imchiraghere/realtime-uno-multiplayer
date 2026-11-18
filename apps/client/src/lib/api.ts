import { SERVER_URL } from './constants';

class ApiClient {
  private baseUrl = SERVER_URL;
  private token: string | null = null;
  
  setToken(token: string | null) {
    this.token = token;
  }
  
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });
    
    const data = await res.json();
    
    if (!res.ok || !data.success) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    
    return data.data;
  }
  
  get<T>(path: string) {
    return this.request<T>(path, { method: 'GET' });
  }
  
  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  }
  
  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
  }
  
  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
