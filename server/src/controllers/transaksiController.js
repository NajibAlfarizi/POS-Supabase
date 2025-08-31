import supabase from '../config/supabase.js';
import { json2csv } from 'json-2-csv';
import ExcelJS from 'exceljs'
// Ringkasan transaksi (harian, mingguan, bulanan, filter kategori/metode bayar)
export const getRingkasanTransaksi = async (req, res) => {
  const { tipe, kategori, metode_bayar, tanggal_mulai, tanggal_selesai } = req.query;
  let query = supabase.from('transaksi').select('total_harga, id_kategori, metode_bayar, tanggal, tipe');

  if (tipe) {
    query = query.eq('tipe', tipe);
  }
  if (kategori) {
    query = query.eq('id_kategori', kategori);
  }
  if (metode_bayar) {
    query = query.eq('metode_bayar', metode_bayar);
  }
  if (tanggal_mulai && tanggal_selesai) {
    query = query.gte('tanggal', tanggal_mulai).lte('tanggal', tanggal_selesai);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  let total = 0;
  let cashflow = 0;
  let transaksi_hari_ini = 0;
  const today = new Date().toISOString().slice(0, 10);
  if (data && data.length > 0) {
    total = data.reduce((sum, trx) => sum + Number(trx.total_harga), 0);
    cashflow = data.reduce((sum, trx) => {
      if (trx.tipe === 'masuk') return sum + Number(trx.total_harga);
      if (trx.tipe === 'keluar') return sum - Number(trx.total_harga);
      return sum;
    }, 0);
    transaksi_hari_ini = data.filter(trx => trx.tanggal && trx.tanggal.slice(0, 10) === today).length;
  }

  res.json({
    tipe: tipe || 'all',
    kategori: kategori || null,
    metode_bayar: metode_bayar || null,
    tanggal_mulai: tanggal_mulai || null,
    tanggal_selesai: tanggal_selesai || null,
    total_transaksi: total,
    jumlah_transaksi: data ? data.length : 0,
    hari_ini: transaksi_hari_ini,
    cashflow
  });
};
// Ambil data struk transaksi by id (JSON siap cetak)
export const getStrukTransaksi = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'ID transaksi tidak valid.' });
  }
  // Ambil detail transaksi, join kategori dan user
  const { data, error } = await supabase
    .from('transaksi')
    .select('*, kategori(nama_kategori), user_profiles(name)')
    .eq('id_transaksi', id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });

  // Data struk
  const struk = {
    toko: 'ChiCha Mobile', // Ganti sesuai nama toko
    tanggal: data.tanggal,
    kasir: data.user_profiles?.name || '-',
    kategori: data.kategori?.nama_kategori || '-',
    total: data.total_harga,
    metode_bayar: data.metode_bayar,
    keterangan: data.keterangan,
    id_transaksi: data.id_transaksi
  };
  res.json(struk);
};

// Ambil semua transaksi (dengan filter opsional)
export const getTransaksi = async (req, res) => {
  const { kategori, user_id, tanggal_mulai, tanggal_selesai, search, tipe } = req.query;
  let query = supabase
    .from('transaksi')
    .select('*, kategori(nama_kategori), user_profiles(name)');

  if (tipe) {
    query = query.eq('tipe', tipe);
  }
  if (kategori) {
    query = query.eq('id_kategori', kategori);
  }
  if (user_id) {
    query = query.eq('id_user', user_id);
  }
  if (tanggal_mulai && tanggal_selesai) {
    query = query.gte('tanggal', tanggal_mulai).lte('tanggal', tanggal_selesai);
  }
  if (search && typeof search === 'string' && search.length > 1) {
    query = query.ilike('keterangan', `%${search}%`);
  }

  const { data, error } = await query.order('tanggal', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Export transaksi as CSV (with same filters as getTransaksi)
export const exportTransaksiCSV = async (req, res) => {
  const { kategori, user_id, tanggal_mulai, tanggal_selesai, search, metode_bayar, tipe } = req.query;
  let query = supabase.from('transaksi').select('id_transaksi, keterangan, total_harga, metode_bayar, tanggal, kategori(nama_kategori), user_profiles(name), tipe');
  if (tipe) query = query.eq('tipe', tipe);
  if (kategori) query = query.eq('id_kategori', kategori);
  if (user_id) query = query.eq('id_user', user_id);
  if (metode_bayar) query = query.eq('metode_bayar', metode_bayar);
  if (tanggal_mulai && tanggal_selesai) query = query.gte('tanggal', tanggal_mulai).lte('tanggal', tanggal_selesai);
  if (search && search.length > 1) query = query.ilike('keterangan', `%${search}%`);

  const { data, error } = await query.order('tanggal', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  // Map to desired columns
  const mapped = (data || []).map(trx => ({
    id_transaksi: trx.id_transaksi,
    oleh: trx.user_profiles?.name || '',
    kategori: trx.kategori?.nama_kategori || '',
    keterangan: trx.keterangan,
    total_harga: trx.total_harga,
    metode_bayar: trx.metode_bayar,
    tanggal: trx.tanggal,
    tipe: trx.tipe
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

// Export transaksi as Excel (XLSX)
export const exportTransaksiExcel = async (req, res) => {
  const { kategori, user_id, tanggal_mulai, tanggal_selesai, search, metode_bayar, tipe } = req.query;
  let query = supabase.from('transaksi').select('id_transaksi, keterangan, total_harga, metode_bayar, tanggal, kategori(nama_kategori), user_profiles(name), tipe');
  if (tipe) query = query.eq('tipe', tipe);
  if (kategori) query = query.eq('id_kategori', kategori);
  if (user_id) query = query.eq('id_user', user_id);
  if (metode_bayar) query = query.eq('metode_bayar', metode_bayar);
  if (tanggal_mulai && tanggal_selesai) query = query.gte('tanggal', tanggal_mulai).lte('tanggal', tanggal_selesai);
  if (search && search.length > 1) query = query.ilike('keterangan', `%${search}%`);

  const { data, error } = await query.order('tanggal', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  // Map to desired columns
  const mapped = (data || []).map(trx => ({
    id_transaksi: trx.id_transaksi,
    oleh: trx.user_profiles?.name || '',
    kategori: trx.kategori?.nama_kategori || '',
    keterangan: trx.keterangan,
    total_harga: trx.total_harga,
    metode_bayar: trx.metode_bayar,
    tanggal: trx.tanggal,
    tipe: trx.tipe
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

// Ambil detail transaksi by id (join kategori dan user)
export const getDetailTransaksi = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'ID transaksi tidak valid.' });
  }
  const { data, error } = await supabase
    .from('transaksi')
    .select('*, kategori(nama_kategori), user_profiles(name)')
    .eq('id_transaksi', id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
  res.json(data);
};

// Tambah transaksi umum
export const addTransaksi = async (req, res) => {
  const { id_kategori, keterangan, total_harga, metode_bayar, tipe, id_inventaris, jumlah } = req.body;
  const user_id = req.user?.id;

  // Validasi input
  if (!id_kategori || !total_harga || !metode_bayar || !tipe) {
    return res.status(400).json({ error: 'id_kategori, total_harga, metode_bayar, dan tipe wajib diisi.' });
  }
  if (!['masuk', 'keluar'].includes(tipe)) {
    return res.status(400).json({ error: 'tipe harus "masuk" atau "keluar".' });
  }

  // Cek kategori: jika barang/inventaris, update stok
  let stokUpdated = false;
  let stokError = null;
  let stokRiwayat = null;
  // Asumsi kategori barang/inventaris id_kategori = 'barang' atau bisa cek dari DB
  // Ganti logika ini sesuai kebutuhan, misal cek nama_kategori dari tabel kategori
  const { data: kategoriData, error: kategoriError } = await supabase
    .from('kategori')
    .select('nama_kategori, tipe')
    .eq('id_kategori', id_kategori)
    .single();
  if (kategoriError) {
    return res.status(400).json({ error: 'Kategori tidak ditemukan.' });
  }

  // Jika kategori barang/inventaris, update stok
  if (kategoriData && kategoriData.tipe === 'barang' && id_inventaris && jumlah) {
    // Update stok inventaris
    const { data: inventaris, error: invError } = await supabase
      .from('inventaris')
      .select('stok')
      .eq('id_inventaris', id_inventaris)
      .single();
    if (invError || !inventaris) {
      stokError = 'Inventaris tidak ditemukan.';
    } else {
      let newStok = tipe === 'masuk' ? inventaris.stok + jumlah : inventaris.stok - jumlah;
      if (tipe === 'keluar' && inventaris.stok < jumlah) {
        stokError = 'Stok tidak mencukupi.';
      } else {
        const { error: updateError } = await supabase
          .from('inventaris')
          .update({ stok: newStok })
          .eq('id_inventaris', id_inventaris);
        if (updateError) {
          stokError = updateError.message;
        } else {
          stokUpdated = true;
          // Catat riwayat stok
          const { error: riwayatError } = await supabase
            .from('riwayat_stok')
            .insert({
              id_inventaris,
              tipe_transaksi: tipe,
              jumlah,
              keterangan,
              user_id
            });
          if (riwayatError) stokRiwayat = riwayatError.message;
        }
      }
    }
  }

  if (stokError) {
    return res.status(400).json({ error: stokError });
  }

  // Simpan transaksi
  const { data, error } = await supabase
    .from('transaksi')
    .insert({
      id_user: user_id,
      id_kategori,
      keterangan,
      total_harga,
      metode_bayar,
      tipe
      // tanggal otomatis
    })
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json({ ...data[0], stokUpdated, stokRiwayat });
};

// Laporan transaksi detail (group by kategori & metode_bayar, period filter)
export const getLaporanTransaksi = async (req, res) => {
  const { tipe, tanggal_mulai, tanggal_selesai } = req.query;
  let startDate = tanggal_mulai;
  let endDate = tanggal_selesai;
  const now = new Date();

  // Logika grouping otomatis
  if (!tanggal_mulai && !tanggal_selesai && tipe) {
    if (tipe === 'harian') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (tipe === 'mingguan') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      startDate = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate());
      endDate = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + 7);
    } else if (tipe === 'bulanan') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
    startDate = startDate.toISOString().slice(0, 10);
    endDate = endDate.toISOString().slice(0, 10);
  }

  let query = supabase.from('transaksi').select('id_transaksi, keterangan, total_harga, metode_bayar, tanggal, kategori(nama_kategori), user_profiles(name)');
  if (startDate && endDate) {
    query = query.gte('tanggal', startDate).lte('tanggal', endDate);
  }

  const { data, error } = await query.order('tanggal', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  // Group by kategori & metode_bayar, flatten for frontend
  const laporanArr = [];
  const groupMap = {};
  (data || []).forEach(trx => {
    const kategori = trx.kategori?.nama_kategori || 'Lainnya';
    const metode = trx.metode_bayar || 'Lainnya';
    const key = kategori + '|' + metode;
    if (!groupMap[key]) {
      groupMap[key] = { kategori, metode_bayar: metode, total: 0, jumlah: 0 };
    }
    groupMap[key].total += Number(trx.total_harga);
    groupMap[key].jumlah += 1;
  });
  for (const key in groupMap) {
    laporanArr.push(groupMap[key]);
  }

  res.json(laporanArr);
};