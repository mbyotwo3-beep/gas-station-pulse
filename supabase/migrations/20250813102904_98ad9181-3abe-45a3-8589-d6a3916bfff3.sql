-- Fix OTP expiry settings by updating auth configuration
-- Set OTP expiry to 5 minutes (300 seconds) instead of the default long expiry

UPDATE auth.config SET 
  phone_confirm_timeout = 300,
  email_confirm_timeout = 300
WHERE true;