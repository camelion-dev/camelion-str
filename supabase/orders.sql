-- Run this in Supabase Dashboard > SQL Editor.
--
-- Defines the atomic guest-checkout function used by the app. The live schema
-- stores orders in normalized Prisma tables, so this function creates the
-- guest customer and address records in the same transaction.
--
-- Why a function instead of separate REST calls from the app?
-- PostgREST (the Supabase REST API) gives each individual request its own
-- transaction. If the app did "check stock" then "update stock" then "insert
-- order" as three separate calls, two customers buying the last unit at the
-- same time could both pass the stock check before either one's update lands
-- (a race condition -> overselling). A single Postgres function called through
-- one REST request runs as one transaction, and the `for update` row lock
-- below makes concurrent calls for the same product queue up safely instead
-- of racing.
--
-- Delivery is free at/above Rs. 5,000 subtotal; otherwise the selected
-- delivery region's configured fee is used.
create or replace function place_order(payload jsonb)
returns jsonb
language plpgsql
set search_path = public, extensions
as $$
declare
  v_item jsonb;
  v_product record;
  v_order_id text := gen_random_uuid()::text;
  v_order_number text;
  v_subtotal integer := 0;
  v_delivery_fee integer;
  v_total integer;
  v_items jsonb := '[]'::jsonb;
  v_product_id text;
  v_quantity integer;
  v_user_id text := nullif(payload->>'userId', '');
  v_address_id text := gen_random_uuid()::text;
  v_region_id text;
  v_region_name text;
  v_region_fee integer;
  v_customer_email text := nullif(payload->>'customerEmail', '');
begin
  if payload->'items' is null or jsonb_array_length(payload->'items') = 0 then
    raise exception 'EMPTY_CART';
  end if;

  select id, name, fee into v_region_id, v_region_name, v_region_fee
  from "DeliveryRegion"
  where "isActive" = true
    and lower(name) = lower(coalesce(nullif(payload->>'shippingRegion', ''), 'Punjab'))
  limit 1;

  if not found then
    raise exception 'INVALID_REGION:%', payload->>'shippingRegion';
  end if;

  v_order_number := 'CM-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(v_order_id, 1, 6));

  for v_item in select * from jsonb_array_elements(payload->'items')
  loop
    v_product_id := v_item->>'productId';
    v_quantity := (v_item->>'quantity')::integer;

    if v_product_id is null or v_quantity is null or v_quantity < 1 then
      raise exception 'INVALID_ITEM:%', coalesce(v_product_id, 'unknown');
    end if;

    select id, name, price, stock, "isActive" into v_product
    from "Product"
    where id = v_product_id
    for update;

    if not found then
      raise exception 'PRODUCT_NOT_FOUND:%', v_product_id;
    end if;

    if not v_product."isActive" then
      raise exception 'PRODUCT_INACTIVE:%', v_product.name;
    end if;

    if v_product.stock < v_quantity then
      raise exception 'INSUFFICIENT_STOCK:%:%', v_product.name, v_product.stock;
    end if;

    update "Product" set stock = stock - v_quantity, "updatedAt" = now() where id = v_product.id;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
    v_items := v_items || jsonb_build_object(
      'productId', v_product.id,
      'productName', v_product.name,
      'unitPrice', v_product.price,
      'quantity', v_quantity
    );
  end loop;

  v_delivery_fee := case when v_subtotal >= 5000 then 0 else v_region_fee end;
  v_total := v_subtotal + v_delivery_fee;

  if v_user_id is null then
    v_user_id := gen_random_uuid()::text;
    insert into "User" (id, name, email, phone, role)
    values (v_user_id, payload->>'customerName', null, null, 'CUSTOMER');
  else
    if not exists (select 1 from "User" where id = v_user_id and role = 'CUSTOMER') then
      raise exception 'INVALID_USER';
    end if;
  end if;

  insert into "Address" (id, label, recipient, phone, line1, city, region, "postalCode", "userId")
  values (
    v_address_id, 'Checkout address', payload->>'customerName', payload->>'customerPhone',
    payload->>'shippingAddress', payload->>'shippingCity', v_region_name,
    nullif(payload->>'shippingPostalCode', ''), v_user_id
  );

  insert into "Order" (
    id, "number", status, "paymentMethod", currency, subtotal, "deliveryFee", total,
    "customerName", "customerPhone", "customerEmail", "addressId", "regionId", "userId"
  ) values (
    v_order_id, v_order_number, 'PENDING', 'COD', 'PKR', v_subtotal, v_delivery_fee, v_total,
    payload->>'customerName', payload->>'customerPhone', coalesce(v_customer_email, ''),
    v_address_id, v_region_id, v_user_id
  );

  insert into "OrderItem" (id, "orderId", "productId", "productName", "unitPrice", quantity)
  select gen_random_uuid()::text, v_order_id, (i->>'productId'), (i->>'productName'), (i->>'unitPrice')::integer, (i->>'quantity')::integer
  from jsonb_array_elements(v_items) as i;

  insert into "OrderStatusHistory" (id, "orderId", "from", "to", note)
  values (gen_random_uuid()::text, v_order_id, null, 'PENDING', 'Order placed (Cash on Delivery).');

  return jsonb_build_object(
    'id', v_order_id,
    'number', v_order_number,
    'subtotal', v_subtotal,
    'deliveryFee', v_delivery_fee,
    'total', v_total
  );
end;
$$;

create or replace function update_order_status(payload jsonb)
returns jsonb
language plpgsql
set search_path = public, extensions
as $$
declare
  v_order record;
  v_next "OrderStatus";
begin
  v_next := (payload->>'status')::"OrderStatus";

  select id, status, "stockRestored" into v_order
  from public."Order"
  where id = payload->>'orderId'
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if not (
    (v_order.status = 'PENDING' and v_next in ('CONFIRMED', 'CANCELLED')) or
    (v_order.status = 'CONFIRMED' and v_next in ('PROCESSING', 'CANCELLED')) or
    (v_order.status = 'PROCESSING' and v_next in ('SHIPPED', 'CANCELLED')) or
    (v_order.status = 'SHIPPED' and v_next in ('DELIVERED', 'RETURNED')) or
    (v_order.status = 'DELIVERED' and v_next = 'RETURNED')
  ) then
    raise exception 'INVALID_STATUS_TRANSITION:%:%', v_order.status, v_next;
  end if;

  if v_next in ('CANCELLED', 'RETURNED') and not v_order."stockRestored" then
    update public."Product" p
    set stock = p.stock + items.quantity, "updatedAt" = now()
    from public."OrderItem" items
    where items."orderId" = v_order.id
      and items."productId" = p.id;

    update public."Order"
    set "stockRestored" = true, status = v_next, "updatedAt" = now()
    where id = v_order.id;
  else
    update public."Order"
    set status = v_next, "updatedAt" = now()
    where id = v_order.id;
  end if;

  insert into public."OrderStatusHistory" (id, "orderId", "from", "to", note)
  values (gen_random_uuid()::text, v_order.id, v_order.status, v_next, 'Status updated by admin.');

  return jsonb_build_object('id', v_order.id, 'status', v_next);
end;
$$;

-- The app only calls these functions server-side with SUPABASE_SERVICE_ROLE_KEY.
revoke all on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;

revoke all on function public.update_order_status(jsonb) from public, anon, authenticated;
grant execute on function public.update_order_status(jsonb) to service_role;
