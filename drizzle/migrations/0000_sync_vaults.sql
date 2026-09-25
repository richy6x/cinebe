CREATE TABLE public.sync_vaults (
  code_hash text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.sync_vaults TO service_role;
ALTER TABLE public.sync_vaults ENABLE ROW LEVEL SECURITY;