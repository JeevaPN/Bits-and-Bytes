# CivicSync core data model

The migration `supabase/migrations/202610100001_core.sql` defines the initial Postgres/PostGIS schema and enables RLS on every application table.

| Entity | Purpose and key rules |
|---|---|
| `profiles`, `admin_scopes` | Auth-linked identity and one of three roles; admin scopes carry department/area authority. A production invitation flow must provision Admin roles server-side. |
| `social_groups`, `group_members` | Group profile, pending/approved state, service area, capabilities, and owner/editor/viewer membership. Only approved members may act for a group. |
| `street_segments`, `projects`, `project_segments` | Persistent street identity, official public works, and many-to-many affected roads. Projects preserve original and revised expected dates. Geometry uses PostGIS geography. |
| `project_events`, `coordination_cases` | Append-only project timeline and explicit conflict reasoning/decisions for Dig-Once coordination. |
| `issues`, `issue_verifications`, `issue_project_matches`, `official_reviews` | Citizen/external/detector observations, unique per-user verification, separate suggested/reviewed project links, and decision history. Reporter identity is not a public column in page view models. |
| `group_tasks`, `group_task_events`, `group_task_confirmations` | Separate group work lifecycle and actor history; confirmations require Neighbourhood and are independent of official review. |
| `sponsorship_campaigns`, `sponsorship_pledges` | Group campaigns and pledges constrained to simulated records. |
| `project_follows` | Optional unique user/project follow. |

Indexes cover common status/date queries and spatial proximity candidates. The migration includes coordinate validity through PostGIS types, nonnegative budgets, valid date ordering, one verification per issue/user, one confirmation per task/user, and simulated pledge checks. Deployment hardening should move sensitive writes to authorized server handlers/transactions and add application-specific grant review, storage bucket policies, abuse controls and DB tests before real users are invited.

Status is intentionally split: issue review (`issue_review_status`), project lifecycle (`project_status`), group task lifecycle (`group_task_status`), and confirmation (`confirmation_status`). Neither group completion nor project completion mutates an issue automatically.
