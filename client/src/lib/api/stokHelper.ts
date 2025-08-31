import axios from "axios";
const API_URL = "http://localhost:5000";

export const getRiwayatStok = async (token: string, id_inventaris: string) => {
  const res = await axios.get(`${API_URL}/stok/riwayat/${id_inventaris}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const stokMasuk = async (token: string, payload: { id_inventaris: string; jumlah: number; keterangan?: string }) => {
  const res = await axios.post(`${API_URL}/stok/masuk`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const stokKeluar = async (token: string, payload: { id_inventaris: string; jumlah: number; keterangan?: string }) => {
  const res = await axios.post(`${API_URL}/stok/keluar`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const stokPenyesuaian = async (token: string, payload: { id_inventaris: string; jumlah: number; keterangan?: string }) => {
  const res = await axios.post(`${API_URL}/stok/penyesuaian`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getTipeTransaksiStok = async (token: string) => {
  const res = await axios.get(`${API_URL}/stok/tipe`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};
