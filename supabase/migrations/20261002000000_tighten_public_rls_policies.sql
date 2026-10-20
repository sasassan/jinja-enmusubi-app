CREATE OR REPLACE FUNCTION public.can_read_shrine_source(p_shrine_id uuid, p_source_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shrines AS s
    JOIN public.shrine_sources AS ss ON ss.shrine_id = s.id
    JOIN public.sources AS src ON src.id = ss.source_id
    WHERE s.id = p_shrine_id
      AND s.is_published = true
      AND src.id = p_source_id
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_shrine_source(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_shrine_source(uuid, uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "public reads published shrine sources" ON public.shrine_sources;
CREATE POLICY "public reads published shrine sources"
  ON public.shrine_sources FOR SELECT
  USING (public.can_read_shrine_source(shrine_id, source_id));

DROP POLICY IF EXISTS "public reads published sources" ON public.sources;
CREATE POLICY "public reads published sources"
  ON public.sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.shrine_sources AS ss
      JOIN public.shrines AS s ON s.id = ss.shrine_id
      WHERE ss.source_id = sources.id
        AND s.is_published = true
    )
  );

DROP POLICY IF EXISTS "public reads published deity lineages" ON public.deity_lineages;
CREATE POLICY "public reads published deity lineages"
  ON public.deity_lineages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deities AS d
      WHERE d.id = deity_lineages.deity_id AND d.is_published = true
    )
    AND EXISTS (
      SELECT 1 FROM public.lineages AS l
      WHERE l.id = deity_lineages.lineage_id AND l.is_published = true
    )
  );

DROP POLICY IF EXISTS "public reads published deity benefits" ON public.deity_benefits;
CREATE POLICY "public reads published deity benefits"
  ON public.deity_benefits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deities AS d
      WHERE d.id = deity_benefits.deity_id AND d.is_published = true
    )
    AND EXISTS (
      SELECT 1 FROM public.benefits AS b
      WHERE b.id = deity_benefits.benefit_id AND b.is_published = true
    )
  );
