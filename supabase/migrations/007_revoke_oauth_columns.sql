-- 007_revoke_oauth_columns.sql
-- Block direct client writes to OAuth credential columns on
-- public.user_preferences. The `update own prefs` RLS policy in 004
-- allows users to update their own row, which is correct for benign
-- columns (theme_id, calendar_sync_enabled, calendar_target_id) but
-- WRONG for credential columns — tokens must only be written by the
-- server-side OAuth callback running with the service role.
--
-- Column-level GRANTs are checked in addition to RLS, so this revoke
-- prevents authenticated/anon roles from writing these columns even
-- when the row-level UPDATE policy permits the operation.

revoke update (calendar_oauth_refresh_token, calendar_provider)
  on public.user_preferences from authenticated;

revoke update (calendar_oauth_refresh_token, calendar_provider)
  on public.user_preferences from anon;

-- Verify with:
--   select grantee, privilege_type, column_name
--   from information_schema.column_privileges
--   where table_name = 'user_preferences'
--     and column_name in ('calendar_oauth_refresh_token','calendar_provider')
--     and grantee in ('authenticated','anon');
-- The result should NOT include UPDATE rows for those grantees on those columns.
