-- Seed data for 神社御縁: shrines, deities, lineages, benefits, and their
-- verifiable sources, mirroring src/lib/demo-data.ts. Idempotent: safe to
-- re-run (uses ON CONFLICT / NOT EXISTS guards).

-- 1. Prefectures -------------------------------------------------------
insert into public.prefectures (name, slug) values
  ('福岡県', 'fukuoka'),
  ('佐賀県', 'saga'),
  ('長崎県', 'nagasaki')
on conflict (slug) do nothing;

-- 2. Deities -------------------------------------------------------------
insert into public.deities (name, slug, is_published) values
  ('菅原道真公', 'sugawara-no-michizane', true),
  ('大幡主大神', 'ohatanushi-no-okami', true),
  ('天照皇大神', 'amaterasu-sume-okami', true),
  ('素盞嗚大神', 'susanoo-no-okami', true),
  ('倉稲魂大神', 'ukanomitama-no-okami', true),
  ('大宮売大神', 'oomiyanome-no-okami', true),
  ('猿田彦大神', 'sarutahiko-no-okami', true),
  ('建御名方神', 'takeminakata-no-kami', true),
  ('八坂刀売神', 'yasakatome-no-kami', true),
  ('住吉大神', 'sumiyoshi-no-okami', true)
on conflict (slug) do nothing;

-- 3. Lineages --------------------------------------------------------------
insert into public.lineages (name, slug, is_published) values
  ('天神信仰', 'tenjin-shinko', true),
  ('祇園信仰', 'gion-shinko', true),
  ('稲荷信仰', 'inari-shinko', true),
  ('諏訪信仰', 'suwa-shinko', true),
  ('住吉信仰', 'sumiyoshi-shinko', true)
on conflict (slug) do nothing;

-- 4. Benefits --------------------------------------------------------------
insert into public.benefits (name, slug, is_published) values
  ('学業成就', 'gakugyo-joju', true),
  ('厄除け', 'yakuyoke', true),
  ('良縁', 'ryoen', true),
  ('商売繁盛', 'shobai-hanjo', true),
  ('不老長寿', 'furo-choju', true),
  ('家内安全', 'kanai-anzen', true),
  ('交通安全', 'kotsu-anzen', true)
on conflict (slug) do nothing;

-- 5. Shrines -----------------------------------------------------------
insert into public.shrines
  (name, reading, slug, prefecture_id, address, location, official_url,
   founding_description, history, is_published)
values
  ('太宰府天満宮', 'だざいふてんまんぐう', 'dazaifu-tenmangu',
   (select id from public.prefectures where slug = 'fukuoka'),
   '福岡県太宰府市宰府4丁目7番1号',
   st_setsrid(st_makepoint(130.5352, 33.5216), 4326)::geography,
   'https://www.dazaifutenmangu.or.jp/',
   '延喜19年（919年）',
   '菅原道真公の御墓所の上に社殿を造営したことに始まると伝えられます。千年以上にわたり、学問・文化の神様として多くの人々から信仰を集めています。',
   true),
  ('櫛田神社', 'くしだじんじゃ', 'kushida-jinja',
   (select id from public.prefectures where slug = 'fukuoka'),
   '福岡県福岡市博多区上川端町1-41',
   st_setsrid(st_makepoint(130.4105, 33.5929), 4326)::geography,
   'https://hakatanomiryoku.com/spot/%E6%AB%9B%E7%94%B0%E7%A5%9E%E7%A4%BE/',
   '天平宝字元年（757年）と伝えられる',
   '博多の総鎮守として親しまれ、博多祇園山笠でも知られる神社です。社伝では天平宝字元年に伊勢国松阪の櫛田神社を勧請したと伝えられます。',
   true),
  ('祐徳稲荷神社', 'ゆうとくいなりじんじゃ', 'yutoku-inari',
   (select id from public.prefectures where slug = 'saga'),
   '佐賀県鹿島市古枝乙1855',
   st_setsrid(st_makepoint(130.1004, 33.0681), 4326)::geography,
   'https://www.yutoku.jp/',
   '貞享4年（1687年）',
   '鹿島藩主鍋島家の夫人萬子媛が、京都の稲荷大神を勧請したことに始まると伝えられます。山腹に建つ本殿は、地域の景観を形づくる社殿として知られます。',
   true),
  ('鎮西大社 諏訪神社', 'ちんぜいたいしゃ すわじんじゃ', 'suwa-jinja',
   (select id from public.prefectures where slug = 'nagasaki'),
   '長崎県長崎市上西山町18-15',
   st_setsrid(st_makepoint(129.8843, 32.7569), 4326)::geography,
   'https://www.osuwasan.jp/',
   '寛永2年（1625年）',
   '長崎の氏神として親しまれる神社です。寛永2年、長崎奉行長谷川権六が諏訪・森崎・住吉の三社を勧請したことに始まると伝えられます。',
   true)
on conflict (slug) do nothing;

-- 6. Sources (one authoritative source per shrine, mirrors demo-data.ts) --
insert into public.sources (name, url, source_type, last_verified_at)
select v.name, v.url, v.source_type::public.source_type, v.last_verified_at
from (values
  ('太宰府天満宮 公式サイト', 'https://www.dazaifutenmangu.or.jp/', 'official_site', date '2026-09-07'),
  ('櫛田神社 公式サイト', 'https://hakatanomiryoku.com/spot/%E6%AB%9B%E7%94%B0%E7%A5%9E%E7%A4%BE/', 'official_site', date '2026-09-07'),
  ('祐徳稲荷神社 公式サイト', 'https://www.yutoku.jp/', 'official_site', date '2026-09-07'),
  ('鎮西大社 諏訪神社 公式サイト', 'https://www.osuwasan.jp/', 'official_site', date '2026-09-07')
) as v(name, url, source_type, last_verified_at)
where not exists (
  select 1 from public.sources s where s.name = v.name and s.url = v.url
);

-- 7. Shrine <-> Deity relations -------------------------------------------
insert into public.shrine_deities (shrine_id, deity_id, role, display_order)
select s.id, d.id, 'principal'::public.shrine_deity_role, x.ord
from (values
  ('dazaifu-tenmangu', 'sugawara-no-michizane', 0),
  ('kushida-jinja', 'ohatanushi-no-okami', 0),
  ('kushida-jinja', 'amaterasu-sume-okami', 1),
  ('kushida-jinja', 'susanoo-no-okami', 2),
  ('yutoku-inari', 'ukanomitama-no-okami', 0),
  ('yutoku-inari', 'oomiyanome-no-okami', 1),
  ('yutoku-inari', 'sarutahiko-no-okami', 2),
  ('suwa-jinja', 'takeminakata-no-kami', 0),
  ('suwa-jinja', 'yasakatome-no-kami', 1),
  ('suwa-jinja', 'sumiyoshi-no-okami', 2)
) as x(shrine_slug, deity_slug, ord)
join public.shrines s on s.slug = x.shrine_slug
join public.deities d on d.slug = x.deity_slug
on conflict (shrine_id, deity_id) do nothing;

-- 8. Shrine <-> Lineage relations ------------------------------------------
insert into public.shrine_lineages (shrine_id, lineage_id)
select s.id, l.id
from (values
  ('dazaifu-tenmangu', 'tenjin-shinko'),
  ('kushida-jinja', 'gion-shinko'),
  ('yutoku-inari', 'inari-shinko'),
  ('suwa-jinja', 'suwa-shinko'),
  ('suwa-jinja', 'sumiyoshi-shinko')
) as x(shrine_slug, lineage_slug)
join public.shrines s on s.slug = x.shrine_slug
join public.lineages l on l.slug = x.lineage_slug
on conflict (shrine_id, lineage_id) do nothing;

-- 9. Shrine <-> Benefit relations -------------------------------------------
insert into public.shrine_benefits (shrine_id, benefit_id)
select s.id, b.id
from (values
  ('dazaifu-tenmangu', 'gakugyo-joju'),
  ('dazaifu-tenmangu', 'yakuyoke'),
  ('dazaifu-tenmangu', 'ryoen'),
  ('kushida-jinja', 'shobai-hanjo'),
  ('kushida-jinja', 'furo-choju'),
  ('kushida-jinja', 'yakuyoke'),
  ('yutoku-inari', 'shobai-hanjo'),
  ('yutoku-inari', 'kanai-anzen'),
  ('yutoku-inari', 'kotsu-anzen'),
  ('suwa-jinja', 'yakuyoke'),
  ('suwa-jinja', 'kanai-anzen'),
  ('suwa-jinja', 'kotsu-anzen')
) as x(shrine_slug, benefit_slug)
join public.shrines s on s.slug = x.shrine_slug
join public.benefits b on b.slug = x.benefit_slug
on conflict (shrine_id, benefit_id) do nothing;

-- 10. Shrine <-> Source relations (out-of-line citation for the shrine's
--     history/founding fields) --------------------------------------------
insert into public.shrine_sources (shrine_id, source_id, field_name)
select s.id, so.id, 'history'
from (values
  ('dazaifu-tenmangu', '太宰府天満宮 公式サイト'),
  ('kushida-jinja', '櫛田神社 公式サイト'),
  ('yutoku-inari', '祐徳稲荷神社 公式サイト'),
  ('suwa-jinja', '鎮西大社 諏訪神社 公式サイト')
) as x(shrine_slug, source_name)
join public.shrines s on s.slug = x.shrine_slug
join public.sources so on so.name = x.source_name
on conflict (shrine_id, source_id) do nothing;
