// src/lib/api/authHelper.ts
// Helper untuk autentikasi (login, register, get profile, dll)
// Menyesuaikan endpoint di server: /auth/login, /auth/register, /auth/profile

import axios from 'axios';

const API_URL = "http://localhost:5000";

// Login user (owner/kasir)
export async function login(email: string, password: string) {
  const res = await axios.post(`${API_URL}/auth/login`, { email, password });
  // Response: { user, access_token, refresh_token }
  return res.data;
}

// Register admin/kasir (owner only)
export async function addAdmin(name: string, email: string, password: string) {
  const res = await axios.post(`${API_URL}/auth/register`, { name, email, password, role: 'admin' });
  // Response: { message, userId }
  return res.data;
}

// Get user profile (langsung dari localStorage, tidak request ke backend)
export function getProfile() {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) throw new Error('Token tidak valid');
  return JSON.parse(userStr);
}

// Logout user
export async function logout(token: string) {
  const res = await axios.post(`${API_URL}/auth/logout`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Refresh access token
export async function refreshAccessToken(refresh_token: string) {
  const res = await axios.post(`${API_URL}/auth/refresh`, { refresh_token });
  // Response: { user, access_token, refresh_token }
  return res.data;
}
export function refreshToken(): any {
    throw new Error("Function not implemented.");
}

