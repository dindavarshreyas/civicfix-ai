-- CivicMind: Row Level Security (RLS)
alter table profiles enable row level security;
alter table departments enable row level security;
alter table issues enable row level security;
alter table reports enable row level security;
alter table issue_status_history enable row level security;
alter table agent_runs enable row level security;
alter table notifications enable row level security;
alter table ai_overrides enable row level security;

create or replace function current_role_name() returns user_role
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

create or replace function current_department() returns uuid
language sql stable security definer set search_path = public as
$$ select department_id from profiles where id = auth.uid() $$;

-- profiles
drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own on profiles for select using (id = auth.uid() or current_role_name() = 'admin');

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid())
              and department_id is not distinct from (select department_id from profiles where id = auth.uid()));

drop policy if exists profiles_admin_all on profiles;
create policy profiles_admin_all on profiles for all using (current_role_name() = 'admin');

-- departments
drop policy if exists departments_read on departments;
create policy departments_read on departments for select using (true);

drop policy if exists departments_admin_write on departments;
create policy departments_admin_write on departments for all using (current_role_name() = 'admin');

-- issues
drop policy if exists issues_public_read on issues;
create policy issues_public_read on issues for select using (true);

drop policy if exists issues_officer_update on issues;
create policy issues_officer_update on issues for update
  using (current_role_name() = 'officer' and department_id = current_department());

drop policy if exists issues_admin_all on issues;
create policy issues_admin_all on issues for all using (current_role_name() = 'admin');

-- reports
drop policy if exists reports_owner_read on reports;
create policy reports_owner_read on reports for select using (user_id = auth.uid());

drop policy if exists reports_officer_read on reports;
create policy reports_officer_read on reports for select using (
  current_role_name() = 'officer' and exists (
    select 1 from issues i where i.id = reports.issue_id and i.department_id = current_department()
  )
);

drop policy if exists reports_admin_all on reports;
create policy reports_admin_all on reports for all using (current_role_name() = 'admin');

-- status history
drop policy if exists history_public_read on issue_status_history;
create policy history_public_read on issue_status_history for select using (true);

-- agent_runs
drop policy if exists agent_runs_officer_read on agent_runs;
create policy agent_runs_officer_read on agent_runs for select using (
  current_role_name() = 'admin' or (
    current_role_name() = 'officer' and exists (
      select 1 from issues i where i.id = agent_runs.issue_id and i.department_id = current_department()
    )
  )
);

-- notifications
drop policy if exists notifications_own on notifications;
create policy notifications_own on notifications for select using (user_id = auth.uid());

drop policy if exists notifications_own_update on notifications;
create policy notifications_own_update on notifications for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ai_overrides
drop policy if exists overrides_read on ai_overrides;
create policy overrides_read on ai_overrides for select using (
  current_role_name() = 'admin' or officer_id = auth.uid()
);
