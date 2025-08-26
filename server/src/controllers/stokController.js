import supabase from '../config/supabase.js';
import { TIPE_TRANSAKSI_STOK } from '../constants/stok.js';

// Ambil riwayat stok per inventaris
export const getRiwayatStok = async (req, res) => {
  const { id_inventaris } = req.params;
  const { data, error } = await supabase
    .from('riwayat_stok')
    .select('*, user: user_id (id, name), inventaris: id_inventaris (nama_item, satuan)')
    .eq('id_inventaris', id_inventaris)
    .order('tanggal', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Pencatatan barang masuk
export const stokMasuk = async (req, res) => {
  const { id_inventaris, jumlah, keterangan } = req.body;
  const user_id = req.user.id;
  if (!id_inventaris || !jumlah || jumlah <= 0) {
    return res.status(400).json({ error: 'ID inventaris dan jumlah masuk wajib diisi dan harus positif.' });
  }
  // Update stok inventaris
  const { data: inventaris, error: invError } = await supabase
    .from('inventaris')
    .select('stok')
    .eq('id_inventaris', id_inventaris)
    .single();
  if (invError || !inventaris) {
    return res.status(404).json({ error: 'Inventaris tidak ditemukan.' });
  }
  const newStok = inventaris.stok + jumlah;
  const { error: updateError } = await supabase
    .from('inventaris')
    .update({ stok: newStok })
    .eq('id_inventaris', id_inventaris);
  if (updateError) return res.status(500).json({ error: updateError.message });
  // Catat riwayat stok
  const { error: riwayatError } = await supabase
    .from('riwayat_stok')
    .insert({
      id_inventaris,
      tipe_transaksi: 'masuk',
      jumlah,
      keterangan,
      user_id
    });
  if (riwayatError) return res.status(500).json({ error: riwayatError.message });
  res.json({ message: 'Stok masuk berhasil dicatat', stok: newStok });
};

// Pencatatan barang keluar
export const stokKeluar = async (req, res) => {
  const { id_inventaris, jumlah, keterangan } = req.body;
  const user_id = req.user.id;
  if (!id_inventaris || !jumlah || jumlah <= 0) {
    return res.status(400).json({ error: 'ID inventaris dan jumlah keluar wajib diisi dan harus positif.' });
  }
  // Update stok inventaris
  const { data: inventaris, error: invError } = await supabase
    .from('inventaris')
    .select('stok')
    .eq('id_inventaris', id_inventaris)
    .single();
  if (invError || !inventaris) {
    return res.status(404).json({ error: 'Inventaris tidak ditemukan.' });
  }
  if (inventaris.stok < jumlah) {
    return res.status(400).json({ error: 'Stok tidak mencukupi.' });
  }
  const newStok = inventaris.stok - jumlah;
  const { error: updateError } = await supabase
    .from('inventaris')
    .update({ stok: newStok })
    .eq('id_inventaris', id_inventaris);
  if (updateError) return res.status(500).json({ error: updateError.message });
  // Catat riwayat stok
  const { error: riwayatError } = await supabase
    .from('riwayat_stok')
    .insert({
      id_inventaris,
      tipe_transaksi: 'keluar',
      jumlah,
      keterangan,
      user_id
    });
  if (riwayatError) return res.status(500).json({ error: riwayatError.message });
  res.json({ message: 'Stok keluar berhasil dicatat', stok: newStok });
};

// Pencatatan penyesuaian stok
export const stokPenyesuaian = async (req, res) => {
  const { id_inventaris, jumlah, keterangan } = req.body;
  const user_id = req.user.id;
  if (!id_inventaris || jumlah === undefined) {
    return res.status(400).json({ error: 'ID inventaris dan jumlah penyesuaian wajib diisi.' });
  }
  // Update stok inventaris
  const { error: updateError } = await supabase
    .from('inventaris')
    .update({ stok: jumlah })
    .eq('id_inventaris', id_inventaris);
  if (updateError) return res.status(500).json({ error: updateError.message });
  // Catat riwayat stok
  const { error: riwayatError } = await supabase
    .from('riwayat_stok')
    .insert({
      id_inventaris,
      tipe_transaksi: 'penyesuaian',
      jumlah,
      keterangan,
      user_id
    });
  if (riwayatError) return res.status(500).json({ error: riwayatError.message });
  res.json({ message: 'Penyesuaian stok berhasil dicatat', stok: jumlah });
};

// Ambil tipe transaksi stok (untuk frontend)
export const getTipeTransaksiStok = (req, res) => {
  res.json(TIPE_TRANSAKSI_STOK);
};
