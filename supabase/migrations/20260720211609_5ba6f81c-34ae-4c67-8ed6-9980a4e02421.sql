
CREATE TABLE public.qualify_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  contact text,
  city text,
  has_geyser boolean,
  has_wifi boolean,
  is_renter boolean,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.qualify_leads TO service_role;
ALTER TABLE public.qualify_leads ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.qualify_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  city text,
  reason text,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.qualify_waitlist TO service_role;
ALTER TABLE public.qualify_waitlist ENABLE ROW LEVEL SECURITY;
