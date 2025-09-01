import supabase from '../config/supabase.js';
import { json2csv } from 'json-2-csv';
import ExcelJS from 'exceljs';

// Ambil semua transaksi dengan filter
export const getTransaksi = async (req, res) => {
  const { tipe, id_sparepart, tanggal_mulai, tanggal_selesai, user_id, search } = req.query;
  let query = supabase.from('transaksi').select('*, user_profiles(name), sparepart(nama_barang)');
  if (tipe) query = query.eq('tipe', tipe);
  if (id_sparepart) query = query.eq('id_sparepart', id_sparepart);
  if (user_id) query = query.eq('user_id', user_id);
  if (tanggal_mulai && tanggal_selesai) query = query.gte('tanggal', tanggal_mulai).lte('tanggal', tanggal_selesai);
  if (search) query = query.ilike('keterangan', `%${search}%`);
  const { data, error } = await query.order('tanggal', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Tambah transaksi baru & update stok sparepart otomatis
export const addTransaksi = async (req, res) => {
  const { id_sparepart, tipe, jumlah, harga_total, keterangan, user_id } = req.body;
  if (!id_sparepart || !tipe || !jumlah || !harga_total || !user_id) {
    return res.status(400).json({ error: 'id_sparepart, tipe, jumlah, harga_total, user_id wajib diisi.' });
  }
  // Simpan transaksi
  const { data: trxData, error: trxError } = await supabase.from('transaksi').insert({
    id_sparepart, tipe, jumlah, harga_total, keterangan, user_id
  }).select();
  if (trxError) return res.status(500).json({ error: trxError.message });
  // Update stok sparepart
  const { data: sparepart, error: spError } = await supabase.from('sparepart').select('jumlah, terjual, sisa').eq('id_sparepart', id_sparepart).single();
  if (spError || !sparepart) return res.status(404).json({ error: 'Sparepart tidak ditemukan.' });
  let newJumlah = sparepart.jumlah;
  let newTerjual = sparepart.terjual;
  let newSisa = sparepart.sisa;
  if (tipe === 'masuk') {
    newJumlah += jumlah;
    newSisa += jumlah;
  } else if (tipe === 'keluar') {
    newTerjual += jumlah;
    newSisa -= jumlah;
    if (newSisa < 0) newSisa = 0;
  }
  await supabase.from('sparepart').update({ jumlah: newJumlah, terjual: newTerjual, sisa: newSisa }).eq('id_sparepart', id_sparepart);
  res.status(201).json(trxData[0]);
};

// Update transaksi
export const updateTransaksi = async (req, res) => {
  const { id } = req.params;
  const { tipe, jumlah, harga_total, keterangan } = req.body;
  if (!id) return res.status(400).json({ error: 'ID transaksi wajib diisi.' });
  const { data, error } = await supabase.from('transaksi').update({ tipe, jumlah, harga_total, keterangan }).eq('id_transaksi', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
};

// Hapus transaksi
export const deleteTransaksi = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'ID transaksi wajib diisi.' });
  const { error } = await supabase.from('transaksi').delete().eq('id_transaksi', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Transaksi berhasil dihapus.' });
};

// Detail transaksi
export const getDetailTransaksi = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'ID transaksi wajib diisi.' });
  const { data, error } = await supabase.from('transaksi').select('*, user_profiles(name), sparepart(nama_barang)').eq('id_transaksi', id).single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
  res.json(data);
};

// Ringkasan transaksi
export const getRingkasanTransaksi = async (req, res) => {
  const { tipe, tanggal_mulai, tanggal_selesai } = req.query;
  let query = supabase.from('transaksi').select('harga_total, tipe, tanggal');
  if (tipe) query = query.eq('tipe', tipe);
  if (tanggal_mulai && tanggal_selesai) query = query.gte('tanggal', tanggal_mulai).lte('tanggal', tanggal_selesai);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  let total = 0;
  let cashflow = 0;
  if (data && data.length > 0) {
    total = data.reduce((sum, trx) => sum + Number(trx.harga_total), 0);
    cashflow = data.reduce((sum, trx) => {
      if (trx.tipe === 'masuk') return sum + Number(trx.harga_total);
      if (trx.tipe === 'keluar') return sum - Number(trx.harga_total);
      return sum;
    }, 0);
  }
  res.json({ tipe: tipe || 'all', total_transaksi: total, cashflow });
};

// Struk transaksi
export const getStrukTransaksi = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'ID transaksi wajib diisi.' });
  const { data, error } = await supabase.from('transaksi').select('*, user_profiles(name), sparepart(nama_barang)').eq('id_transaksi', id).single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
  const struk = {
    toko: 'Nama Toko',
    tanggal: data.tanggal,
    kasir: data.user_profiles?.name || '-',
    barang: data.sparepart?.nama_barang || '-',
    jumlah: data.jumlah,
    total: data.harga_total,
    tipe: data.tipe,
    keterangan: data.keterangan,
    id_transaksi: data.id_transaksi
  };
  res.json(struk);
};

// Export transaksi ke CSV
export const exportTransaksiCSV = async (req, res) => {
  const { tanggal_mulai, tanggal_selesai, tipe } = req.query;
  let query = supabase.from('transaksi').select('id_transaksi, tipe, jumlah, harga_total, tanggal, keterangan, user_profiles(name), sparepart(nama_barang)');
  if (tipe) query = query.eq('tipe', tipe);
  if (tanggal_mulai && tanggal_selesai) query = query.gte('tanggal', tanggal_mulai).lte('tanggal', tanggal_selesai);
  const { data, error } = await query.order('tanggal', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const mapped = (data || []).map(trx => ({
    id_transaksi: trx.id_transaksi,
    barang: trx.sparepart?.nama_barang || '',
    oleh: trx.user_profiles?.name || '',
    tipe: trx.tipe,
    jumlah: trx.jumlah,
    harga_total: trx.harga_total,
    tanggal: trx.tanggal,
    keterangan: trx.keterangan
  }));
  try {
    const csv = await json2csv(mapped);
    res.setHeader('Content-disposition', 'attachment; filename=transaksi.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csv);
  } catch (e) {
    res.status(500).json({ error: 'Gagal generate CSV' });
  }
};

// Export transaksi ke Excel
export const exportTransaksiExcel = async (req, res) => {
  const { tanggal_mulai, tanggal_selesai, tipe } = req.query;
  let query = supabase.from('transaksi').select('id_transaksi, tipe, jumlah, harga_total, tanggal, keterangan, user_profiles(name), sparepart(nama_barang)');
  if (tipe) query = query.eq('tipe', tipe);
  if (tanggal_mulai && tanggal_selesai) query = query.gte('tanggal', tanggal_mulai).lte('tanggal', tanggal_selesai);
  const { data, error } = await query.order('tanggal', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const mapped = (data || []).map(trx => ({
    id_transaksi: trx.id_transaksi,
    barang: trx.sparepart?.nama_barang || '',
    oleh: trx.user_profiles?.name || '',
    tipe: trx.tipe,
    jumlah: trx.jumlah,
    harga_total: trx.harga_total,
    tanggal: trx.tanggal,
    keterangan: trx.keterangan
  }));
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Transaksi');
  if (mapped.length > 0) {
    sheet.columns = Object.keys(mapped[0]).map((k) => ({ header: k, key: k }));
    mapped.forEach((row) => sheet.addRow(row));
  }
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=transaksi.xlsx');
  await workbook.xlsx.write(res);
  res.end();
};
