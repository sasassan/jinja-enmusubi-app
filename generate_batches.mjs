import fs from 'fs';

const prefectureMap = {
  '北海道':'Q1037393','青森県':'Q71699','岩手県':'Q48326','宮城県':'Q47896','秋田県':'Q81863',
  '山形県':'Q125863','福島県':'Q71707','茨城県':'Q83273','栃木県':'Q44843','群馬県':'Q129499',
  '埼玉県':'Q128186','千葉県':'Q80011','東京都':'Q1490','神奈川県':'Q127513','新潟県':'Q132705',
  '富山県':'Q132929','石川県':'Q131281','福井県':'Q133879','山梨県':'Q132720','長野県':'Q127877',
  '岐阜県':'Q131277','静岡県':'Q131320','愛知県':'Q80434','三重県':'Q128196','滋賀県':'Q131358',
  '京都府':'Q120730','大阪府':'Q122723','兵庫県':'Q130290','奈良県':'Q131287','和歌山県':'Q131314',
  '鳥取県':'Q133935','島根県':'Q132751','岡山県':'Q132936','広島県':'Q617375','山口県':'Q127264',
  '徳島県':'Q160734','香川県':'Q161454','愛媛県':'Q123376','高知県':'Q134093','福岡県':'Q123258',
  '佐賀県':'Q160420','長崎県':'Q169376','熊本県':'Q130308','大分県':'Q133924','宮崎県':'Q130300',
  '鹿児島県':'Q15701','沖縄県':'Q766445'
};
const prefectureOrder = [
  '鹿児島県','大阪府','宮崎県','兵庫県','静岡県','岡山県','三重県','岐阜県','沖縄県','広島県',
  '山口県','高知県','千葉県','熊本県','滋賀県','島根県','長崎県','大分県','新潟県','愛媛県',
  '鳥取県','香川県','徳島県','佐賀県','青森県','岩手県','埼玉県','長野県','愛知県','茨城県',
  '栃木県','神奈川県','富山県','奈良県','福井県','福島県','石川県','群馬県','京都府','山梨県',
  '東京都','和歌山県','宮城県','秋田県','福岡県','山形県','北海道'
];

function escapeSql(str) {
  if (str == null) return '';
  return String(str).replace(/'/g, "''");
}

function slugify(en, qid) {
  const base = String(en)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base}-${qid}`;
}

function eraDesc(year) {
  if (!year) return '古くからこの地の守護神として祀られてきたと伝えられています';
  const y = Number(year);
  if (Number.isNaN(y)) return '古くからこの地の守護神として祀られてきたと伝えられています';
  if (y < 794) return `古代（${y}年頃）に創建されたと伝えられています`;
  if (y < 1185) return `平安時代（${y}年頃）に創建されたと伝えられています`;
  if (y < 1336) return `鎌倉時代（${y}年頃）に創建されたと伝えられています`;
  if (y < 1573) return `室町時代（${y}年頃）に創建されたと伝えられています`;
  if (y < 1603) return `安土桃山時代（${y}年頃）に創建されたと伝えられています`;
  if (y < 1868) return `江戸時代（${y}年頃）に創建されたと伝えられています`;
  return `${y}年に創建されたと伝えられています`;
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 || res.status >= 500) {
        const delay = 2000 * (i + 1);
        console.error(`retry after ${delay}ms (${res.status})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return res;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw new Error('max retries');
}

async function queryPrefecture(pref) {
  const qid = prefectureMap[pref];
  if (!qid) throw new Error(`No QID for ${pref}`);
  const q = `
SELECT ?item ?nameJa ?nameEn ?coord ?inception (SAMPLE(?muniLabel) AS ?city) WHERE {
  VALUES ?prefecture { wd:${qid} }
  ?item wdt:P31/wdt:P279* wd:Q845945 .
  ?item wdt:P17 wd:Q17 .
  ?item wdt:P625 ?coord .
  ?item wdt:P131 ?muni .
  ?muni wdt:P131 ?prefecture .
  ?item rdfs:label ?nameJa . FILTER(LANG(?nameJa) = "ja")
  ?item rdfs:label ?nameEn . FILTER(LANG(?nameEn) = "en")
  OPTIONAL { ?item wdt:P571 ?inception . }
  OPTIONAL { ?muni rdfs:label ?muniLabel . FILTER(LANG(?muniLabel) = "ja") }
}
GROUP BY ?item ?nameJa ?nameEn ?coord ?inception
ORDER BY ?item
LIMIT 80
`;
  const url = 'https://query.wikidata.org/sparql?query=' + encodeURIComponent(q);
  const res = await fetchWithRetry(url, { headers: { Accept: 'application/sparql-results+json', 'User-Agent': 'VerdentAgent/1.0 (research)' } }, 4);
  if (!res.ok) throw new Error(`${pref}: ${res.status}`);
  const json = await res.json();
  return json.results.bindings.map(b => {
    const uri = b.item.value;
    const qid = uri.split('/').pop().replace(/^Q/, '');
    const m = b.coord.value.match(/Point\(([-\d.]+)\s+([-\d.]+)\)/);
    const lng = m ? Number(m[1]).toFixed(3) : '0';
    const lat = m ? Number(m[2]).toFixed(3) : '0';
    const year = b.inception ? b.inception.value.substring(0,4) : null;
    return {
      name: b.nameJa.value,
      slug: slugify(b.nameEn.value, qid),
      prefecture: pref,
      address: b.city ? b.city.value : pref,
      founding: eraDesc(year),
      lng, lat
    };
  });
}

async function main() {
  const all = [];
  for (const pref of prefectureOrder) {
    try {
      const rows = await queryPrefecture(pref);
      const use = Math.min(rows.length, 80);
      all.push(...rows.slice(0, use));
      console.error(`${pref}: ${rows.length} fetched, using ${use}`);
    } catch (e) {
      console.error('ERROR', pref, e.message);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  const batches = [];
  for (let i = 0; i < all.length; i += 50) {
    const chunk = all.slice(i, i+50);
    const values = chunk.map(r =>
      `SELECT '${escapeSql(r.name)}', '${escapeSql(r.slug)}', p.id, '${escapeSql(r.address)}', '${escapeSql(r.founding)}', true, ST_SetSRID(ST_MakePoint(${r.lng}, ${r.lat}), 4326)\nFROM prefectures p WHERE p.name = '${escapeSql(r.prefecture)}'`
    ).join('\nUNION ALL\n');
    const sql = `INSERT INTO shrines (name, slug, prefecture_id, address, founding_description, is_published, location)\n${values}\nON CONFLICT (slug) DO NOTHING;`;
    batches.push(sql);
  }
  fs.writeFileSync('/workspace/神社アプリ/insert_batches.json', JSON.stringify(batches, null, 2));
  console.log(JSON.stringify({ totalRows: all.length, batches: batches.length }));
}

main().catch(e => { console.error(e); process.exit(1); });
