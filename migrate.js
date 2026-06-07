const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2];
  return acc;
}, {});

const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
  const { data: productions, error } = await s.from('productions').select('id, poster_url, gallery_images');
  if (error) return console.error('Query error:', error);

  console.log(`Found ${productions.length} productions`);

  for (const p of productions) {
    let updated = false;
    let newPosterUrl = p.poster_url;
    let newGallery = [...(p.gallery_images || [])];

    // Migrate poster_url
    if (newPosterUrl && newPosterUrl.startsWith('data:image/')) {
      console.log(`Migrating poster for ${p.id}...`);
      const base64Data = newPosterUrl.replace(/^data:image\/\w+;base64,/, '');
      const mimeMatch = newPosterUrl.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const buffer = Buffer.from(base64Data, 'base64');
      const uniqueFilename = `poster-${p.id}-${Date.now()}.jpg`;
      
      const { data: upData, error: upError } = await s.storage.from('curtain-call-images').upload(uniqueFilename, buffer, { contentType: mimeType, upsert: true });
      if (upError) {
        console.error(`Failed poster ${p.id}:`, upError.message);
      } else {
        const { data: { publicUrl } } = s.storage.from('curtain-call-images').getPublicUrl(upData.path);
        newPosterUrl = publicUrl;
        updated = true;
      }
    }

    // Migrate gallery_images
    for (let i = 0; i < newGallery.length; i++) {
      const item = newGallery[i];
      if (typeof item === 'string' && item.startsWith('data:image/')) {
        console.log(`Migrating gallery image ${i} for ${p.id}...`);
        const base64Data = item.replace(/^data:image\/\w+;base64,/, '');
        const mimeMatch = item.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const buffer = Buffer.from(base64Data, 'base64');
        const uniqueFilename = `gallery-${p.id}-${i}-${Date.now()}.jpg`;
        
        const { data: upData, error: upError } = await s.storage.from('curtain-call-images').upload(uniqueFilename, buffer, { contentType: mimeType, upsert: true });
        if (upError) {
          console.error(`Failed gallery ${p.id}[${i}]:`, upError.message);
        } else {
          const { data: { publicUrl } } = s.storage.from('curtain-call-images').getPublicUrl(upData.path);
          newGallery[i] = publicUrl;
          updated = true;
        }
      }
    }

    if (updated) {
      console.log(`Saving updates for ${p.id}...`);
      await s.from('productions').update({ poster_url: newPosterUrl, gallery_images: newGallery }).eq('id', p.id);
    }
  }
  
  console.log('Migration complete!');
}

migrate();
