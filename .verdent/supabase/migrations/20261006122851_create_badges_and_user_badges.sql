CREATE TABLE IF NOT EXISTS public.badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_emoji TEXT,
  criteria_type TEXT NOT NULL,
  criteria_value INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.badges TO anon, authenticated;
GRANT SELECT, INSERT ON public.user_badges TO authenticated;

CREATE POLICY "public reads badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "users read own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users earn own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);