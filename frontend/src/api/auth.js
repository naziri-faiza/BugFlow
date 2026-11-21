import { apiClient } from './client.js';

/**
 * Register a new user account.
 * Expected body: { name, email, password }
 */
export async function registerUser({ name, email, password }) {
  const response = await apiClient.post('/api/auth/register', {
    name,
    email,
    password,
  });
  return response.data;
}

/**
 * Log in with existing credentials.
 * Expected body: { email, password }
 */
export async function loginUser({ email, password }) {
  const response = await apiClient.post('/api/auth/login', {
    email,
    password,
  });
  return response.data;
}

/**
 * Retrieve verified user profile from PostgreSQL using the JWT token.
 * Header: Authorization: Bearer <token>
 */
export async function getCurrentUser() {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
}
