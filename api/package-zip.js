// api/package-zip.js
// Bundles several already-generated filled PDFs (in the permit-filled
// bucket) into one zip and returns a public URL to it.
const { supabase } = require('../lib/supabase');
const { randomUUID } = require('crypto');
const archiver = require('archiver');
const { PassThrough } = require('stream');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { files } = req.body || {}; // [{ filename, form_name }]
    if (!files || !files.length) return res.status(400).json({ error: 'No files provided' });

    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks = [];
    const passthrough = new PassThrough();
    passthrough.on('data', (chunk) => chunks.push(chunk));

    const donePromise = new Promise((resolve, reject) => {
      passthrough.on('end', resolve);
      passthrough.on('error', reject);
      archive.on('error', reject);
    });

    archive.pipe(passthrough);

    for (const f of files) {
      const { data: blob, error } = await supabase.storage.from('permit-filled').download(f.filename);
      if (error) continue;
      const buf = Buffer.from(await blob.arrayBuffer());
      const safeName = (f.form_name || 'permit').replace(/[^a-zA-Z0-9 \-_]/g, '').trim() || 'permit';
      archive.append(buf, { name: `${safeName}.pdf` });
    }

    await archive.finalize();
    await donePromise;

    const zipBuffer = Buffer.concat(chunks);
    const outName = `${randomUUID()}.zip`;

    const { error: upErr } = await supabase.storage
      .from('permit-filled')
      .upload(outName, zipBuffer, { contentType: 'application/zip' });
    if (upErr) return res.status(500).json({ error: 'Could not save zip: ' + upErr.message });

    const { data: urlData } = supabase.storage.from('permit-filled').getPublicUrl(outName);
    return res.status(200).json({ ok: true, url: urlData.publicUrl });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
