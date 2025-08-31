// src/lib/api/kategoriHelper.ts
import axios from "axios";
const API_URL = "http://localhost:5000";

export async function getKategori(token: string) {
  const res = await axios.get(`${API_URL}/kategori`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function addKategori(token: string, kategori: { nama_kategori: string; status?: string }) {
  const res = await axios.post(`${API_URL}/kategori`, kategori, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function updateKategori(token: string, id: string, kategori: { nama_kategori?: string; status?: string }) {
  const res = await axios.put(`${API_URL}/kategori/${id}`, kategori, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function deleteKategori(token: string, id: string) {
  const res = await axios.delete(`${API_URL}/kategori/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function getAuditLogKategori(token: string) {
  const res = await axios.get(`${API_URL}/kategori/audit-log`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function activateKategori(token: string, id: string) {
  const res = await axios.put(`${API_URL}/kategori/activate/${id}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function getKategoriStatistik(token: string, params?: { status?: string; minTransaksi?: number }) {
  const query = params
    ? '?' + Object.entries(params).filter(([_, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}=${v}`).join('&')
    : '';
  const res = await axios.get(`${API_URL}/kategori/statistik${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}