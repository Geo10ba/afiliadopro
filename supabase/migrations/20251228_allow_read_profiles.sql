-- Allow authenticated users to read all profiles (needed to check roles)
create policy "Profiles are viewable by everyone"
on profiles for select
to authenticated
using ( true );
