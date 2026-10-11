-- Run this in Supabase Dashboard > SQL Editor before deploying rich product descriptions.
alter table public."Product"
  add column if not exists "detailedDescription" text;
