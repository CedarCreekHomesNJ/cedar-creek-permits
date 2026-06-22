// api/descriptions.js
const { supabase } = require('../lib/supabase');
const { randomUUID } = require('crypto');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('descriptions').select('*').order('created_at');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const item = {
      id: body.id || 'desc_' + randomUUID().slice(0, 8),
      text: body.text,
    };
    const { error } = await supabase.from('descriptions').upsert(item);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(item);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
