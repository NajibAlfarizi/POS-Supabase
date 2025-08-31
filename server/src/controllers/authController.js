import supabase from '../config/supabase.js';

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi.' });
  }

  // Supabase Auth signIn
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return res.status(401).json({ error: error.message });
  }

  // Ambil data profile user
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, name, role, status')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    return res.status(500).json({ error: profileError.message });
  }

  res.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: profile.name,
      role: profile.role,
      status: profile.status
    },
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });
};

// Owner: Tambah Admin
export const addAdmin = async (req, res) => {
  const { email, password, name } = req.body;
  // Validasi field wajib
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, dan nama wajib diisi.' });
  }

  // Validasi format email
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Format email tidak valid.' });
  }

  // Validasi kekuatan password (minimal 8 karakter)
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password minimal 8 karakter.' });
  }

  // Cek apakah email sudah terdaftar di Supabase Auth
  const { data: existingUser, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    return res.status(500).json({ error: 'Gagal cek email.' });
  }
  const found = existingUser.users.find(u => u.email === email);
  if (found) {
    return res.status(400).json({ error: 'Email sudah terdaftar.' });
  }

  // Register user baru via Supabase Auth
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Tambahkan data ke user_profiles dengan role admin
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: data.user.id,
      name,
      role: 'admin',
      status: 'active'
    });

  if (profileError) {
    return res.status(500).json({ error: profileError.message });
  }

  res.json({ message: 'Admin berhasil ditambahkan', userId: data.user.id });
};

// Refresh token
export const refreshToken = async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token wajib diisi.' });
  }

  // Supabase Auth refresh session
  const { data, error } = await supabase.auth.refreshSession({ refresh_token });
  if (error) {
    return res.status(401).json({ error: error.message });
  }

  // Ambil data profile user
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, name, role, status')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    return res.status(500).json({ error: profileError.message });
  }

  res.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: profile.name,
      role: profile.role,
      status: profile.status
    },
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });
};