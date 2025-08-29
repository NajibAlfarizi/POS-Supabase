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

// Get user profile (by token)
export async function getProfile(token: string) {
  const res = await axios.get(`${API_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Logout user
export async function logout(token: string) {
  const res = await axios.post(`${API_URL}/auth/logout`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}
