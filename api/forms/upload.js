// api/forms/upload.js
// Accepts a JSON body (not multipart) with base64-encoded PDF + thumbnail,
// since the browser already has both ready (PDF read as base64, thumbnail
// rendered client-side via pdf.js to a canvas, then exported as PNG).
const { supabase } = require('../../lib/supabase');
const { randomUUID } = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, municipality, pdf_base64, thumb_base64, thumb_w, thumb_h } = req.body || {};
    if (!pdf_base64 || !thumb_base64) {
      return res.status(400).json({ error: 'Missing pdf_base64 or thumb_base64' });
    }

    const fid = randomUUID();
    const pdfFilename = `${fid}.pdf`;
    const thumbFilename = `${fid}_thumb.png`;

    const pdfBuffer = Buffer.from(pdf_base64, 'base64');
    const thumbBuffer = Buffer.from(thumb_base64, 'base64');

    const { error: pdfErr } = await supabase.storage
      .from('permit-uploads')
      .upload(pdfFilename, pdfBuffer, { contentType: 'application/pdf' });
    if (pdfErr) return res.status(500).json({ error: 'PDF upload failed: ' + pdfErr.message });

    const { error: thumbErr } = await supabase.storage
      .from('permit-uploads')
      .upload(thumbFilename, thumbBuffer, { contentType: 'image/png' });
    if (thumbErr) return res.status(500).json({ error: 'Thumbnail upload failed: ' + thumbErr.message });

    const { data: pdfUrlData } = supabase.storage.from('permit-uploads').getPublicUrl(pdfFilename);
    const { data: thumbUrlData } = supabase.storage.from('permit-uploads').getPublicUrl(thumbFilename);

    const formEntry = {
      id: fid,
      name: name || 'Untitled',
      municipality: municipality || '',
      filename: pdfFilename,
      thumb: thumbUrlData.publicUrl,
      thumb_w: thumb_w,
      thumb_h: thumb_h,
    };

    const { error: dbErr } = await supabase.from('forms').insert(formEntry);
    if (dbErr) return res.status(500).json({ error: 'Database insert failed: ' + dbErr.message });

    return res.status(200).json({ ...formEntry, pdf_url: pdfUrlData.publicUrl });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
