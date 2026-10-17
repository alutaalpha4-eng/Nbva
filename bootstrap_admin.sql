-- Creates the first admin account (staff code NBVA-2025). Run ONCE in the Supabase SQL editor after the migrations.
-- Replace CHANGE_ME_PASSWORD with a password of at least 8 characters first. Do not save the real password in this file.
-- The admin is made to choose a new password at first sign-in.
with new_user as (
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'nbva-2025@staff.nbva.invalid', extensions.crypt('CHANGE_ME_PASSWORD', extensions.gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"],"role":"admin","staff_code":"NBVA-2025","must_change_password":true}'::jsonb,
    '{"full_name":"School Admin"}'::jsonb, now(), now(), '', '', '', ''
  where not exists (select 1 from public.profiles where role = 'admin')
  returning id, email
)
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true, 'phone_verified', false), 'email', now(), now(), now()
from new_user
returning user_id;
