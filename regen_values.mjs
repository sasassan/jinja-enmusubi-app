import fs from 'fs';
const rows = JSON.parse(fs.readFileSync('/workspace/神社アプリ/insert_batches.json','utf8'));
function parse(sql) {
  const flat = sql.replace(/\s+/g, ' ');
  const re = /SELECT '([^']*)', '([^']*)', p\.id, '([^']*)', '([^']*)', true, ST_SetSRID\(ST_MakePoint\(([-\d.]+), ([-\d.]+)\), 4326\) FROM prefectures p WHERE p\.name = '([^']*)'/g;
  const out = [];
  let m;
  while ((m = re.exec(flat)) !== null) {
    out.push({name:m[1],slug:m[2],address:m[3],founding:m[4],lng:m[5],lat:m[6],pref:m[7]});
  }
  return out;
}
const all = [];
for (const s of rows) all.push(...parse(s));
function esc(str) { return String(str).replace(/'/g, "''"); }
function makeStmt(chunk) {
  const vals = chunk.map(r =>
    `('${esc(r.name)}', '${esc(r.slug)}', '${esc(r.address)}', '${esc(r.founding)}', ${r.lng}, ${r.lat}, '${esc(r.pref)}')`
  ).join(',');
  return `WITH p AS (SELECT id,name FROM prefectures) INSERT INTO shrines (name, slug, prefecture_id, address, founding_description, is_published, location) SELECT v.name, v.slug, p.id, v.address, v.founding, true, ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326) FROM (VALUES ${vals}) AS v(name, slug, address, founding, lng, lat, prefecture_name) JOIN p ON p.name = v.prefecture_name ON CONFLICT (slug) DO NOTHING;`;
}
const chunkSize = 250;
const chunks = [];
for (let i = 0; i < all.length; i += chunkSize) chunks.push(makeStmt(all.slice(i, i+chunkSize)));
fs.writeFileSync('/workspace/神社アプリ/insert_values_batches.json', JSON.stringify(chunks, null, 2));
fs.mkdirSync('/workspace/神社アプリ/values_stmts', {recursive:true});
for (let i = 0; i < chunks.length; i++) {
  fs.writeFileSync(`/workspace/神社アプリ/values_stmts/stmt_${i}.sql`, chunks[i].replace(/\s+/g, ' '));
}
console.log(JSON.stringify({rows:all.length, stmts:chunks.length, firstLen:chunks[0]?.length, lastLen:chunks.at(-1)?.length}));
