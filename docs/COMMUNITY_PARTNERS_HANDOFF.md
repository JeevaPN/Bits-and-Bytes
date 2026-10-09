# CivicSync Community Partners frontend handoff

This guide maps Community Partner responsibilities to current routes and files, describes intended permissions, and marks preview-only behavior. A group is one of CivicSync’s three primary roles. Only approved groups may accept tasks or manage public work pages. Group task progress never changes official government issue/project status.

## Group capabilities

Groups apply for approval, maintain eligible-work and service-area profiles, discover suitable issues, accept or refer work, post progress and evidence, submit completion claims, respond to independent community confirmation/disputes, maintain public work history, and request simulated sponsorship. Group members have roles within their organization; an authorized owner/editor should manage its public page.

Groups must select work within their capabilities. Specialist or government-authority work should be referred. Groups cannot verify their own completion as independent community members, change official issue/project status, publish official projects, or apply Admin penalties.

## Screen and action matrix

| Group job | Screen / files | Intended group actions | Current state |
|---|---|---|---|
| Browse approved groups and public profiles | `/community-partners`, `/community-partners/[slug]` · `app/community-partners/page.tsx`, `app/community-partners/[slug]/page.tsx` | Public sees approved profiles, service areas, suitable work, contact option, and adopted/ongoing/completed history | Demo fixtures; history is one illustrative item and is not persisted |
| Apply for group registration | Application route (not scaffolded yet); directory has demo contact prompt | Submit identity, service area, contacts, capabilities, limitations, and evidence for Admin review | No form or persisted application; prompt uses an example mail link |
| Maintain group profile and capabilities | Group dashboard/profile editor (not scaffolded yet) | Approved members update description, contact, area, eligible work, and membership | Public profile is read-only demo data; no editor/member management |
| Discover suitable issue work | `/community-partners/dashboard` · `app/community-partners/dashboard/page.tsx` | Browse safety urgency separately from popularity; view location/category/description/count/age/status; accept suitable or refer unsuitable work | In-memory fixtures sort urgency, count, age; alerts only; no capability filters or assigned group identity |
| Accept work as a group | `/community-partners/dashboard` | Approved member accepts eligible work; prevent conflicting uncoordinated claims | Alert only; no auth, selected group, suitability check, or persistence |
| Track adopted and active work | `/community-partners/dashboard/tasks` · `app/community-partners/dashboard/tasks/page.tsx` | Move accepted work in progress; post progress notes/evidence; preserve actor/time history | Local state only; shared across rendered cards; no note form, upload, or history |
| Submit completion claim | `/community-partners/dashboard/tasks` | Submit completion with evidence and move task to awaiting confirmation | Local state and file picker only; no upload or saved event |
| Handle independent community response | Public task detail (not scaffolded yet) | View confirmation/dispute; update or reopen group work when needed | Confirm/dispute preview buttons are currently in group dashboard; no Neighbourhood identity/eligibility check |
| Refer work needing officials/specialists | `/community-partners/dashboard` | Refer unsuitable issue with reason; referral does not imply task assignment | Alert only; no reason, routing, or saved status |
| Publish public work history and evidence | `/community-partners/[slug]` | Authorized approved member publishes progress and permitted evidence | Illustrative fixture only; no editing or media controls |
| Contact another group or coordinate joint work | Opportunity/task screen (not scaffolded yet) | Ask for collaboration; accept/decline/referral explicitly; prevent accidental duplicate claims | Not implemented |
| Create sponsorship request and report use | Group campaign screen (not scaffolded yet); public `/sponsorship` | State purpose, target, intended activity; report progress and use with history | No group campaign editor or use report; public simulated pledge changes local state only |
| Manage group membership | Group settings (not scaffolded yet) | Owner invites/removes members and grants viewer/editor roles; revoke access when needed | `group_members` table placeholder only; no interface or invitation flow |

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

The group teammate owns `app/community-partners/` and `components/community-partners/` (create this folder for group-only components). Group/task shared types are `CommunityGroup`, `GroupTask`, and `GroupTaskStatus` in `lib/domain/types.ts`; demo records/ranking are in `lib/domain/demo-data.ts` and `lib/services/issues.ts`. Coordinate shared contracts, services, Supabase/RLS, global navigation, public sponsorship pages, and migrations with their owners.

Before real group actions: implement group application and Admin decisions; authenticated membership and permissions; suitable opportunity queries and safety triage; atomic task acceptance; progress/completion event writes and evidence controls; independent confirmation that blocks group members; referral/reopen workflows; simulated-only campaign and pledge history; server and RLS authorization; and tests for cross-group edits, duplicate claims, self-confirmation, and task completion not closing official issues.

## Suggested frontend sequence

1. Add group application and approval-status view.
2. Add dashboard/profile editor, capability/service-area filters, and member settings.
3. Build opportunity cards showing urgency, observation count, age, location, suitability, and official review status.
4. Add accept/refer dialogs and separate task cards for each accepted item.
5. Add progress/completion evidence and public work-history detail.
6. Move community confirmation to a public Neighbourhood task detail.
7. Add campaign request, simulated pledge history, and funding-use updates.

