import supabase from '../config/supabase.js';
import { json2csv } from 'json-2-csv';
// Ambil semua inventaris
export const getInventaris = async (req, res) => {
  // Join inventaris dengan kategori
  const { data, error } = await supabase
    .from('inventaris')
    .select('*, kategori: kategori_id (id_kategori, nama_kategori)')
    .eq('status', 'active');
  if (error) return res.status(500).json({ error: error.message });
  // Tambahkan pesan stok hampir habis untuk item dengan stok <= 3
  const result = (data || []).map(item => {
    let msg = null;
    if (item.stok !== undefined && item.stok <= 3) {
      msg = `Stok ${item.nama_item} kategori ${item.kategori?.nama_kategori || '-'} hampir habis!`;
    }
    return { ...item, stok_warning: msg };
  });
  res.json(result);
};

// Tambah inventaris
export const addInventaris = async (req, res) => {
  const { nama_item, kategori_id, stok, satuan, harga_beli, harga_jual } = req.body;
  // Validasi field wajib
  if (!nama_item || !kategori_id) {
    return res.status(400).json({ error: 'Nama item dan kategori wajib diisi.' });
  }
  // Validasi kategori_id
  const { data: kategoriData } = await supabase
    .from('kategori')
    .select('id_kategori')
    .eq('id_kategori', kategori_id)
    .single();
  if (!kategoriData) {
    return res.status(400).json({ error: 'Kategori tidak ditemukan.' });
  }
  // Validasi stok tidak negatif dan angka
  if (stok !== undefined && (typeof stok !== 'number' || stok < 0)) {
    return res.status(400).json({ error: 'Stok tidak boleh negatif dan harus berupa angka.' });
  }
  // Validasi harga beli/jual
  if (harga_beli !== undefined && (typeof harga_beli !== 'number' || harga_beli < 0)) {
    return res.status(400).json({ error: 'Harga beli harus berupa angka positif.' });
  }
  if (harga_jual !== undefined && (typeof harga_jual !== 'number' || harga_jual < 0)) {
    return res.status(400).json({ error: 'Harga jual harus berupa angka positif.' });
  }
  // Validasi nama unik
  const { data: existing } = await supabase
    .from('inventaris')
    .select('id_inventaris')
    .eq('nama_item', nama_item)
    .eq('kategori_id', kategori_id)
    .single();
  if (existing) {
    return res.status(400).json({ error: 'Nama item dengan kategori tersebut sudah terdaftar.' });
  }
  // Insert inventaris
  const { data, error } = await supabase.from('inventaris').insert({
    nama_item,
    kategori_id,
    stok: stok || 0,
    satuan,
    harga_beli,
    harga_jual
  }).select();
  if (error) return res.status(500).json({ error: error.message });
  // Audit log
  const user_id = req.user?.id || null;
  await supabase.from('audit_log').insert({
    user_id,
    action: 'add',
    table_name: 'inventaris',
    record_id: data[0]?.id_inventaris,
    detail: { after: data[0] },
    created_at: new Date().toISOString()
  });
  res.status(201).json(data[0]);
};

// Update inventaris
export const updateInventaris = async (req, res) => {
  const { id } = req.params;
  const { nama_item, kategori_id, stok, satuan, harga_beli, harga_jual } = req.body;
  // Validasi kategori_id
  if (kategori_id) {
    const { data: kategoriData } = await supabase
      .from('kategori')
      .select('id_kategori')
      .eq('id_kategori', kategori_id)
      .single();
    if (!kategoriData) {
      return res.status(400).json({ error: 'Kategori tidak ditemukan.' });
    }
  }
  // Validasi stok tidak negatif dan angka
  if (stok !== undefined && (typeof stok !== 'number' || stok < 0)) {
    return res.status(400).json({ error: 'Stok tidak boleh negatif dan harus berupa angka.' });
  }
  // Validasi harga beli/jual
  if (harga_beli !== undefined && (typeof harga_beli !== 'number' || harga_beli < 0)) {
    return res.status(400).json({ error: 'Harga beli harus berupa angka positif.' });
  }
  if (harga_jual !== undefined && (typeof harga_jual !== 'number' || harga_jual < 0)) {
    return res.status(400).json({ error: 'Harga jual harus berupa angka positif.' });
  }
  // Validasi nama unik jika diubah
  if (nama_item && kategori_id) {
    const { data: existing } = await supabase
      .from('inventaris')
      .select('id_inventaris')
      .eq('nama_item', nama_item)
      .eq('kategori_id', kategori_id)
      .neq('id_inventaris', id)
      .single();
    if (existing) {
      return res.status(400).json({ error: 'Nama item dengan kategori tersebut sudah terdaftar.' });
    }
  }
  // Update inventaris
  const { data, error } = await supabase.from('inventaris').update({
    nama_item,
    kategori_id,
    stok,
    satuan,
    harga_beli,
    harga_jual,
    updated_at: new Date().toISOString()
  }).eq('id_inventaris', id).select();
  if (error) return res.status(500).json({ error: error.message });
  // Audit log
  const user_id = req.user?.id || null;
  await supabase.from('audit_log').insert({
    user_id,
    action: 'update',
    table_name: 'inventaris',
    record_id: id,
    detail: { after: data[0] },
    created_at: new Date().toISOString()
  });
  res.json(data[0]);
};

// Hapus inventaris
export const deleteInventaris = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('inventaris')
    .update({ status: 'inactive' })
    .eq('id_inventaris', id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  // Audit log
  const user_id = req.user?.id || null;
  await supabase.from('audit_log').insert({
    user_id,
    action: 'delete',
    table_name: 'inventaris',
    record_id: id,
    detail: { after: data[0] },
    created_at: new Date().toISOString()
  });
  res.json({ message: 'Item inventaris berhasil dinonaktifkan' });
};

// Filter & search inventaris
export const filterInventaris = async (req, res) => {
  const { kategori_id, nama_item, stok_min, stok_max } = req.query;
  let query = supabase.from('inventaris').select('*, kategori: kategori_id (id_kategori, nama_kategori)');
  if (kategori_id) {
    query = query.eq('kategori_id', kategori_id);
  }
  if (nama_item) {
    query = query.ilike('nama_item', `%${nama_item}%`);
  }
  if (stok_min !== undefined) {
    query = query.gte('stok', Number(stok_min));
  }
  if (stok_max !== undefined) {
    query = query.lte('stok', Number(stok_max));
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Export inventaris ke CSV
export const exportInventarisCSV = async (req, res) => {
  const { data, error } = await supabase.from('inventaris').select('*, kategori: kategori_id (nama_kategori)');
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Data inventaris kosong.' });
  }
  // Format data untuk CSV
  const csvData = data.map(item => ({
    id_inventaris: item.id_inventaris,
    nama_item: item.nama_item,
    kategori: item.kategori?.nama_kategori || '',
    stok: item.stok,
    satuan: item.satuan,
    harga_beli: item.harga_beli,
    harga_jual: item.harga_jual,
    created_at: item.created_at,
    updated_at: item.updated_at
  }));
  const csv = json2csv(csvData);
  res.header('Content-Type', 'text/csv');
  res.attachment('inventaris.csv');
  res.send(csv);
};

export const getAuditLogInventaris = async (req, res) => {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*, user_profiles(name)')
    .eq('table_name', 'inventaris')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};