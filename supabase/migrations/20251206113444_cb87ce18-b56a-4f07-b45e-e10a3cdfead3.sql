-- Add foreign key constraints to payment_requests for proper joins with profiles
ALTER TABLE public.payment_requests
ADD CONSTRAINT payment_requests_from_user_id_fkey 
FOREIGN KEY (from_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.payment_requests
ADD CONSTRAINT payment_requests_to_user_id_fkey 
FOREIGN KEY (to_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;