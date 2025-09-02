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


export const getAllTransaksi = async (token: string) => {
  const res = await axios.get(`${API_URL}/transaksi`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const addTransaksi = async (token: string, data: any) => {
  const res = await axios.post(`${API_URL}/transaksi`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateTransaksi = async (token: string, id: string, data: any) => {
  const res = await axios.put(`${API_URL}/transaksi/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deleteTransaksi = async (token: string, id: string) => {
  const res = await axios.delete(`${API_URL}/transaksi/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};
