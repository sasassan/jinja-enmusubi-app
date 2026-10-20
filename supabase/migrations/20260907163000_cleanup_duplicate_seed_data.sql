-- Phase 1 データ整合性クリーンアップ
-- 既存(初期)シードデータと本フェーズの新規投入データの間で生じた重複を解消する。
-- 既存: dazaifu-tenmangu / kushida-jinja / suwa-jinja / yutoku-inari(旧slug) は
-- Phase1着手前から投入済みだったため、slug不一致や重複データが発生していた。

begin;

-- 1. 旧「祐徳稲荷神社」(slug: yutoku-inari)を削除し、詳細項目を含む新レコード(yutoku-inari-jinja)に一本化
delete from public.shrines where slug = 'yutoku-inari';

-- 2. 旧・簡易版の神様レコード(aliases/summary/mythology/divinityが空)を削除
--    (対応するshrine_deitiesはON DELETE CASCADEで自動的に削除される)
delete from public.deities where slug in (
  'sugawara-no-michizane', 'amaterasu-sume-okami', 'susanoo-no-okami',
  'ukanomitama-no-okami', 'oomiyanome-no-okami'
);

-- 3. 諏訪神社: 主祭神/相殿神・合祀神の区別を仕様に合わせて補正
update public.shrine_deities sd
set role = 'co_enshrined'
where sd.shrine_id = (select id from public.shrines where slug = 'suwa-jinja')
  and sd.deity_id = (select id from public.deities where slug = 'yasakatome-no-kami');

update public.shrine_deities sd
set role = 'associated'
where sd.shrine_id = (select id from public.shrines where slug = 'suwa-jinja')
  and sd.deity_id = (select id from public.deities where slug = 'sumiyoshi-no-okami');

-- 4. 完全重複していた出典レコードを1件に統合(太宰府天満宮・諏訪神社)
delete from public.sources where id = 'd8554b66-7e4f-4699-a0e0-fbd0d8e4a465';
delete from public.sources where id = '2270a624-8793-43bf-93a7-31f7e1ce2825';

commit;
