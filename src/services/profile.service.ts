import { coreFetch } from '../lib/apiClient';
import { AuthUser } from './auth.service';

export interface UpdateCustomerProfilePayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  dni?: string;
}

export const profileService = {
  async getMyProfile(): Promise<AuthUser> {
    return coreFetch<AuthUser>('/api/v1/users/me', {
      method: 'GET',
    });
  },

  async updateMyProfile(
    payload: UpdateCustomerProfilePayload
  ): Promise<{ message: string; user: AuthUser }> {
    return coreFetch<{ message: string; user: AuthUser }>('/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async changeMyPassword(payload: {
    current_password: string;
    new_password: string;
  }): Promise<{ message: string }> {
    return coreFetch<{ message: string }>('/api/v1/users/me/password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};