import fs from 'fs';

const rowsAll = JSON.parse(fs.readFileSync('/workspace/神社アプリ/insert_batches.json','utf8'));
function parse(sql) {
  const flat = sql.replace(/\s+/g, ' ');
  const re = /SELECT '([^']*)', '([^']*)', p\.id, '([^']*)', '([^']*)', true, ST_SetSRID\(ST_MakePoint\(([-\d.]+), ([-\d.]+)\), 4326\) FROM prefectures p WHERE p\.name = '([^']*)'/g;
  const out = [];
  let m;
  while ((m = re.exec(flat)) !== null) {
    out.push({name:m[1],slug:m[2],address:m[3],founding:m[4],lng:Number(m[5]),lat:Number(m[6]),pref:m[7]});
  }
  return out;
}
const rows = [];
for (const s of rowsAll) rows.push(...parse(s));
console.error('total candidate rows', rows.length);

const url = 'https://supabase-api-prod.verdent.ai/p/p8b6a94bfa5b22a03d9b8/rest/v1/rpc/insert_shrine_rows';
const key = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMTA0NDAwNDcxLCJpYXQiOjE3ODg3ODEyNzEsImlzcyI6InN1cGFiYXNlIiwicHJvamVjdF9yZWYiOiJwOGI2YTk0YmZhNWIyMmEwM2Q5YjgiLCJyb2xlIjoiYW5vbiJ9.9jvzr3qJ3qR3ItSicAK9EnWESq-SXUllvhomMmLsjig';
const chunkSize = 200;
let inserted = 0;
let chunks = 0;
for (let i = 0; i < rows.length; i += chunkSize) {
  const chunk = rows.slice(i, i+chunkSize);
  const body = {
    p_names: chunk.map(r=>r.name),
    p_slugs: chunk.map(r=>r.slug),
    p_prefecture_names: chunk.map(r=>r.pref),
    p_addresses: chunk.map(r=>r.address),
    p_foundings: chunk.map(r=>r.founding),
    p_lngs: chunk.map(r=>r.lng),
    p_lats: chunk.map(r=>r.lat),
  };
  const bodyStr = JSON.stringify(body);
  let attempts = 0;
  while (true) {
    attempts++;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: bodyStr,
    });
    if (res.ok) {
      inserted += chunk.length;
      chunks++;
      console.error(`chunk ${chunks} (${chunk.length} rows) ok, total sent ${inserted}`);
      break;
    }
    const txt = await res.text();
    if (attempts >= 3) {
      console.error('chunk failed', chunks+1, res.status, txt.slice(0,500));
      throw new Error('chunk failed');
    }
    console.error(`retry ${attempts} for chunk ${chunks+1}: ${res.status} ${txt.slice(0,200)}`);
    await new Promise(r=>setTimeout(r, 1000*attempts));
  }
  await new Promise(r=>setTimeout(r, 100));
}
console.log(JSON.stringify({chunks, inserted}));
