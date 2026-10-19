# Socflow CRM HTTP API

This guide describes the endpoints implemented in `app/api` for connecting a website or another application to this CRM. Replace `https://crm.example.com` with the address of your Socflow deployment. Paths and method names below match the current code; the API is not versioned.

## Authentication and website integration

Every endpoint below requires `Authorization: Bearer <access_token>`, where the token is a **Supabase Auth access token**. Normally the user must also have an active account in the CRM `users` table with the listed permission. The only exception is first-account setup through `POST /api/users` when that table is empty. The Supabase anon key alone is not an API credential. `GET /api/me` can confirm which CRM account a token belongs to.

For a website used by CRM staff, sign the staff member in through the same Supabase project and send their current access token with each request. Refresh expired tokens through the normal Supabase Auth session flow. For a separate website domain, make calls through your website's server or configure cross-origin access on the CRM deployment; these routes do not currently set CORS headers. Keep tokens on a trusted server whenever possible, especially for write operations. Never put an administrator token, password, service-role key, or `DATABASE_URL` in public website JavaScript.

**Public visitor forms are not supported by this API yet.** In particular, there is no `POST /api/events/{id}/registrations` or `POST /api/emails`, and `POST /api/inductions` requires a CRM user with `inductions` permission. To let anonymous visitors submit event registrations, contact messages, or inductions, the CRM needs purpose-built public submission endpoints with validation and abuse protection. Do not give visitors a shared CRM account token.

### Request example

```bash
curl 'https://crm.example.com/api/events?all=true' \
  -H "Authorization: Bearer $CRM_ACCESS_TOKEN"
```

For `POST` and `PATCH`, also send `Content-Type: application/json` and a JSON body:

```bash
curl -X POST 'https://crm.example.com/api/leads' \
  -H "Authorization: Bearer $CRM_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Website enquiries"}'
```

The sample token is a short-lived **user** access token, not a permanent API key. Responses are JSON. Most successful responses contain `success: true`; `/api/me` returns a `user` object without that flag. Authentication failures return `401 {"error":"Unauthorized"}`; a missing/disabled CRM account or insufficient permission returns `403 {"error":"Forbidden"}`. A missing auth configuration returns 503. Some validation errors return 400, duplicate users return 409, and database/mail failures may return 500. Check the HTTP status as well as the response body.

List endpoints use zero-based `page` (default `0`) and `limit` (default `10`) where noted. `total` is the number of matching records before pagination. IDs in path/query parameters are numeric except the society ID, which is a UUID. Boolean fields use JSON `true`, `false`, or `null`.

## Endpoint reference

Permission names below refer to the CRM role matrix. `events` means that section is enabled; `events.viewRegistrations` means both the section and its named permission are enabled.

### Account and dashboard

| Method | Endpoint | Request | Response | Permission |
| --- | --- | --- | --- | --- |
| GET | `/api/me` | None | `user` object with `id`, `userId`, `name`, `email`, `role`, `permissions` | Active CRM account |
| GET | `/api/dashboard` | None | `{ success, events, rawEventResponses, rawCompResponses, inductionResponses, inductionAccepted, membersResponses, membersActive, totalRegistrations }` | `dashboard.viewStats` |

`/api/dashboard` includes personal data from registrations, inductions, and members. Use it only in staff views.

### Events

| Method | Endpoint | Request | Response | Permission |
| --- | --- | --- | --- | --- |
| GET | `/api/events` | Query: `page`, `limit`, `search`, `all=true` to skip pagination | `{ success, events, total }`; each event includes `responseCount` | `events` |
| POST | `/api/events` | Event JSON; `title` is required | `{ success, event }` | `events.createEvent` |
| GET | `/api/events/{id}` | Numeric event ID | `{ success, event }`; `event` is `null` if missing | `events` |
| PATCH | `/api/events/{id}` | Event fields to change | `{ success, event }` | `events.editEvent` |
| DELETE | `/api/events/{id}` | Numeric event ID | `{ success, id }` | `events.deleteEvent` |

Event JSON fields: `title` (required string), `description`, `date`, `time`, `speaker`, `location`, `link_primary`, `link_secondary`, `img_url`, `is_competition` (boolean), `linkone_text`, and `linktwo_text`. `date` and `time` are stored as text; this API does not enforce a format. `GET /api/events` searches title, speaker, and location.

### Event registrations, winners, and certificates

| Method | Endpoint | Request | Response | Permission |
| --- | --- | --- | --- | --- |
| GET | `/api/events/{id}/registrations` | Query: `isCompetition=true` for competition responses; otherwise regular responses | `{ success, registrations }` | `events.viewRegistrations` |
| PATCH | `/api/events/{id}/registrations` | `{ "registrationId": 12, "attended": true, "isCompetition": false }` | `{ success, registrationId, attended }` | `events.editEvent` |
| DELETE | `/api/events/{id}/registrations` | Query: `registrationId`, optional `isCompetition=true` | `{ success, registrationId }` | `events.deleteEvent` |
| GET | `/api/events/{id}/winners` | None | `{ success, winners }` | `events.viewRegistrations` |
| POST | `/api/events/{id}/winners` | `{ "response_id": 12, "position": 1, "img_url": "..." }` | `{ success, winner }` | `events.selectWinners` |
| DELETE | `/api/events/{id}/winners` | Query: `winnerId` | `{ success, winnerId }` | `events.selectWinners` |
| GET | `/api/events/{id}/certifications` | Query: `name` (exact match) | `{ success, certificate }`; `null` if missing | `events.viewRegistrations` |
| POST | `/api/events/{id}/certifications` | `{ "name": "Recipient", "code": "CERT-001" }` | `{ success, certificate }` | `events.generateCertificates` |

The event ID in the path selects registration/winner/certificate lists and is written into new winners and certificates. For registration `PATCH` and `DELETE`, the handler acts on `registrationId`; callers should ensure it belongs to the intended event. Regular registration rows expose `event_id`, `name`, `email`, `phone`, `roll_no`, `status`, `attended`, `registered_at`, and `referred`. Competition rows expose `event_id`, `team_name`, `member_one_name`, `member_one_rollno`, `member_one_numail`, `member_two_name`, `member_two_rollno`, `member_two_numail`, `status`, `link`, `registered_at`, and `attended`. There is currently no API method to create a registration.

### Inductions

| Method | Endpoint | Request | Response | Permission |
| --- | --- | --- | --- | --- |
| GET | `/api/inductions` | Query: `page`, `limit`, `search`, `status=all\|selected\|rejected\|waiting`, `team=all` or team name; `stats=true` returns counts instead of rows | `{ success, data, total }` or `{ success, stats: { total, selected, rejected, waiting } }` | `inductions.readOnly` |
| POST | `/api/inductions` | Induction JSON, described below | `{ success, induction }` | `inductions` |
| PATCH | `/api/inductions` | `{ "id": 12, "status": true }` | `{ success, induction }` | `inductions.changeStatus` |
| DELETE | `/api/inductions` | Query: `id` | `{ success, id }` | `inductions.deleteResponse` |

Induction JSON fields: `name`, `roll_no`, `email`, `phone`, `skills`, `experience`, `status` (`true` selected, `false` rejected, `null` waiting), `team`, and `registered_at` (timestamp). The database schema currently does not require a particular field for this insert. This write endpoint is for authorized staff integrations, not anonymous application forms.

### Members

| Method | Endpoint | Request | Response | Permission |
| --- | --- | --- | --- | --- |
| GET | `/api/members` | Query: `page`, `limit`, `search`, `status=all\|active\|inactive`, `team=all` or team name; `stats=true` for counts | `{ success, data, total }` or `{ success, stats: { total, active, inactive } }` | `members.readOnly` |
| POST | `/api/members` | Member JSON; `name` required | `{ success, member }` | `members` |
| PATCH | `/api/members` | `{ "id": 12, ...fieldsToUpdate }` | `{ success, member }` | `members.changeStatus` |
| DELETE | `/api/members` | Query: `id` | `{ success, id }` | `members.deleteMember` |

Member fields: `name`, `email`, `phone`, `roll_no`, `status` (boolean, defaults to true), and `team`. `PATCH` accepts member fields in addition to `status`.

### Lead categories and their members

| Method | Endpoint | Request | Response | Permission |
| --- | --- | --- | --- | --- |
| GET | `/api/leads` | Query: `page`, `limit`, `search` (title) | `{ success, leads, total }`; each lead includes `memberCount` | `leads.readOnly` |
| POST | `/api/leads` | `{ "title": "Sponsors" }` | `{ success, lead }` | `leads.addMember` |
| PATCH | `/api/leads` | `{ "id": 12, "title": "Partners" }` | `{ success, lead }` | `leads.changeStatus` |
| DELETE | `/api/leads` | Query: `id` | `{ success, id }` | `leads.deleteLead` |
| GET | `/api/leads/{id}/members` | Lead category ID | `{ success, members }` | `leads.readOnly` |
| POST | `/api/leads/{id}/members` | Lead member JSON | `{ success, member }` | `leads.addMember` |
| PATCH | `/api/leads/{id}/members` | `{ "id": 12, ...fieldsToUpdate }` | `{ success, member }` | `leads.changeStatus` |
| DELETE | `/api/leads/{id}/members` | Query: `memberId` | `{ success, memberId }` | `leads.deleteLead` |

Lead member fields: `name`, `avatar`, `designation`, `linkedin`, `email`, `phone`, `roll_no`, and `status` (boolean, defaults to true). The `{id}` path supplies `lead_id` when creating a member. A lead category only has `id` and `title`.

### Contact messages and outbound email

| Method | Endpoint | Request | Response | Permission |
| --- | --- | --- | --- | --- |
| GET | `/api/emails` | Query: `page`, `limit`, `search`, `status=all\|responded\|on_hold\|waiting` | `{ success, data, total }` | `emails.viewResponses` |
| PATCH | `/api/emails` | `{ "id": 12, "status": true }` | `{ success, email }` | `emails.changeStatus` |
| DELETE | `/api/emails` | Query: `id` | `{ success, id }` | `emails.deleteEmail` |
| POST | `/api/SendEmail` | `{ "to": "person@example.com", "subject": "Hello", "html": "<p>Hello</p>", "fromName": "Team", "attachments": [] }` | `{ message, sent, failed, success, results }` | Any of `emails.sendEmail`, `inductions.sendEmails`, `events.createEvent`, `events.generateCertificates` |

`GET /api/emails` records include `name`, `email`, `subject`, `message`, `status`, plus compatibility aliases `Name`, `Email`, `Subject`, `Message`, and `created_at`. Status is `true` for responded, `false` for on hold, and `null` for waiting. There is no `POST /api/emails` endpoint for a public contact form.

`/api/SendEmail` is case-sensitive. `to` may be a string separated by commas/semicolons, an array of email strings, or an array of objects with `email`, `to`, or `value`. Each attachment must have `filename`, base64 `content`, and `encoding: "base64"`; at most 10 attachments are accepted. SMTP must be configured in CRM settings or environment variables. Check `failed` and per-recipient `results` even when the HTTP response is 200.

### Society and settings

| Method | Endpoint | Request | Response | Permission |
| --- | --- | --- | --- | --- |
| GET | `/api/societies` | None | `{ success, society }`; `null` if absent | `emails` |
| POST | `/api/societies` | Society JSON; optional `id` to update that society | `{ success, society }` | `emails.manageSettings` |
| GET | `/api/settings` | None | `{ success, settings: { id, induction, upcomingevent, upcomingeventstatus } }` | `dashboard.viewStats` |
| POST | `/api/settings` | One or more booleans: `induction`, `upcomingevent`, `upcomingeventstatus` | `{ success, settings }` | `dashboard.quickSettings` |
| GET | `/api/settings?key={key}` | `key=email_template_config` or `smtp_delivery_config` | `{ success, settings }`; `null` if absent | `emails.manageSettings` |
| POST | `/api/settings?key={key}` | `{ "key": "email_template_config", "value": { ... } }` | `{ success, settings }` | `emails.manageSettings` |

Society fields: `name`, `username`, and `email` are required for creation; optional fields are `logo_url`, `cover_url`, `branding_color`, `instagram_url`, `linkedin_url`, and `website_url`. Social profile fields currently accept URL strings. For keyed settings, `value` must be an object. SMTP settings require `user` and `pass` strings and a host allowed by the server configuration. Treat SMTP settings and responses as secrets; only expose them to authorized administrators.

### CRM users

| Method | Endpoint | Request | Response | Permission |
| --- | --- | --- | --- | --- |
| GET | `/api/users` | None | `{ success, users }` | `users` |
| POST | `/api/users` | `{ "name": "Alex", "email": "alex@example.com", "password": "...", "role": "member", "permissionMatrix": { ... } }` | `{ success, user }` | `users.createUser`; special first-user setup below |
| PATCH | `/api/users` | `{ "id": 12, "role": "member", "permissions": { ... } }` | `{ success, user }` | `users.editRole` |
| DELETE | `/api/users` | Query: `id` | `{ success, id }` | `users.deleteUser` |

`name` and `email` are required on `POST`; `password` is optional. The server creates a Supabase Auth signup only when a password is supplied. Assigning `role` and `permissionMatrix` requires `users.editRole` in addition to the create permission; otherwise the new account receives a member role with no permissions. `permissionMatrix`/`permissions` represent the CRM permission matrix, not Supabase permissions. The first verified Supabase user may call `POST /api/users` with their own email to initialize an empty CRM installation as admin. This bootstrap path works only when the `users` table is empty. Deleting a user through this endpoint may also remove their Supabase Auth account; deleting the final Auth-backed user clears shared installation data according to the database migration.

## Current API boundaries

- There are no dedicated API keys, OAuth client credentials, or anonymous submission endpoints.
- The API does not currently offer `POST` for event/competition registrations or contact messages, or a public `GET` for events/society data.
- The `POST`/`PATCH` data routes largely pass JSON through to the database, so callers should send only documented fields with appropriate types. Do not assume the server will validate or normalize arbitrary input.
- Permission enforcement is per route and method. It does not currently restrict records by society/tenant ID; deploy separate instances or add tenant enforcement before connecting unrelated organizations to one CRM database.

For an external public website, a common next step is to add narrowly scoped public endpoints for the exact forms and public data you want to expose, then document their request schemas and abuse controls here.
