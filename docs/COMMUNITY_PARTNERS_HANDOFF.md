# CivicSync Community Partners frontend handoff

This guide maps Community Partner responsibilities to current routes and files, describes intended permissions, and marks preview-only behavior. A group is one of CivicSync’s three primary roles. Only approved groups may accept tasks or manage public work pages. Group task progress never changes official government issue/project status.

## Group capabilities

Groups apply for approval, maintain eligible-work and service-area profiles, discover suitable issues, accept or refer work, post progress and evidence, submit completion claims, respond to independent community confirmation/disputes, maintain public work history, and request simulated sponsorship. Group members have roles within their organization; an authorized owner/editor should manage its public page.

Groups must select work within their capabilities. Specialist or government-authority work should be referred. Groups cannot verify their own completion as independent community members, change official issue/project status, publish official projects, or apply Admin penalties.

## Screen and action matrix

| Group job | Screen / files | Intended group actions | Current state |
|---|---|---|---|
| Browse approved groups and public profiles | `/community-partners`, `/community-partners/[slug]` · `app/community-partners/page.tsx`, `app/community-partners/[slug]/page.tsx` | Public sees approved profiles, service areas, contact option, and explicitly published task updates | Supabase-backed profiles and public task history; public evidence is a separate sanitized copy with a short-lived link |
| Apply for group registration | `/community-partners/apply`, `/community-partners/application-status` | Signed-in common account submits group details and optional private evidence; applicant can view status and respond to requests for information | Persisted through scoped Supabase functions. Admin review includes private evidence links. |
| Maintain group profile and capabilities | `/community-partners/dashboard/settings` | Approved members update profile, coverage exclusions, and group membership | Persisted Supabase workflows with owner/editor permissions |
| Discover suitable issue work | `/community-partners/dashboard` · `app/community-partners/dashboard/page.tsx` | Browse suitable opportunities, view issue details, accept or refer work | Supabase-backed opportunities and task actions; protected operations verify role and group membership |
| Accept work as a group | `/community-partners/dashboard` | Approved member accepts eligible work; prevent conflicting uncoordinated claims | Persisted and checked against approval, capabilities, service area, and active-task uniqueness |
| Track adopted and active work | `/community-partners/dashboard/tasks` · `app/community-partners/dashboard/tasks/page.tsx` | Post progress notes/evidence and preserve actor/time history | Persisted task events and private evidence. Progress and completion forms keep separate notes and files. |
| Submit completion claim | `/community-partners/dashboard/tasks` | Submit completion with evidence and move task to awaiting confirmation | Persisted claim and private evidence; confirmation remains separate from official issue review |
| Handle independent community response | Neighbourhood issue detail and `/community-partners/dashboard/tasks` | Common users outside the claiming group confirm/dispute; group may withdraw or update work when appropriate | Persisted confirmation endpoint enforces independence; task status remains separate from issue status |
| Refer work needing officials/specialists | `/community-partners/dashboard` | Refer unsuitable issue with reason; referral does not imply task assignment | Persisted referral with destination and reason |
| Publish public work history and evidence | `/community-partners/dashboard/tasks`, `/community-partners/[slug]` | Authorized approved member publishes a separate summary and optional sanitized evidence copy | Persisted public update. Private task notes/original evidence remain restricted to group members. |
| Contact another group or coordinate joint work | `/community-partners/dashboard`, `/community-partners/dashboard/settings` | Ask for collaboration; accept/decline explicitly; prevent accidental duplicate claims | Persisted request and response workflow; acceptance does not silently merge task claims |
| Create sponsorship request and report use | `/community-partners/dashboard/campaigns`; public `/sponsorship` | State purpose, target, intended activity; record simulated pledges and use updates | Persisted simulated campaign and pledge/use records; no money moves |
| Manage group membership | `/community-partners/dashboard/settings` | Owner invites/removes members and grants editor/viewer roles; revoke access when needed | Persisted invitations, membership permissions, and revocation functions |

## Permission model

- Pending/rejected groups may view public pages but cannot accept tasks or manage public work pages.
- Only approved members with suitable group permission may change that group’s profile, tasks, campaign, or evidence. Owner/editor/viewer boundaries must be enforced on the server.
- Work acceptance must check group capabilities, service area, limitations, and existing task claims. Specialist work routes to official action.
- Group progress/completion is a claim in its own lifecycle. Independent confirmation must come from an eligible Neighbourhood account outside the claiming group.
- A group cannot change official issue review, project status, restoration approval, government responses, or Admin scope.
- A group task’s status is independent of a linked issue. Group completion never automatically resolves the issue.
- Do not expose private member data or original private evidence on public pages by default.
- Hiding controls is not authorization; enforce group ownership/approval on every protected action using server checks and RLS.

## Frontend ownership and backend needs

Vineel owns `app/community-partners/`, `components/community-partners/`, and `lib/mock-api/community-partners.ts`. Group/task shared types are `CommunityGroup`, `GroupTask`, and `GroupTaskStatus` in `lib/domain/types.ts`; the frozen `CommunityPartnersApi` interface is in `lib/contracts/v1.ts`. Demo records/ranking are in `lib/domain/demo-data.ts` and `lib/services/issues.ts`. Coordinate shared services, Supabase/RLS, global navigation, public sponsorship pages, and migrations with their owners.

Remaining work: complete automated coverage for cross-group edits, duplicate claims, self-confirmation, and task completion not closing official issues; verify the full workflow against a dedicated Supabase project; apply all ordered migrations in any environment that needs the current schema. Admin department/jurisdiction scoping is a separate outstanding Admin feature.

## Suggested frontend sequence

1. Add group application and approval-status view.
2. Add dashboard/profile editor, capability/service-area filters, and member settings.
3. Build opportunity cards showing urgency, observation count, age, location, suitability, and official review status.
4. Add accept/refer dialogs and separate task cards for each accepted item.
5. Add progress/completion evidence and public work-history detail.
6. Move community confirmation to a public Neighbourhood task detail.
7. Add campaign request, simulated pledge history, and funding-use updates.

