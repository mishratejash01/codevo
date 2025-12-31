-- Fix event_payments to support payments for ALL registration tables (workshop/webinar/meetup/contest/hackathon)
-- The existing foreign key to event_registrations breaks inserts for other form types.

ALTER TABLE public.event_payments
  DROP CONSTRAINT IF EXISTS event_payments_registration_id_fkey;

ALTER TABLE public.event_payments
  ADD COLUMN IF NOT EXISTS registration_form_type text;

-- Optional: helpful index for lookups by (event_id, registration_id)
CREATE INDEX IF NOT EXISTS idx_event_payments_event_registration
  ON public.event_payments (event_id, registration_id);

CREATE INDEX IF NOT EXISTS idx_event_payments_formtype_registration
  ON public.event_payments (registration_form_type, registration_id);
