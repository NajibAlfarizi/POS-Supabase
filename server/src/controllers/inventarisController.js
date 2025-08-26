import supabase from '../config/supabase.js';

// Ambil semua inventaris
export const getInventaris = async (req, res) => {
  // Join inventaris dengan kategori
  const { data, error } = await supabase
    .from('inventaris')
    .select('*, kategori: kategori_id (id_kategori, nama_kategori)');
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
  res.json(data[0]);
};

// Hapus inventaris
export const deleteInventaris = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('inventaris').delete().eq('id_inventaris', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Item inventaris berhasil dihapus' });
};
