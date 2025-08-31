/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
const API_URL = "http://localhost:5000";

export const getTransaksi = async (token: string, params?: any) => {
  const res = await axios.get(`${API_URL}/transaksi`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return res.data;
};

export const getRingkasanTransaksi = async (token: string, params?: any) => {
  const res = await axios.get(`${API_URL}/transaksi/ringkasan`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return res.data;
};

export const getLaporanTransaksi = async (token: string, params?: any) => {
  const res = await axios.get(`${API_URL}/transaksi/laporan`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return res.data;
};

export const exportTransaksiCSV = async (token: string, params?: any) => {
  const res = await axios.get(`${API_URL}/transaksi/export/csv`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
    responseType: "blob"
  });
  return res.data;
};

export const exportTransaksiExcel = async (token: string, params?: any) => {
  const res = await axios.get(`${API_URL}/transaksi/export/excel`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
    responseType: "blob"
  });
  return res.data;
};

export const getDetailTransaksi = async (token: string, id: string) => {
  const res = await axios.get(`${API_URL}/transaksi/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getStrukTransaksi = async (token: string, id: string) => {
  const res = await axios.get(`${API_URL}/transaksi/${id}/struk`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: "blob"
  });
  return res.data;
};

export const addTransaksi = async (token: string, payload: any) => {
  const res = await axios.post(`${API_URL}/transaksi`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};
