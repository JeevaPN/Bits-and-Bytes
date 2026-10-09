# CivicSync Admin frontend handoff

This guide maps Admin responsibilities to the current UI, describes the intended permission boundary, and distinguishes working preview behavior from actions that still need backend implementation. It is for the frontend teammate; the server and database remain the authority for access decisions.

## Admin role and permission model

CivicSync has three primary roles: **Admin**, **Neighbourhood**, and **Community Partners**. An Admin is authorized government or civic staff. Do not add a fourth product role for platform staff. Sponsorship belongs to Neighbourhood accounts.

Admin permissions should be scoped by both:

- **Department**, such as Roads & Infrastructure or Electrical Services.
- **Jurisdiction**, such as a ward, district, or configured service area.

An Admin may only read or change records within their assigned scope and granted action permissions. A role label alone does not authorize every Admin action. The backend must check identity, action, record scope, and current lifecycle state on every protected read/write. Hiding a control in the UI is only a usability measure, not authorization.

The current migration has an `admin_scopes` placeholder for department/area values, but the app has no Admin sign-in, scope resolution, permission middleware, or protected server actions yet. The route currently displays sample data to any visitor and must be treated as a prototype.

## Screen and action matrix

| Admin job | Screen / files | Intended allowed actions (after authorization exists) | Current state |
|---|---|---|---|
| Review workload, project states, urgent reports, and due inspections | `/admin` · `app/admin/page.tsx` | Read dashboard metrics and records within assigned department/jurisdiction; open the relevant queue | Demo counts and links only |
| Browse and manage official projects | `/admin/projects` · `app/admin/projects/page.tsx` | Read in-scope records; create/edit drafts; publish only when the staff member has publication authority; update status, dates, contractor, closure and approved public details | Demo table; no filters, edit action, persistence, scope check, or publish workflow |
| Create an official project | `/admin/projects/new` · `app/admin/projects/new/page.tsx`, `components/admin/project-form.tsx` | Validate required project details and coordinate/date ranges; save a draft; publish through the authorized publication step; retain original promised dates and append revisions to history | Form captures a browser-only preview message; it does not save, validate through a server, create a QR record, or publish |
| Publish project progress, milestones, delay reasons, and evidence | Project detail/edit experience (not scaffolded yet) | Authorized project editors record updates and evidence; preserve original and revised dates; publish only approved public information | Not implemented; current public project page is demo data |
| Publish road closures and disruptions | Project edit/update experience (not scaffolded yet) | Authorized staff add or revise closure segments, effective dates, and public notes; label data freshness | Only a free-text optional field in the project draft form; no closure record or map integration |
| Review citizen reports and candidate external observations | `/admin/issues` · `app/admin/issues/page.tsx` | Read permitted evidence and report metadata; see community count separately from official status; inspect urgent flag, duplicate candidates, and suggested project matches | Demo queue; no auth, filters, evidence viewer, or external feed |
| Decide an issue’s official review | `/admin/issues` · `components/admin/demo-action.tsx`, shared types in `lib/domain/admin.ts` | Accept, reject, refer, request more information, or mark duplicate; require an authorized reviewer and reason; optionally record appropriate public response/referral/canonical issue; append decision history | Buttons show an alert explaining intended behavior; no decision is stored and no reason is collected |
| Review a suggested issue-to-project link | `/admin/issues` · `app/admin/issues/page.tsx` | Approve or reject the relationship with a reason, separately from the issue validity decision | A possible match is displayed as demo text; no match decision control or stored result |
| Create Dig-Once coordination cases | `/admin/coordination` · `app/admin/coordination/page.tsx` | Review conflict explanation and linked projects/segments; create a case; propose a shared schedule; record participating departments’ accept/reject/change decisions and reasons; preserve original commitments | Demo conflict card and alert-only buttons; no conflict engine, scope checks, case creation, or schedule persistence |
| Schedule and record restoration inspections | `/admin/restoration` · `app/admin/restoration/page.tsx` | Schedule inspection after declared construction completion; record inspector, date, pass/defect result, and evidence; create remediation and reinspection follow-up | Demo inspection card and alert-only actions; no inspection records are written |
| Approve and moderate group applications | `/admin/groups` · `app/admin/groups/page.tsx` | Review application; approve, reject, request information, or suspend with a reason; only authorized reviewers change approval; retain decision history | Demo applications and alert-only buttons; no application flow or state changes |
| Review sponsorship requests (if platform policy requires it) | Not scaffolded yet | Apply configured eligibility/moderation rules; record reviewer and reason; never process payments in this demo | Not implemented. Current sponsorship pledges are simulated only. |
| View audit history and export reports | Not scaffolded yet | Read an in-scope audit timeline; export only records the Admin is authorized to access | Not implemented |

## Lifecycle boundaries the UI must preserve

- Community verification count is not a truth score and does not change official review status.
- An issue can exist without a project match. Match approval and issue validity are separate decisions.
- A group’s accepted/completed task does not accept or close a government issue.
- A government project’s construction completion does not approve road restoration or close unrelated reports.
- Restoration inspection, remediation, and reinspection have their own status and evidence.
- A coordination warning is a candidate conflict. A staff member must review and record the outcome; the system must not silently rewrite schedules.
- Reporter identity, private contact details, private review notes, and original evidence must not appear in public views by default.
- External/detector observations remain labelled candidates with source/provenance and observation time; the feed is optional.

## Frontend contracts and ownership

- Route navigation and shell: `app/admin/layout.tsx`.
- Admin routes: `app/admin/`.
- Admin-only components: `components/admin/`.
- Admin request/status contracts: `lib/domain/admin.ts`.
- Frozen cross-role API interface: `lib/contracts/v1.ts`; Admin mock adapter: `lib/mock-api/admin.ts`.
- Example records: `lib/domain/admin-demo-data.ts`.
- Database scope placeholder: `admin_scopes` in `supabase/migrations/202610100001_core.sql`.

Frontend work may add local presentation state, forms, filters, and empty/loading/error states within `app/admin/` and `components/admin/`. Coordinate changes to shared domain types, schemas, services, Supabase clients, global layout, and migrations with the shared owner. Use the existing contracts (`CreateProjectInput`, `AdminIssueActionInput`, `AdminActionResult<T>`) as starting points; agree on any contract changes before wiring routes.

## Backend work required before real Admin actions

1. Implement authenticated Admin identity and a trusted way to grant/revoke Admin accounts; public self-registration must not allow users to choose the Admin role.
2. Resolve department and jurisdiction scopes on the server. Check them for every protected read/write and constrain queries to in-scope records.
3. Add validated server actions/route handlers for each action above. Validate dates, coordinates, allowed status transitions, evidence type/size, and required decision reasons.
4. Record actor, timestamp, scope/context, old/new values or decision, and reason in append-only event/review history.
5. Use database transactions for actions that update a record and append its audit event together.
6. Add RLS policies and storage policies that match the same ownership/scope model. Do not use a service-role key in browser code.
7. Add abuse/rate controls and tests for cross-department access and forbidden role actions before production use.

## Suggested frontend sequence

1. Finish the overview and responsive Admin navigation.
2. Build project list filters and a complete create/edit draft experience using `CreateProjectInput`.
3. Build the issue review detail and decision dialog; require a reason for every decision and keep official status separate from observations.
4. Add coordination and restoration forms with explicit history and evidence sections.
5. Add group application review and status views.
6. Connect to server actions only after their authorization contracts are agreed and implemented.

All current records and actions in these screens are demo-only. Do not present an alert or local form state as a saved government decision.
