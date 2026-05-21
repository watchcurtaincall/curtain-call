const https = require('https');

function search(query) {
  return new Promise((resolve) => {
    https.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/<img[^>]+src="([^">]+)"/);
        if (match && match[1]) {
          let url = match[1];
          if (url.startsWith('//')) url = 'https:' + url;
          resolve(url);
        } else {
          resolve('');
        }
      });
    });
  });
}

async function run() {
  const q1 = await search('Motherland the musical bap productions poster filetype:jpg');
  console.log('Motherland:', q1);
  const q2 = await search('Waterside stage play kininso koncepts poster filetype:jpg');
  console.log('Waterside:', q2);
}
run();
