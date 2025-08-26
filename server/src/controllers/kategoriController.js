import supabase from '../config/supabase.js';

// Ambil semua kategori
export const getKategori = async (req, res) => {
  const { data, error } = await supabase.from('kategori').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Tambah kategori
export const addKategori = async (req, res) => {
  const { nama_kategori, status } = req.body;
  // Validasi field wajib
  if (!nama_kategori) {
    return res.status(400).json({ error: 'Nama kategori wajib diisi.' });
  }
  // Validasi nama unik
  const { data: existing } = await supabase
    .from('kategori')
    .select('id_kategori')
    .eq('nama_kategori', nama_kategori)
    .single();
  if (existing) {
    return res.status(400).json({ error: 'Nama kategori sudah terdaftar.' });
  }
  // Validasi status
  const statusList = ['active', 'inactive'];
  if (status && !statusList.includes(status)) {
    return res.status(400).json({ error: 'Status kategori tidak valid.' });
  }
  const { data, error } = await supabase.from('kategori').insert({
    nama_kategori,
    status: status || 'active'
  }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
};

// Update kategori
export const updateKategori = async (req, res) => {
  const { id } = req.params;
  const { nama_kategori, status } = req.body;
  // Validasi nama unik jika diubah
  if (nama_kategori) {
    const { data: existing } = await supabase
      .from('kategori')
      .select('id_kategori')
      .eq('nama_kategori', nama_kategori)
      .neq('id_kategori', id)
      .single();
    if (existing) {
      return res.status(400).json({ error: 'Nama kategori sudah terdaftar.' });
    }
  }
  // Validasi status
  const statusList = ['active', 'inactive'];
  if (status && !statusList.includes(status)) {
    return res.status(400).json({ error: 'Status kategori tidak valid.' });
  }
  const { data, error } = await supabase.from('kategori').update({
    nama_kategori,
    status
  }).eq('id_kategori', id).select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
  }
  res.json(data[0]);
};

// Hapus kategori
export const deleteKategori = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('kategori').delete().eq('id_kategori', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Kategori berhasil dihapus' });
};
