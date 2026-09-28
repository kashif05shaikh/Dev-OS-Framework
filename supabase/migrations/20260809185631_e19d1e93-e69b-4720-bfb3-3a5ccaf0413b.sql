CREATE TABLE public.platform_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  handle text,
  platform_user_id text,
  secret_ciphertext text,
  status text NOT NULL DEFAULT 'disconnected',
  last_error text,
  connected_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

GRANT ALL ON public.platform_connections TO service_role;

ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct client access to platform connections"
ON public.platform_connections
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE TRIGGER platform_connections_updated_at
BEFORE UPDATE ON public.platform_connections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();