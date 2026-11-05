export const authService = {
  async registerAndLogin(data: any) {
    const registerRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone
      })
    });

    if (!registerRes.ok) {
      const error = await registerRes.json();
      throw new Error(error.error || 'Error al registrar el cliente');
    }

    const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: data.email,
        password: data.password
      })
    });

    if (!loginRes.ok) {
      throw new Error('Registro exitoso, pero falló el inicio de sesión automático.');
    }

    return await loginRes.json();
  },

  async login(data: any) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Credenciales inválidas');
    return await res.json();
  },

  async logout() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Error al cerrar sesión');
    return await res.json();
  },

  async getSession() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
      method: 'GET',
      credentials: 'include'
    });
    if (!res.ok) return null;
    return await res.json();
  }
};
