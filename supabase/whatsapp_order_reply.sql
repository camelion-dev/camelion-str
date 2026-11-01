-- Apply through Supabase MCP before enabling the WhatsApp reply webhook.
-- Stores only provider event IDs and processing outcomes for replay protection.
create table if not exists public."WhatsAppOrderReplyEvent" (
  id text primary key,
  "orderId" text references public."Order"(id) on delete set null,
  action text not null check (action in ('CONFIRMED', 'CANCELLED')),
  outcome text not null check (outcome in (
    'processing', 'applied', 'sender_mismatch', 'order_not_found', 'already_processed', 'ambiguous'
  )),
  "createdAt" timestamptz not null default now()
);

create index if not exists "WhatsAppOrderReplyEvent_orderId_createdAt_idx"
  on public."WhatsAppOrderReplyEvent" ("orderId", "createdAt");

alter table public."WhatsAppOrderReplyEvent" enable row level security;
revoke all on table public."WhatsAppOrderReplyEvent" from public, anon, authenticated;
grant all on table public."WhatsAppOrderReplyEvent" to service_role;

alter table public."WhatsAppOrderReplyEvent"
  drop constraint if exists "WhatsAppOrderReplyEvent_outcome_check";
alter table public."WhatsAppOrderReplyEvent"
  add constraint "WhatsAppOrderReplyEvent_outcome_check"
  check (outcome in (
    'processing', 'applied', 'sender_mismatch', 'order_not_found', 'already_processed', 'ambiguous'
  ));

create or replace function public.process_whatsapp_order_reply(payload jsonb)
returns jsonb
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_event_id text := nullif(payload->>'eventId', '');
  v_order_number text := nullif(payload->>'orderNumber', '');
  v_sender_phone text := nullif(payload->>'senderPhone', '');
  v_action text := upper(nullif(payload->>'action', ''));
  v_existing_outcome text;
  v_order public."Order"%rowtype;
  v_sender_digits text;
  v_order_digits text;
  v_candidate_count integer;
  v_candidate_id text;
begin
  if v_event_id is null or length(v_event_id) > 200
    or (v_order_number is not null and length(v_order_number) > 64)
    or v_sender_phone is null or length(v_sender_phone) > 20
    or v_action is null or v_action not in ('CONFIRMED', 'CANCELLED') then
    raise exception 'INVALID_WHATSAPP_ORDER_REPLY';
  end if;

  v_sender_digits := regexp_replace(v_sender_phone, '[^0-9]', '', 'g');
  if left(v_sender_digits, 2) = '00' then
    v_sender_digits := substring(v_sender_digits from 3);
  elsif left(v_sender_digits, 1) = '0' then
    v_sender_digits := '92' || substring(v_sender_digits from 2);
  elsif length(v_sender_digits) = 10 then
    v_sender_digits := '92' || v_sender_digits;
  end if;
  if v_sender_digits !~ '^[0-9]{10,15}$' then
    raise exception 'INVALID_WHATSAPP_ORDER_REPLY';
  end if;

  insert into public."WhatsAppOrderReplyEvent" (id, action, outcome)
  values (v_event_id, v_action, 'processing')
  on conflict (id) do nothing;

  if not found then
    select outcome into v_existing_outcome
    from public."WhatsAppOrderReplyEvent"
    where id = v_event_id;

    return jsonb_build_object('outcome', 'duplicate', 'originalOutcome', v_existing_outcome);
  end if;

  if v_order_number is not null then
    select * into v_order
    from public."Order"
    where number = v_order_number
    for update;
  else
    select count(*), min(candidate.id)
    into v_candidate_count, v_candidate_id
    from (
      select id,
        case
          when left(phone_digits, 2) = '00' then substring(phone_digits from 3)
          when left(phone_digits, 1) = '0' then '92' || substring(phone_digits from 2)
          when length(phone_digits) = 10 then '92' || phone_digits
          else phone_digits
        end as normalized_phone
      from (
        select id, regexp_replace("customerPhone", '[^0-9]', '', 'g') as phone_digits
        from public."Order"
        where status = 'PENDING'
      ) as pending_orders
    ) as candidate
    where candidate.normalized_phone = v_sender_digits;

    if v_candidate_count = 0 then
      update public."WhatsAppOrderReplyEvent"
      set outcome = 'order_not_found'
      where id = v_event_id;
      return jsonb_build_object('outcome', 'order_not_found');
    end if;

    if v_candidate_count > 1 then
      update public."WhatsAppOrderReplyEvent"
      set outcome = 'ambiguous'
      where id = v_event_id;
      return jsonb_build_object('outcome', 'ambiguous');
    end if;

    if v_candidate_count = 1 then
      select * into v_order
      from public."Order"
      where id = v_candidate_id and status = 'PENDING'
      for update;
    end if;
  end if;

  if not found then
    update public."WhatsAppOrderReplyEvent"
    set outcome = 'order_not_found'
    where id = v_event_id;
    return jsonb_build_object('outcome', 'order_not_found');
  end if;

  update public."WhatsAppOrderReplyEvent"
  set "orderId" = v_order.id
  where id = v_event_id;

  v_order_digits := regexp_replace(v_order."customerPhone", '[^0-9]', '', 'g');
  if left(v_order_digits, 2) = '00' then
    v_order_digits := substring(v_order_digits from 3);
  elsif left(v_order_digits, 1) = '0' then
    v_order_digits := '92' || substring(v_order_digits from 2);
  elsif length(v_order_digits) = 10 then
    v_order_digits := '92' || v_order_digits;
  end if;

  if v_order_digits <> v_sender_digits then
    update public."WhatsAppOrderReplyEvent"
    set outcome = 'sender_mismatch'
    where id = v_event_id;
    return jsonb_build_object('outcome', 'sender_mismatch');
  end if;

  if v_order.status <> 'PENDING' then
    update public."WhatsAppOrderReplyEvent"
    set outcome = 'already_processed'
    where id = v_event_id;
    return jsonb_build_object('outcome', 'already_processed', 'status', v_order.status);
  end if;

  if v_action = 'CANCELLED' then
    if not v_order."stockRestored" then
      update public."Product" as product
      set stock = product.stock + items.quantity,
          "updatedAt" = now()
      from (
        select "productId", sum(quantity)::integer as quantity
        from public."OrderItem"
        where "orderId" = v_order.id and "productId" is not null
        group by "productId"
      ) as items
      where product.id = items."productId";
    end if;

    update public."Order"
    set status = 'CANCELLED', "stockRestored" = true, "updatedAt" = now()
    where id = v_order.id;
  else
    update public."Order"
    set status = 'CONFIRMED', "updatedAt" = now()
    where id = v_order.id;
  end if;

  insert into public."OrderStatusHistory" (id, "orderId", "from", "to", note)
  values (
    gen_random_uuid()::text,
    v_order.id,
    v_order.status,
    v_action::public."OrderStatus",
    case when v_action = 'CONFIRMED'
      then 'Customer confirmed via WhatsApp.'
      else 'Customer cancelled via WhatsApp.'
    end
  );

  update public."WhatsAppOrderReplyEvent"
  set outcome = 'applied'
  where id = v_event_id;

  return jsonb_build_object('outcome', 'applied', 'status', v_action);
end;
$$;

revoke all on function public.process_whatsapp_order_reply(jsonb) from public, anon, authenticated;
grant execute on function public.process_whatsapp_order_reply(jsonb) to service_role;