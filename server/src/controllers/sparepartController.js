import supabase from '../config/supabase.js';
import { json2csv } from 'json-2-csv';
import ExcelJS from 'exceljs';

// Ambil semua sparepart
export const getAllSparepart = async (req, res) => {
  const { data, error } = await supabase
    .from('sparepart')
    .select('*, merek(nama_merek), kategori_barang(nama_kategori)')
    .order('nama_barang', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Tambah sparepart baru
export const addSparepart = async (req, res) => {
  const { kode_barang, nama_barang, id_merek, id_kategori_barang, sumber, jumlah, terjual, sisa, harga_modal, harga_jual } = req.body;
  if (!kode_barang || !nama_barang || !id_merek || !id_kategori_barang || !sumber) {
    return res.status(400).json({ error: 'Field wajib: kode_barang, nama_barang, id_merek, id_kategori_barang, sumber.' });
  }
  const { data, error } = await supabase.from('sparepart').insert({
    kode_barang,
    nama_barang,
    id_merek,
    id_kategori_barang,
    sumber,
    jumlah: jumlah || 0,
    terjual: terjual || 0,
    sisa: sisa || 0,
    harga_modal: harga_modal || 0,
    harga_jual: harga_jual || 0
  }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
};

// Edit sparepart
export const updateSparepart = async (req, res) => {
  const { id } = req.params;
  const { kode_barang, nama_barang, id_merek, id_kategori_barang, sumber, jumlah, terjual, sisa, harga_modal, harga_jual } = req.body;
  const { data, error } = await supabase.from('sparepart').update({
    kode_barang,
    nama_barang,
    id_merek,
    id_kategori_barang,
    sumber,
    jumlah,
    terjual,
    sisa,
    harga_modal,
    harga_jual
  }).eq('id_sparepart', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
};

// Hapus sparepart
export const deleteSparepart = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('sparepart').delete().eq('id_sparepart', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Sparepart berhasil dihapus.' });
};

// Update stok dan penjualan sparepart berdasarkan transaksi
export const updateSparepartByTransaksi = async (req, res) => {
  const { id_sparepart, tipe, jumlah } = req.body; // tipe: 'masuk' atau 'keluar'
  if (!id_sparepart || !tipe || typeof jumlah !== 'number') {
    return res.status(400).json({ error: 'id_sparepart, tipe, dan jumlah wajib diisi' });
  }

  // Ambil data sparepart
  const { data: sparepart, error: sparepartError } = await supabase.from('sparepart').select('*').eq('id_sparepart', id_sparepart).single();
  if (sparepartError || !sparepart) {
    return res.status(404).json({ error: 'Sparepart tidak ditemukan' });
  }

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
  } else {
    return res.status(400).json({ error: 'Tipe transaksi tidak valid' });
  }

  // Update sparepart
  const { error: updateError } = await supabase.from('sparepart').update({
    jumlah: newJumlah,
    terjual: newTerjual,
    sisa: newSisa
  }).eq('id_sparepart', id_sparepart);

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  res.json({ message: 'Sparepart berhasil diupdate', jumlah: newJumlah, terjual: newTerjual, sisa: newSisa });
};

// Statistik penjualan dan stok semua sparepart
export const getSparepartStatistik = async (req, res) => {
  const { data: spareparts, error } = await supabase.from('sparepart').select('id_sparepart, nama_barang, jumlah, terjual, sisa, harga_modal, harga_jual');
  if (error) return res.status(500).json({ error: error.message });

  // Statistik summary
  const totalSparepart = spareparts.length;
  const totalStok = spareparts.reduce((sum, sp) => sum + (sp.jumlah || 0), 0);
  const totalTerjual = spareparts.reduce((sum, sp) => sum + (sp.terjual || 0), 0);
  const totalSisa = spareparts.reduce((sum, sp) => sum + (sp.sisa || 0), 0);
  const totalModal = spareparts.reduce((sum, sp) => sum + ((sp.jumlah || 0) * (sp.harga_modal || 0)), 0);
  const totalJual = spareparts.reduce((sum, sp) => sum + ((sp.terjual || 0) * (sp.harga_jual || 0)), 0);

  res.json({
    total_sparepart: totalSparepart,
    total_stok: totalStok,
    total_terjual: totalTerjual,
    total_sisa: totalSisa,
    total_modal: totalModal,
    total_jual: totalJual,
    detail: spareparts
  });
};

// Riwayat transaksi per sparepart
export const getRiwayatTransaksiSparepart = async (req, res) => {
  const { id_sparepart } = req.params;
  if (!id_sparepart) return res.status(400).json({ error: 'id_sparepart wajib diisi' });

  // Ambil transaksi berdasarkan id_sparepart
  const { data: transaksi, error } = await supabase
    .from('transaksi')
    .select('id_transaksi, tipe, jumlah, tanggal, keterangan')
    .eq('id_sparepart', id_sparepart)
    .order('tanggal', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(transaksi);
};

// Filter/Search sparepart berdasarkan nama, kategori, merek
export const searchSparepart = async (req, res) => {
  const { nama, kategori, merek } = req.query;
  let query = supabase.from('sparepart').select('*');

  if (nama) {
    query = query.ilike('nama_barang', `%${nama}%`);
  }
  if (kategori) {
    query = query.eq('id_kategori_barang', kategori);
  }
  if (merek) {
    query = query.eq('id_merek', merek);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Notifikasi stok rendah
export const getSparepartStokRendah = async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 5; // default ambil 5 jika tidak diisi
  const { data, error } = await supabase
    .from('sparepart')
    .select('id_sparepart, nama_barang, sisa, jumlah, id_kategori_barang, id_merek')
    .lte('sisa', threshold);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ threshold, sparepart_stok_rendah: data });
};

// Export data sparepart ke CSV, dapat difilter per tanggal
export const exportSparepartToCSV = async (req, res) => {
  const { start, end } = req.query;
  let query = supabase.from('sparepart').select('*');

  // Filter berdasarkan tanggal (misal tanggal dibuat/diupdate)
  if (start) {
    query = query.gte('created_at', start);
  }
  if (end) {
    query = query.lte('created_at', end);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  try {
    const csv = await json2csv(data);
    res.header('Content-Type', 'text/csv');
    res.attachment('sparepart_export.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Gagal konversi CSV: ' + err.message });
  }
};

// Export data sparepart ke Excel multi-sheet (per merek, per kategori)
export const exportSparepartToExcel = async (req, res) => {
  // Ambil semua sparepart beserta relasi merek dan kategori
  const { data: spareparts, error } = await supabase
    .from('sparepart')
    .select('nama_barang, jumlah, terjual, sisa, merek(id_merek, nama_merek), kategori_barang(id_kategori_barang, nama_kategori)');
  if (error) return res.status(500).json({ error: error.message });

  // Kelompokkan berdasarkan merek
  const merekMap = {};
  for (const sp of spareparts) {
    const merek = sp.merek?.nama_merek || 'Tanpa Merek';
    if (!merekMap[merek]) merekMap[merek] = [];
    merekMap[merek].push(sp);
  }

  // Buat workbook Excel
  const workbook = new ExcelJS.Workbook();

  for (const [merek, items] of Object.entries(merekMap)) {
    // Sheet per merek
    const sheet = workbook.addWorksheet(merek);
    sheet.columns = [
      { header: 'Kategori', key: 'kategori', width: 20 },
      { header: 'Nama Barang', key: 'nama_barang', width: 30 },
      { header: 'Stok', key: 'jumlah', width: 10 },
      { header: 'Terjual', key: 'terjual', width: 10 },
      { header: 'Sisa', key: 'sisa', width: 10 },
    ];

    // Kelompokkan per kategori
    const kategoriMap = {};
    for (const item of items) {
      const kategori = item.kategori_barang?.nama_kategori || 'Tanpa Kategori';
      if (!kategoriMap[kategori]) kategoriMap[kategori] = [];
      kategoriMap[kategori].push(item);
    }

    // Isi data per kategori
    for (const [kategori, barangList] of Object.entries(kategoriMap)) {
      for (const barang of barangList) {
        sheet.addRow({
          kategori,
          nama_barang: barang.nama_barang,
          jumlah: barang.jumlah,
          terjual: barang.terjual,
          sisa: barang.sisa,
        });
      }
      // Tambahkan baris kosong antar kategori
      sheet.addRow({});
    }
  }

  // Generate file Excel dan kirim sebagai attachment
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=sparepart_export.xlsx');
  await workbook.xlsx.write(res);
  res.end();
};
