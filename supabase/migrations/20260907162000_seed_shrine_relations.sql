-- Phase 1: 神社と神様/系統/御利益/人物/出典の関連付け

-- ============ 御祭神(主祭神/相殿神・配祀神・合祀神の区別) ============
insert into public.shrine_deities (shrine_id, deity_id, role, display_order)
select s.id, d.id, x.role::public.shrine_deity_role, x.disp
from (values
('dazaifu-tenmangu','sugawara-michizane-ko','principal',0),
('kushida-jinja','ohatanushi-no-okami','principal',0),
('kushida-jinja','amaterasu-omikami','co_enshrined',1),
('kushida-jinja','susanoo-no-mikoto','co_enshrined',2),
('yutoku-inari-jinja','ukanomitama-no-kami','principal',0),
('yutoku-inari-jinja','omiyanome-no-okami','co_enshrined',1),
('yutoku-inari-jinja','sarutahiko-no-okami','co_enshrined',2),
('suwa-jinja','takeminakata-no-kami','principal',0),
('suwa-jinja','yasakatome-no-kami','co_enshrined',1),
('suwa-jinja','sumiyoshi-no-okami','associated',2),
('miyajidake-jinja','jingu-kogo','principal',0),
('miyajidake-jinja','katsumura-no-okami','co_enshrined',1),
('miyajidake-jinja','katsuyori-no-okami','co_enshrined',2),
('hakozaki-gu','ojin-tenno-deity','principal',0),
('hakozaki-gu','jingu-kogo','enshrined',1),
('hakozaki-gu','tamayoribime-no-mikoto','enshrined',2),
('munakata-taisha','ichikishimahime-no-kami','principal',0),
('munakata-taisha','tagorihime-no-kami','enshrined',1),
('munakata-taisha','tagitsuhime-no-kami','enshrined',2),
('saga-jinja','nabeshima-naomasa-mikoto','principal',0),
('saga-jinja','nabeshima-naohiro-mikoto','principal',1),
('chiriku-hachimangu','ojin-tenno-deity','principal',0),
('chiriku-hachimangu','chuai-tenno-deity','co_enshrined',1),
('chiriku-hachimangu','jingu-kogo','co_enshrined',2),
('chiriku-hachimangu','takenouchi-no-sukune','enshrined',3),
('chiriku-hachimangu','naniwa-no-miko','enshrined',4),
('chiriku-hachimangu','uji-no-miko','enshrined',5),
('chiriku-hachimangu','sumiyoshi-no-okami','enshrined',6),
('tashima-jinja','tagorihime-no-kami','principal',0),
('tashima-jinja','ichikishimahime-no-kami','co_enshrined',1),
('tashima-jinja','tagitsuhime-no-kami','co_enshrined',2),
('tashima-jinja','oyamatsumi-no-kami','enshrined',3),
('tashima-jinja','wakatakeru-no-mikoto','enshrined',4),
('yodohime-jinja','yodohime-no-mikoto','principal',0),
('yodohime-jinja','sugawara-michizane-ko','enshrined',1),
('amenotanao-jinja','amenooshihomimi-no-mikoto','principal',0),
('amenotanao-jinja','amenotajikarao-no-mikoto','co_enshrined',1),
('amenotanao-jinja','amenouzume-no-mikoto','co_enshrined',2),
('kaijin-jinja','toyotamahime-no-mikoto','principal',0),
('kaijin-jinja','hikohohodemi-no-mikoto','enshrined',1),
('kaijin-jinja','ichikishimahime-no-kami','enshrined',2),
('kaijin-jinja','ugayafukiaezu-no-mikoto','enshrined',3),
('kameyama-hachimangu','ojin-tenno-deity','principal',0),
('kameyama-hachimangu','chuai-tenno-deity','co_enshrined',1),
('kameyama-hachimangu','jingu-kogo','co_enshrined',2),
('kameyama-hachimangu','nintoku-tenno-deity','co_enshrined',3),
('kameyama-hachimangu','ukemochi-no-kami','enshrined',4),
('takeshima-jinja','isotakeru-no-mikoto','principal',0),
('takeshima-jinja','oyatsuhime-no-mikoto','co_enshrined',1),
('takeshima-jinja','tsumatsuhime-no-mikoto','co_enshrined',2)
) as x(shrine_slug, deity_slug, role, disp)
join public.shrines s on s.slug = x.shrine_slug
join public.deities d on d.slug = x.deity_slug
on conflict (shrine_id, deity_id) do nothing;

-- ============ 信仰系統 ============
insert into public.shrine_lineages (shrine_id, lineage_id)
select s.id, l.id from (values
('dazaifu-tenmangu','tenjin-shinko'),
('kushida-jinja','gion-shinko'),
('yutoku-inari-jinja','inari-shinko'),
('suwa-jinja','suwa-shinko'),
('suwa-jinja','sumiyoshi-shinko'),
('miyajidake-jinja','jingu-kogo-shinko'),
('hakozaki-gu','hachiman-shinko'),
('munakata-taisha','munakata-shinko'),
('chiriku-hachimangu','hachiman-shinko'),
('tashima-jinja','munakata-shinko'),
('yodohime-jinja','suijin-shinko'),
('kaijin-jinja','munakata-shinko'),
('kameyama-hachimangu','hachiman-shinko'),
('takeshima-jinja','izumo-shinko')
) as x(shrine_slug, lineage_slug)
join public.shrines s on s.slug = x.shrine_slug
join public.lineages l on l.slug = x.lineage_slug
on conflict (shrine_id, lineage_id) do nothing;

-- ============ 御利益 (断定表現を避けた説明文を付与) ============
insert into public.shrine_benefits (shrine_id, benefit_id, description)
select s.id, b.id, x.description from (values
('dazaifu-tenmangu','gakugyo-joju','学問成就の神として広く知られています。'),
('dazaifu-tenmangu','yakuyoke','厄除けの神としても知られています。'),
('dazaifu-tenmangu','ryoen','良縁を願う参拝者にも知られています。'),
('kushida-jinja','shobai-hanjo','商売繁盛の神として知られています。'),
('kushida-jinja','furo-choju','不老長寿の神として知られています。'),
('kushida-jinja','yakuyoke','厄除けの神として知られています。'),
('yutoku-inari-jinja','shobai-hanjo','商売繁盛の神として知られています。'),
('yutoku-inari-jinja','kanai-anzen','家内安全の神として知られています。'),
('yutoku-inari-jinja','kotsu-anzen','交通安全の神として知られています。'),
('suwa-jinja','yakuyoke','厄除けの神として知られています。'),
('suwa-jinja','kanai-anzen','家内安全の神として知られています。'),
('suwa-jinja','kotsu-anzen','交通安全の神として知られています。'),
('miyajidake-jinja','kaiun','「何事にも打ち勝つ開運の神様」として知られています。'),
('miyajidake-jinja','shobai-hanjo','商売繁盛の神として知られています。'),
('miyajidake-jinja','kanai-anzen','家内安全の神として知られています。'),
('hakozaki-gu','yakuyoke','厄除けの神として知られています。'),
('hakozaki-gu','shoun','勝運の神として知られています。'),
('hakozaki-gu','kokai-anzen','元寇の伝承から海上安全の神としても知られています。'),
('munakata-taisha','kotsu-anzen','交通安全のお守りの発祥地として知られています。'),
('munakata-taisha','kokai-anzen','古くから航海安全の神として知られています。'),
('saga-jinja','gakugyo-joju','学問・文化の神として広く崇敬されています。'),
('saga-jinja','shobai-hanjo','産業・技術振興の神として知られています。'),
('saga-jinja','kotsu-anzen','交通(蒸気船建造の功績)の神として知られています。'),
('chiriku-hachimangu','kaiun','開運出世の神として知られています。'),
('chiriku-hachimangu','shoun','勝負運の神として知られています。'),
('chiriku-hachimangu','buun-chokyu','武運長久の神として古くから知られています。'),
('tashima-jinja','kokai-anzen','玄海の海上守護の神として広く知られています。'),
('tashima-jinja','gokoku-hojo','五穀豊穣の神として知られています。'),
('tashima-jinja','enmusubi','境内社の伝承から縁結びの神徳でも知られています。'),
('yodohime-jinja','kanai-anzen','家内安全を祈願する参拝者に知られています。'),
('yodohime-jinja','kotsu-anzen','交通安全を祈願する参拝者に知られています。'),
('yodohime-jinja','shison-hanei','子孫繁栄の神徳でも知られています。'),
('amenotanao-jinja','gokoku-hojo','五穀豊穣の神として知られています。'),
('amenotanao-jinja','kaiun','開運祈願の神として知られています。'),
('amenotanao-jinja','anzan','安産祈願の神として知られています。'),
('kaijin-jinja','kokai-anzen','対馬国一宮として旅の安全の神として知られています。'),
('kaijin-jinja','enmusubi','良縁の神徳でも知られています。'),
('kameyama-hachimangu','yakuyoke','厄除けの神として知られています。'),
('kameyama-hachimangu','kanai-anzen','家内安全の神として知られています。'),
('kameyama-hachimangu','shobai-hanjo','商売繁盛の神として知られています。'),
('takeshima-jinja','kanai-anzen','島原の鎮守・産土神として家内安全の神徳で知られています。'),
('takeshima-jinja','kotsu-anzen','交通安全の神として知られています。')
) as x(shrine_slug, benefit_slug, description)
join public.shrines s on s.slug = x.shrine_slug
join public.benefits b on b.slug = x.benefit_slug
on conflict (shrine_id, benefit_id) do nothing;

-- ============ 人物との関連 ============
insert into public.shrine_figures (shrine_id, figure_id, description)
select s.id, f.id, x.description from (values
('dazaifu-tenmangu','sugawara-michizane','菅原道真公の御墓所の上に社殿を営んだことに始まると伝えられます。'),
('saga-jinja','nabeshima-naomasa','藩政改革・反射炉建設などの遺徳を偲び祀られたと伝えられます。'),
('saga-jinja','nabeshima-naohiro','父直正の志を継いだ功績を偲び合祀されたと伝えられます。'),
('miyajidake-jinja','jingu-kogo-figure','渡韓の折にこの地で祈願したという伝承に基づき祀られたと伝えられます。'),
('hakozaki-gu','ojin-tenno-figure','八幡神として神格化され主祭神として祀られていると伝えられます。'),
('chiriku-hachimangu','ojin-tenno-figure','八幡神として神格化され主祭神として祀られていると伝えられます。'),
('chiriku-hachimangu','chuai-tenno-figure','神功皇后の夫として共に祀られていると伝えられます。'),
('kameyama-hachimangu','ojin-tenno-figure','八幡神として神格化され主祭神として祀られていると伝えられます。'),
('kameyama-hachimangu','chuai-tenno-figure','神功皇后の夫として共に祀られていると伝えられます。'),
('kameyama-hachimangu','nintoku-tenno-figure','応神天皇の御子として共に祀られていると伝えられます。')
) as x(shrine_slug, figure_slug, description)
join public.shrines s on s.slug = x.shrine_slug
join public.historical_figures f on f.slug = x.figure_slug
on conflict (shrine_id, figure_id) do nothing;

-- ============ 出典 ============
insert into public.sources (name, url, source_type, last_verified_at, notes)
values
('太宰府天満宮 公式サイト','https://www.dazaifutenmangu.or.jp/','official_site','2026-09-07',null),
('櫛田神社 紹介ページ(博多の魅力)','https://hakatanomiryoku.com/spot/%E6%AB%9B%E7%94%B0%E7%A5%9E%E7%A4%BE/','other','2026-09-07',null),
('祐徳稲荷神社 公式サイト','https://www.yutoku.jp/','official_site','2026-09-07',null),
('鎮西大社 諏訪神社 公式サイト','https://www.osuwasan.jp/','official_site','2026-09-07',null),
('宮地嶽神社 公式サイト','https://www.miyajidake.or.jp/history/gosaijin','official_site','2026-09-07',null),
('宮地嶽神社 公式サイト(アクセス)','https://www.miyajidake.or.jp/access','official_site','2026-09-07',null),
('Wikipedia「宮地嶽神社」','https://ja.wikipedia.org/wiki/宮地嶽神社','other','2026-09-07',null),
('筥崎宮 公式サイト','https://hakozakigu.or.jp/about/','official_site','2026-09-07',null),
('筥崎宮 公式サイト(アクセス)','https://hakozakigu.or.jp/access/','official_site','2026-09-07',null),
('宗像大社 公式サイト','https://munakata-taisha.or.jp/yuisyo.html','official_site','2026-09-07',null),
('宗像大社 公式サイト(辺津宮)','https://munakata-taisha.or.jp/about_hetsu.html','official_site','2026-09-07',null),
('佐嘉神社 公式サイト','https://sagajinjya.jp/origin/','official_site','2026-09-07',null),
('佐嘉神社 公式サイト(ご祭神)','https://sagajinjya.jp/about/','official_site','2026-09-07',null),
('千栗八幡宮 公式サイト','https://chirikuhachiman.sakura.ne.jp/kami/','official_site','2026-09-07',null),
('Wikipedia「千栗八幡宮」','https://ja.wikipedia.org/wiki/千栗八幡宮','other','2026-09-07',null),
('唐津観光協会 公式サイト(田島神社)','https://www.karatsu-kankou.jp/spots/detail/223','other','2026-09-07',null),
('Wikipedia「田島神社」','https://ja.wikipedia.org/wiki/田島神社','other','2026-09-07',null),
('與止日女神社 公式サイト','https://yodohime-jinja.jimdofree.com/','official_site','2026-09-07',null),
('Wikipedia「與止日女神社」','https://ja.wikipedia.org/wiki/與止日女神社','other','2026-09-07',null),
('壱岐観光ナビ(壱岐市観光連盟)','https://www.ikikankou.com/spot/10206','other','2026-09-07',null),
('Wikipedia「天手長男神社」','https://ja.wikipedia.org/wiki/天手長男神社','other','2026-09-07',null),
('対馬観光物産協会 公式サイト','https://www.tsushima-net.org/tourism-history/kaijin-shrine/','other','2026-09-07',null),
('Wikipedia「海神神社」','https://ja.wikipedia.org/wiki/海神神社','other','2026-09-07',null),
('Wikipedia「亀山八幡宮(佐世保市)」','https://ja.wikipedia.org/wiki/亀山八幡宮_(佐世保市)','other','2026-09-07',null),
('島原市 公式サイト(猛島神社)','https://www.city.shimabara.lg.jp/page2909.html','government','2026-09-07',null)
;

insert into public.shrine_sources (shrine_id, source_id, field_name)
select s.id, src.id, x.field_name from (values
('dazaifu-tenmangu','https://www.dazaifutenmangu.or.jp/','history'),
('kushida-jinja','https://hakatanomiryoku.com/spot/%E6%AB%9B%E7%94%B0%E7%A5%9E%E7%A4%BE/','history'),
('yutoku-inari-jinja','https://www.yutoku.jp/','history'),
('suwa-jinja','https://www.osuwasan.jp/','history'),
('miyajidake-jinja','https://www.miyajidake.or.jp/history/gosaijin','history'),
('miyajidake-jinja','https://www.miyajidake.or.jp/access','access_info'),
('miyajidake-jinja','https://ja.wikipedia.org/wiki/宮地嶽神社','cultural_properties'),
('hakozaki-gu','https://hakozakigu.or.jp/about/','history'),
('hakozaki-gu','https://hakozakigu.or.jp/access/','access_info'),
('munakata-taisha','https://munakata-taisha.or.jp/yuisyo.html','history'),
('munakata-taisha','https://munakata-taisha.or.jp/about_hetsu.html','deities'),
('saga-jinja','https://sagajinjya.jp/origin/','history'),
('saga-jinja','https://sagajinjya.jp/about/','deities'),
('chiriku-hachimangu','https://chirikuhachiman.sakura.ne.jp/kami/','deities'),
('chiriku-hachimangu','https://ja.wikipedia.org/wiki/千栗八幡宮','history'),
('tashima-jinja','https://www.karatsu-kankou.jp/spots/detail/223','access_info'),
('tashima-jinja','https://ja.wikipedia.org/wiki/田島神社','history'),
('yodohime-jinja','https://yodohime-jinja.jimdofree.com/','history'),
('yodohime-jinja','https://ja.wikipedia.org/wiki/與止日女神社','cultural_properties'),
('amenotanao-jinja','https://www.ikikankou.com/spot/10206','access_info'),
('amenotanao-jinja','https://ja.wikipedia.org/wiki/天手長男神社','history'),
('kaijin-jinja','https://www.tsushima-net.org/tourism-history/kaijin-shrine/','history'),
('kaijin-jinja','https://ja.wikipedia.org/wiki/海神神社','history'),
('kameyama-hachimangu','https://ja.wikipedia.org/wiki/亀山八幡宮_(佐世保市)','history'),
('takeshima-jinja','https://www.city.shimabara.lg.jp/page2909.html','history')
) as x(shrine_slug, source_url, field_name)
join public.shrines s on s.slug = x.shrine_slug
join public.sources src on src.url = x.source_url
on conflict (shrine_id, source_id) do nothing;
