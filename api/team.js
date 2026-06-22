// api/team.js
const { supabase } = require('../lib/supabase');
const { randomUUID } = require('crypto');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('team_members').select('*').order('created_at');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const member = {
      id: body.id || 'pm_' + randomUUID().slice(0, 8),
      name: body.name,
      title: body.title || '',
      phone: body.phone || '',
      email: body.email || '',
    };
    const { error } = await supabase.from('team_members').upsert(member);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(member);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
