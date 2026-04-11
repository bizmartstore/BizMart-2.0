-- Enable realtime for messages and conversations tables
alter table messages replica identity full;
alter table conversations replica identity full;

-- Ensure tables are included in the supabase_realtime publication
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'messages') then
    alter publication supabase_realtime add table messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'conversations') then
    alter publication supabase_realtime add table conversations;
  end if;
end $$;

-- Drop the old restrictive select policy on messages
drop policy if exists "Users can view own messages" on messages;

-- Create a new select policy: users can view messages in conversations they participate in
create policy "Users can view messages in their conversations" on messages
for select to authenticated
using (
  exists (
    select 1 from conversations
    where conversations.id = messages.conversation_id
    and (conversations.participant_1 = auth.uid() or conversations.participant_2 = auth.uid())
  )
);

-- Create an update policy: allow participants to update (e.g., mark as read) messages in their conversations
create policy "Users can update messages in their conversations" on messages
for update to authenticated
using (
  exists (
    select 1 from conversations
    where conversations.id = messages.conversation_id
    and (conversations.participant_1 = auth.uid() or conversations.participant_2 = auth.uid())
  )
)
with check (
  exists (
    select 1 from conversations
    where conversations.id = messages.conversation_id
    and (conversations.participant_1 = auth.uid() or conversations.participant_2 = auth.uid())
  )
);