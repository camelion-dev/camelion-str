-- Run this in Supabase Dashboard > SQL Editor before deploying the app changes.
-- Existing products remain valid with no keywords.
alter table public."Product"
  add column if not exists keywords text;
