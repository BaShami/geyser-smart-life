
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  device_interests text[] NOT NULL DEFAULT '{}',
  country text,
  city text,
  name text,
  phone text,
  email text,
  owns_or_rents text,
  has_wifi boolean,
  current_step text,
  last_completed_step text,
  lead_status text NOT NULL DEFAULT 'device_selected',
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  first_utm jsonb,
  latest_utm jsonb,
  referrer text,
  notified_at timestamptz,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX leads_lead_status_idx ON public.leads(lead_status);
CREATE INDEX leads_country_idx ON public.leads(country);

GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  funnel_step text,
  selected_device text,
  country text,
  referrer text,
  utm jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX events_session_idx ON public.analytics_events(session_id);
CREATE INDEX events_name_idx ON public.analytics_events(event_name);
CREATE INDEX events_created_idx ON public.analytics_events(created_at DESC);

GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
