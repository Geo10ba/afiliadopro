-- Allow admins to delete orders
create policy "Admins can delete orders"
on "public"."orders"
as permissive
for delete
to authenticated
using (
  (select role from profiles where id = auth.uid()) = 'admin'
);
