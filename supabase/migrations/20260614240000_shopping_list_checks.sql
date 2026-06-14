-- Persisted shopping list check state per household (sync between partners)
CREATE TABLE IF NOT EXISTS public.household_shopping_checks (
  household_id UUID NOT NULL REFERENCES public.households (id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  item_name TEXT NOT NULL,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_shopping_checks_household
  ON public.household_shopping_checks (household_id);

ALTER TABLE public.household_shopping_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "household members read shopping checks"
  ON public.household_shopping_checks FOR SELECT
  TO authenticated
  USING (private.is_household_member(household_id));

CREATE POLICY "household members insert shopping checks"
  ON public.household_shopping_checks FOR INSERT
  TO authenticated
  WITH CHECK (private.is_household_member(household_id));

CREATE POLICY "household members update shopping checks"
  ON public.household_shopping_checks FOR UPDATE
  TO authenticated
  USING (private.is_household_member(household_id));

CREATE POLICY "household members delete shopping checks"
  ON public.household_shopping_checks FOR DELETE
  TO authenticated
  USING (private.is_household_member(household_id));

ALTER TABLE public.household_shopping_checks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.household_shopping_checks;
