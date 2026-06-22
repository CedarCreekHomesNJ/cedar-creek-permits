// api/profile.js
const { supabase } = require('../lib/supabase');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('profile').select('*').eq('id', 1).single();
    if (error) return res.status(500).json({ error: error.message });
    delete data.id;
    delete data.updated_at;
    return res.status(200).json(data || {});
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const update = { ...body, id: 1, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('profile').upsert(update);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
