-- Run this in Supabase Dashboard > SQL Editor.
-- The bucket is public so storefront product images can render by URL.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- Public read access for product images.
create policy "Product images are publicly readable"
on storage.objects for select
using (bucket_id = 'product-images');

-- Until Auth.js/Supabase Auth is connected, admin image writes are performed
-- through the server route with SUPABASE_SERVICE_ROLE_KEY. Do not expose that key.
