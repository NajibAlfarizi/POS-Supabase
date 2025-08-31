/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/api/inventarisHelper.ts
import axios from "axios";
const API_URL = "http://localhost:5000";

// Get all inventaris (with stok_warning)
export async function getInventaris(token: string) {
  const res = await axios.get(`${API_URL}/inventaris`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Filter inventaris (by kategori, nama, stok_min, stok_max)
export async function filterInventaris(token: string, params: Record<string, any>) {
  const res = await axios.get(`${API_URL}/inventaris/search`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data;
}

// Export inventaris to CSV
export async function exportInventarisCSV(token: string) {
  const res = await axios.get(`${API_URL}/inventaris/export/csv`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: "blob"
  });
  return res.data;
}

// Tambah inventaris
export async function addInventaris(token: string, data: {
  nama_item: string;
  kategori_id: string | number;
  stok: number;
  satuan: string;
  harga_beli: number;
  harga_jual: number;
}) {
  const res = await axios.post(`${API_URL}/inventaris`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Ambil audit log inventaris
export async function getAuditLogInventaris(token: string) {
  const res = await axios.get(`${API_URL}/inventaris/audit-log`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}