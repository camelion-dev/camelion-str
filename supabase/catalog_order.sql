-- Run this in Supabase Dashboard > SQL Editor before deploying catalogue reordering.
alter table public."Product"
  add column if not exists "sortOrder" integer;

with ranked_products as (
  select
    id,
    row_number() over (order by "createdAt" desc, id asc) - 1 as position
  from public."Product"
)
update public."Product" as product
set "sortOrder" = ranked_products.position
from ranked_products
where product.id = ranked_products.id
  and product."sortOrder" is null;

alter table public."Product"
  alter column "sortOrder" set default 0,
  alter column "sortOrder" set not null;

create index if not exists "Product_sortOrder_createdAt_idx"
  on public."Product" ("sortOrder", "createdAt");

create or replace function public.reorder_catalog_products(p_product_ids text[])
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_product_ids is null
    or cardinality(p_product_ids) = 0
    or cardinality(p_product_ids) <> (
      select count(distinct requested.product_id)
      from unnest(p_product_ids) as requested(product_id)
    )
    or cardinality(p_product_ids) <> (select count(*) from public."Product")
    or exists (
      select 1
      from public."Product" as product
      where not (product.id::text = any(p_product_ids))
    ) then
    raise exception 'Product order must include every product exactly once';
  end if;

  update public."Product" as product
  set "sortOrder" = ordered.position
  from unnest(p_product_ids) with ordinality as ordered(product_id, position)
  where product.id::text = ordered.product_id;
end;
$$;

revoke all on function public.reorder_catalog_products(text[]) from public, anon, authenticated;
grant execute on function public.reorder_catalog_products(text[]) to service_role;
