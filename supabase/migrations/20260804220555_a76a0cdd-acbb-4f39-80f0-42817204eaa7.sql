CREATE TABLE public.household_pilot_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  full_name text NOT NULL,
  whatsapp_number text NOT NULL,
  country text,
  runs_household text,
  household_whatsapp_users text,
  follow_up_with text,
  repeated_responsibility text,
  frequency text,
  would_invite text,
  referrer text,
  utm jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.household_pilot_signups TO service_role;
ALTER TABLE public.household_pilot_signups ENABLE ROW LEVEL SECURITY;