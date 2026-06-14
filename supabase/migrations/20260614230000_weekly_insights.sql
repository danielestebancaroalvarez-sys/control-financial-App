-- Weekly AI insights cache per household
CREATE TABLE IF NOT EXISTS household_weekly_insights (
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  week_key TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  tips JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, week_key)
);

ALTER TABLE household_weekly_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "household members read insights"
  ON household_weekly_insights FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "household members write insights"
  ON household_weekly_insights FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "household members update insights"
  ON household_weekly_insights FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );
