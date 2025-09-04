import supabase from '../config/supabase.js';
import { json2csv } from 'json-2-csv';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// Ambil semua transaksi dengan filter
export const getTransaksi = async (req, res) => {
  const { tipe, sparepart, id_sparepart, tanggal_mulai, tanggal_selesai, user, search, sort, page = 1, limit = 10, kategori } = req.query;
  // Build query for data (with pagination), select kolom minimal
  let query = supabase.from('transaksi').select('id_transaksi, tanggal, jumlah, harga_total, tipe, keterangan, id_sparepart');
  if (tipe) query = query.eq('tipe', tipe);
  if (id_sparepart) query = query.eq('id_sparepart', id_sparepart);
  // Filter by kategori barang (from sparepart)
  let kategoriSparepartIds = null;
  if (kategori) {
    // Ambil semua id_sparepart yang punya kategori sesuai
    const { data: sparepartsKategori } = await supabase.from('sparepart').select('id_sparepart').eq('id_kategori_barang', kategori);
    kategoriSparepartIds = (sparepartsKategori || []).map(sp => sp.id_sparepart);
    if (kategoriSparepartIds.length > 0) {
      query = query.in('id_sparepart', kategoriSparepartIds);
    } else {
      // Tidak ada sparepart dengan kategori tsb, return kosong
      return res.json({ data: [], total: 0 });
    }
  }
  if (tanggal_mulai && tanggal_selesai) query = query.gte('tanggal', tanggal_mulai).lte('tanggal', tanggal_selesai);
  if (search) query = query.ilike('keterangan', `%${search}%`);
  // Sorting
  let sortObj = null;
  if (sort) {
    try {
      sortObj = typeof sort === 'string' ? JSON.parse(sort) : sort;
    } catch {
      sortObj = null;
    }
  }
  if (sortObj?.field) {
    query = query.order(sortObj.field, { ascending: sortObj.order === 'asc' });
  } else {
    query = query.order('tanggal', { ascending: false }); // default sort
  }
  // Pagination
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const from = (pageNum - 1) * limitNum;
  const to = from + limitNum - 1;
  query = query.range(from, to);
  // Query data
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  // Query total count (filtered) - select id_transaksi only
  let countQuery = supabase.from('transaksi').select('id_transaksi', { count: 'exact', head: true });
  if (tipe) countQuery = countQuery.eq('tipe', tipe);
  if (id_sparepart) countQuery = countQuery.eq('id_sparepart', id_sparepart);
  if (kategoriSparepartIds) {
    if (kategoriSparepartIds.length > 0) {
      countQuery = countQuery.in('id_sparepart', kategoriSparepartIds);
    } else {
      return res.json({ data: [], total: 0 });
    }
  }
  if (tanggal_mulai && tanggal_selesai) countQuery = countQuery.gte('tanggal', tanggal_mulai).lte('tanggal', tanggal_selesai);
  if (search) countQuery = countQuery.ilike('keterangan', `%${search}%`);
  const { count: total } = await countQuery;
  // Ambil semua id_sparepart unik dari hasil transaksi
  const sparepartIds = Array.from(new Set((data || []).map(trx => trx.id_sparepart).filter(Boolean)));
  let sparepartMap = {};
  if (sparepartIds.length > 0) {
    // Ambil nama_barang dan kategori
    const { data: spareparts } = await supabase.from('sparepart').select('id_sparepart, nama_barang, id_kategori_barang').in('id_sparepart', sparepartIds);
    let kategoriMap = {};
    // Ambil kategori barang
    const kategoriIds = Array.from(new Set((spareparts || []).map(sp => sp.id_kategori_barang).filter(Boolean)));
    if (kategoriIds.length > 0) {
      const { data: kategoriData } = await supabase.from('kategori_barang').select('id_kategori_barang, nama_kategori').in('id_kategori_barang', kategoriIds);
      if (Array.isArray(kategoriData)) {
        kategoriMap = Object.fromEntries(kategoriData.map(kat => [kat.id_kategori_barang, kat.nama_kategori]));
      }
    }
    if (Array.isArray(spareparts)) {
      sparepartMap = Object.fromEntries(spareparts.map(sp => [sp.id_sparepart, { nama_barang: sp.nama_barang, kategori: kategoriMap[sp.id_kategori_barang] || null }]));
    }
  }
  // Gabungkan data transaksi dengan nama_barang dan kategori dari sparepartMap
  const dataWithSparepart = (data || []).map(trx => ({
    ...trx,
    sparepart: trx.id_sparepart ? sparepartMap[trx.id_sparepart] || null : null
  }));
  res.json({ data: dataWithSparepart, total: total || 0 });
};

// Tambah transaksi baru & update stok sparepart otomatis
export const addTransaksi = async (req, res) => {
  const { id_sparepart, tipe, jumlah, harga_total, keterangan } = req.body;
  if (!id_sparepart || !tipe || !jumlah || !harga_total) {
    return res.status(400).json({ error: 'id_sparepart, tipe, jumlah, harga_total wajib diisi.' });
  }
  // Simpan transaksi
  const { data: trxData, error: trxError } = await supabase.from('transaksi').insert({
    id_sparepart, tipe, jumlah, harga_total, keterangan
  }).select();
  if (trxError) return res.status(500).json({ error: trxError.message });
  // Update stok sparepart
  const { data: sparepart, error: spError } = await supabase.from('sparepart').select('jumlah, terjual, sisa').eq('id_sparepart', id_sparepart).single();
  if (spError || !sparepart) return res.status(404).json({ error: 'Sparepart tidak ditemukan.' });
  let newJumlah = sparepart.jumlah;
  let newTerjual = sparepart.terjual;
  let newSisa = sparepart.sisa;
  if (tipe === 'masuk') {
    // Barang keluar, stok berkurang, terjual bertambah
    newJumlah -= jumlah;
    newSisa -= jumlah;
    newTerjual += jumlah;
    if (newJumlah < 0) newJumlah = 0;
    if (newSisa < 0) newSisa = 0;
  } else if (tipe === 'keluar') {
    // Barang masuk, stok bertambah
    newJumlah += jumlah;
    newSisa += jumlah;
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
  const { data, error } = await supabase.from('transaksi').select('*, sparepart(nama_barang)').eq('id_transaksi', id).single();
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
  if (error) {
    console.error('Ringkasan error:', error);
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    console.error('Ringkasan error: data null');
    return res.status(500).json({ error: 'Data transaksi tidak ditemukan.' });
  }
  let total = 0;
  let cashflow = 0;
  let total_masuk = 0;
  let total_keluar = 0;
  if (data && data.length > 0) {
    total = data.reduce((sum, trx) => sum + Number(trx.harga_total ?? 0), 0);
    total_masuk = data.filter(trx => trx.tipe === 'masuk').reduce((sum, trx) => sum + Number(trx.harga_total ?? 0), 0);
    total_keluar = data.filter(trx => trx.tipe === 'keluar').reduce((sum, trx) => sum + Number(trx.harga_total ?? 0), 0);
    cashflow = total_masuk - total_keluar;
  }
  res.json({ tipe: tipe || 'all', total_transaksi: total, cashflow, total_masuk, total_keluar });
};

// Export transaksi ke CSV
export const exportTransaksiCSV = async (req, res) => {
  const { tanggal_mulai, tanggal_selesai, tipe } = req.query;
  let query = supabase.from('transaksi').select('id_transaksi, tipe, jumlah, harga_total, tanggal, keterangan, sparepart(nama_barang)');
  if (tipe) query = query.eq('tipe', tipe);
  if (tanggal_mulai && tanggal_selesai) query = query.gte('tanggal', tanggal_mulai).lte('tanggal', tanggal_selesai);
  const { data, error } = await query.order('tanggal', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const mapped = (data || []).map(trx => ({
    id_transaksi: trx.id_transaksi,
    barang: trx.sparepart?.nama_barang || '',
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
  let query = supabase.from('transaksi').select('id_transaksi, tipe, jumlah, harga_total, tanggal, keterangan, sparepart(nama_barang)');
  if (tipe) query = query.eq('tipe', tipe);
  if (tanggal_mulai && tanggal_selesai) query = query.gte('tanggal', tanggal_mulai).lte('tanggal', tanggal_selesai);
  const { data, error } = await query.order('tanggal', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const mapped = (data || []).map(trx => ({
    id_transaksi: trx.id_transaksi,
    barang: trx.sparepart?.nama_barang || '',
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
