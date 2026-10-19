-- Account creation is handled by /api/users. The legacy Auth trigger created a
-- restricted profile first, which prevented initial admin bootstrap and caused
-- duplicate-email errors during administrator-created invitations.
drop trigger if exists on_auth_user_created on auth.users;
--> statement-breakpoint
drop function if exists public.handle_new_auth_user();
