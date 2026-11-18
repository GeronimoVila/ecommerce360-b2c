import { coreFetch } from '../lib/apiClient';

interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterPayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  rememberMe?: boolean;
}

export const authService = {
  async registerAndLogin(data: RegisterPayload) {
    await coreFetch('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
      }),
    });

    try {
      return await coreFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe ?? true,
        }),
      });
    } catch {
      throw new Error('Registro exitoso, pero falló el inicio de sesión automático.');
    }
  },

  async login(data: LoginPayload) {
    return coreFetch<{ message: string; rememberMe: boolean; user: any }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        rememberMe: Boolean(data.rememberMe),
      }),
    });
  },

  async logout() {
    return coreFetch('/api/v1/auth/logout', {
      method: 'POST',
    });
  },

  async getSession() {
    try {
      return await coreFetch<{ user: any }>('/api/v1/auth/me', {
        method: 'GET',
      });
    } catch {
      return null;
    }
  },
};