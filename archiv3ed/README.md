# archiv3ed

Cold storage for code that's been pulled out of the live app but is
worth keeping around in case we want to revive it. Files here are not
compiled, linted, tested, or shipped — `tsconfig.json` and the eslint
config both exclude this folder. To restore something, `git mv` it back
into `src/` along the same relative path.

## What's in here

### Multi-tenant org system (archived 2026-04-29)

The original plan was to scope event metadata, claim approvals, and
imports to per-tenant "organizations" (running clubs, race series,
media outlets) so multiple operators could share Bedrock.fit without
seeing each other's data. The schema, server actions, library helpers,
and admin UI all landed, but the create-org and invite flows were never
wired up end-to-end — a magic-link user with no org membership got
bounced to `/admin/login` before they could reach the create form.

For v1 we only have one operator, so the org abstraction was earning
its keep in maintenance overhead and producing zero value. Pulled it
out wholesale; the legacy admin password is now the only gate on
admin actions.

Archived files (paths preserved relative to repo root):

  src/app/admin/org/page.tsx
  src/app/admin/org/create-org-form.tsx
  src/app/admin/org/invite-form.tsx
  src/app/auth/invite/accept/route.ts
  src/app/actions/org.ts
  src/lib/org.ts
  src/lib/org.test.ts

What's *not* archived (deliberately):

  - `organizations`, `org_members`, `org_invites` tables in
    `src/db/schema.ts` and migration 0004. Empty in production, cheap
    to keep, and ripping them out would require a migration we don't
    need right now.
  - `event_metadata.owner_org_id` column. Still in the schema, will
    be NULL on every new row going forward. Same reasoning.

## Reviving the org system

In rough order:

  1. `git mv archiv3ed/src/<path> src/<path>` for each file above.
  2. In `src/app/admin/admin-header.tsx`, re-add the `Org` nav item to
     `NAV_ITEMS`.
  3. In `src/app/admin/page.tsx`, `src/app/admin/events/page.tsx`,
     `src/app/admin/events/edit/page.tsx`, `src/app/admin/import/page.tsx`,
     `src/app/actions/events.ts`, `src/app/actions/import.ts`, and
     `src/app/actions/admin.ts`, swap `requireAdmin()` calls back to
     `requireOrgOrAdmin()` and re-introduce the org-scoping branches
     (`canEditEventMetadata`, `findOwnerOrgId`, `ownerOrgIdForCreate`,
     scoped pending-claims and event-list queries). Git blame on the
     pre-removal commit is the easiest reference.
  4. Wire the create-org form into `/admin/org` for the no-membership
     branch — the missing step that broke the original flow. The form
     component itself already exists in `archiv3ed/.../create-org-form.tsx`
     and just needs a parent that renders it when
     `getActiveOrgForUser()` returns null.
  5. Re-enable in `tsconfig.json` `exclude` and `eslint.config.mjs`
     `globalIgnores` (drop the `archiv3ed/**` entries).
  6. Run tests + typecheck + lint.
