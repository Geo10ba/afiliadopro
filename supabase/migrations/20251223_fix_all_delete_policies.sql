-- Enable DELETE for Admins on 'orders'
drop policy if exists "Admins can delete orders" on "public"."orders";
create policy "Admins can delete orders"
on "public"."orders"
as permissive
for delete
to authenticated
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- Enable DELETE for Admins on 'materials'
drop policy if exists "Admins can delete materials" on "public"."materials";
create policy "Admins can delete materials"
on "public"."materials"
as permissive
for delete
to authenticated
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- Enable DELETE for Admins on 'profiles' (Users)
drop policy if exists "Admins can delete profiles" on "public"."profiles";
create policy "Admins can delete profiles"
on "public"."profiles"
as permissive
for delete
to authenticated
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- Enable DELETE for Admins on 'products'
drop policy if exists "Admins can delete products" on "public"."products";
create policy "Admins can delete products"
on "public"."products"
as permissive
for delete
to authenticated
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- Enable DELETE for Admins on 'notifications'
drop policy if exists "Admins can delete notifications" on "public"."notifications";
create policy "Admins can delete notifications"
on "public"."notifications"
as permissive
for delete
to authenticated
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- Enable UPDATE for Admins on 'materials' (just in case)
drop policy if exists "Admins can update materials" on "public"."materials";
create policy "Admins can update materials"
on "public"."materials"
as permissive
for update
to authenticated
using (
  (select role from profiles where id = auth.uid()) = 'admin'
)
with check (
  (select role from profiles where id = auth.uid()) = 'admin'
);
