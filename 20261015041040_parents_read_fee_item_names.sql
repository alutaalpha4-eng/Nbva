-- Parents need the fee item names to read their child's fee statement.
drop policy fee_items_read on public.fee_items;
create policy fee_items_read on public.fee_items for select to authenticated
  using (private.is_fee_viewer() or private.app_role() = 'parent');
