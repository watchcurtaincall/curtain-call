const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2];
  return acc;
}, {});

const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function migrateAll() {
  console.log('Migrating artists...');
  const { data: artists } = await s.from('artists').select('id, profile_picture_url, gallery_images');
  for (const a of artists || []) {
    let updated = false;
    let newPic = a.profile_picture_url;
    let newGallery = [...(a.gallery_images || [])];

    if (newPic && newPic.startsWith('data:image/')) {
      const base64Data = newPic.replace(/^data:image\/\w+;base64,/, '');
      const mimeType = newPic.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
      const buffer = Buffer.from(base64Data, 'base64');
      const uniqueFilename = `artist-pic-${a.id}-${Date.now()}.jpg`;
      const { data: upData, error } = await s.storage.from('curtain-call-images').upload(uniqueFilename, buffer, { contentType: mimeType, upsert: true });
      if (!error) {
        newPic = s.storage.from('curtain-call-images').getPublicUrl(upData.path).data.publicUrl;
        updated = true;
      }
    }

    for (let i = 0; i < newGallery.length; i++) {
      if (typeof newGallery[i] === 'string' && newGallery[i].startsWith('data:image/')) {
        const base64Data = newGallery[i].replace(/^data:image\/\w+;base64,/, '');
        const mimeType = newGallery[i].match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
        const buffer = Buffer.from(base64Data, 'base64');
        const uniqueFilename = `artist-gal-${a.id}-${i}-${Date.now()}.jpg`;
        const { data: upData, error } = await s.storage.from('curtain-call-images').upload(uniqueFilename, buffer, { contentType: mimeType, upsert: true });
        if (!error) {
          newGallery[i] = s.storage.from('curtain-call-images').getPublicUrl(upData.path).data.publicUrl;
          updated = true;
        }
      }
    }
    if (updated) await s.from('artists').update({ profile_picture_url: newPic, gallery_images: newGallery }).eq('id', a.id);
  }

  console.log('Migrating articles...');
  const { data: articles } = await s.from('articles').select('id, cover_image');
  for (const a of articles || []) {
    let updated = false;
    let newCover = a.cover_image;

    if (newCover && newCover.startsWith('data:image/')) {
      const base64Data = newCover.replace(/^data:image\/\w+;base64,/, '');
      const mimeType = newCover.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
      const buffer = Buffer.from(base64Data, 'base64');
      const uniqueFilename = `article-${a.id}-${Date.now()}.jpg`;
      const { data: upData, error } = await s.storage.from('curtain-call-images').upload(uniqueFilename, buffer, { contentType: mimeType, upsert: true });
      if (!error) {
        newCover = s.storage.from('curtain-call-images').getPublicUrl(upData.path).data.publicUrl;
        updated = true;
      }
    }
    if (updated) await s.from('articles').update({ cover_image: newCover }).eq('id', a.id);
  }
  console.log('Done migrating additional tables!');
}

migrateAll();
