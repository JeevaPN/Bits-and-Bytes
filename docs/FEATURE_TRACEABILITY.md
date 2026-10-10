# CivicSync feature traceability

> Generated from docs/FEATURE_CHECKLIST.md. This is an evidence register, not a claim that the whole master scope is complete.
> Run npm run generate:traceability after checklist changes, then npm run validate:traceability.

| ID | Tags | Status | Implementation evidence | Test/verification evidence | Feature |
|---|---|---|---|---|---|
| CS-001 | D | PASS | app/page.tsx; app/layout.tsx | e2e/public-discovery.spec.ts; npm run build | [SYSTEM] CivicSync landing page explaining the platform and its purpose. |
| CS-002 | D | PASS | components/shared/header.tsx | npm run typecheck | [SYSTEM] Main navigation for Projects, Map, Report an Issue, Community Groups and Sponsorship. |
| CS-003 | D | PARTIAL | app/projects; app/map; app/neighbourhood | e2e/public-discovery.spec.ts | [COMMON] Public browsing of projects, issues and approved group pages without mandatory sign-in. |
| CS-004 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Responsive layouts for desktop, tablet and mobile. |
| CS-005 | D | PASS | lib/validation; lib/services; components/map/osm-map.tsx | tests/neighbourhood-api.test.ts; tests/map-coordinates.test.ts | [SYSTEM] Loading, empty, success, validation-error and failure states for major actions. |
| CS-006 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Consistent labels, icons, date formats and status indicators. |
| CS-007 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Search by street, landmark and project name. |
| CS-008 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Shareable public URLs for projects, issues, groups and sponsorship campaigns. |
| CS-009 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Pagination or efficient loading for large maps, lists and activity feeds. |
| CS-010 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Accessible forms, keyboard navigation, readable contrast and screen-reader labels. |
| CS-011 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Language support infrastructure, including configurable Indian regional languages. |
| CS-012 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Clearly labelled demo, simulated and externally sourced data where applicable. |
| CS-013 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Help text explaining verification counts, official review, group completion and sponsorship terminology. |
| CS-014 | D | PASS | lib/domain/types.ts; supabase/migrations/202610100001_core.sql | tests/auth-integrations.test.ts | [SYSTEM] Three primary role types: Admin, Common People and Social Service Groups. |
| CS-015 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Separate role-aware dashboard/navigation for each primary role. |
| CS-016 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Public project/QR browsing without account creation. |
| CS-017 | P | PARTIAL | app/auth; middleware.ts; lib/supabase/server.ts | tests/auth-integrations.test.ts | [COMMON] Account registration, sign-in, sign-out and account recovery. |
| CS-018 | P | PARTIAL | lib/supabase/admin-auth.ts; lib/auth/authorization.ts; app/admin/layout.tsx | tests/auth-integrations.test.ts; e2e/public-discovery.spec.ts | [SYSTEM] Server-side authorization for protected actions; hiding buttons is not sufficient. |
| CS-019 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Department and jurisdiction scopes for Admin permissions. |
| CS-020 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Authorized account creation/invitation or approval for government staff as appropriate. |
| CS-021 | P | PARTIAL | lib/supabase/community-partners.ts; app/community-partners | tests/auth-integrations.test.ts | [GROUP] Social-service group registration/application. |
| CS-022 | P | PARTIAL | supabase/migrations/202610100006_admin_workflows.sql; app/admin/groups/actions.ts | tests/auth-integrations.test.ts | [ADM] Approve, reject, request more information about or suspend group registrations, with recorded reasons. |
| CS-023 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Only approved group accounts can manage the public group page and accept group tasks. |
| CS-024 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Common People accounts can act as individual or organization sponsors without creating a fourth primary role. |
| CS-025 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Permission checks prevent people from modifying records outside their ownership or authority. |
| CS-026 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Session controls, failed-login protections and rate limiting. |
| CS-027 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Revocation of access when an account or group loses authorization. |
| CS-028 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Record the acting user and context for important role-protected operations. |
| CS-029 | D | NOT_IMPLEMENTED | — | — | [ADM] Create official project records. |
| CS-030 | D | NOT_IMPLEMENTED | — | — | [ADM] Record project title, description, work type and location. |
| CS-031 | D | NOT_IMPLEMENTED | — | — | [ADM] Record the responsible department and contractor. |
| CS-032 | D | NOT_IMPLEMENTED | — | — | [ADM] Record planned start date and expected completion date. |
| CS-033 | D | NOT_IMPLEMENTED | — | — | [ADM] Set or manage planned, active, delayed, completed and cancelled project states. |
| CS-034 | D | NOT_IMPLEMENTED | — | — | [ADM] Upload project progress and completion photos. |
| CS-035 | D | NOT_IMPLEMENTED | — | — | [ADM] Publish approved public project information. |
| CS-036 | D | PARTIAL | app/projects/[slug]/page.tsx | npm run typecheck; npm run build | [SYSTEM] Generate a unique QR code linking to each published project's stable public page. |
| CS-037 | D | NOT_IMPLEMENTED | — | — | [COMMON] Scan a worksite QR code and read project information without signing in. |
| CS-038 | P | NOT_IMPLEMENTED | — | — | [ADM] Record optional project budgets, scope and funding-source details. |
| CS-039 | P | NOT_IMPLEMENTED | — | — | [ADM] Maintain project milestones and their planned dates. |
| CS-040 | P | NOT_IMPLEMENTED | — | — | [ADM] Record actual milestone completion and supporting evidence. |
| CS-041 | P | NOT_IMPLEMENTED | — | — | [ADM] Record explanations for delays and revised completion dates. |
| CS-042 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Preserve the original promised date and the history of subsequent revisions. |
| CS-043 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Distinguish manually declared status from deadline-derived warnings such as At Risk or Overdue. |
| CS-044 | P | NOT_IMPLEMENTED | — | — | [ADM] Respond to citizen reports linked to government projects. |
| CS-045 | P | NOT_IMPLEMENTED | — | — | [ADM] Link a project to one or multiple affected street segments. |
| CS-046 | P | NOT_IMPLEMENTED | — | — | [ADM] Create drafts and use publication approval steps where the participating authority requires them. |
| CS-047 | P | NOT_IMPLEMENTED | — | — | [ADM] Import projects through validated spreadsheets or CSV files with row-level errors reported. |
| CS-048 | P | NOT_IMPLEMENTED | — | — | [ADM] Export authorized project reports and project history. |
| CS-049 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Maintain a persistent digital record for each supported street segment. |
| CS-050 | D | NOT_IMPLEMENTED | — | — | [COMMON] Show past, current and planned projects affecting a street segment. |
| CS-051 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Show previous excavation, resurfacing and recorded restoration events. |
| CS-052 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Show linked unresolved issues and reported defects. |
| CS-053 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Maintain evidence, dates and actors for important street-history events. |
| CS-054 | P | NOT_IMPLEMENTED | — | — | [ADM] Schedule restoration inspections after declared project completion. |
| CS-055 | P | NOT_IMPLEMENTED | — | — | [ADM] Record restoration inspection outcome, inspector, date and supporting evidence. |
| CS-056 | P | NOT_IMPLEMENTED | — | — | [ADM] Create remediation follow-ups when restoration defects are found. |
| CS-057 | P | NOT_IMPLEMENTED | — | — | [ADM] Record reinspection and final restoration outcome. |
| CS-058 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Keep construction completion separate from restoration approval. |
| CS-059 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Link a verified defect to the relevant project and responsible party when supported by the evidence and applicable authority. |
| CS-060 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Configure a post-restoration protection period used by the conflict engine. |
| CS-061 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Import authoritative road geometry and available utility-asset data under suitable access arrangements. |
| CS-062 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Compare project locations and schedules for potential conflicts. |
| CS-063 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Detect projects planned for the same road segment around overlapping dates. |
| CS-064 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Detect possible conflicts with nearby segments within a configurable geographic distance. |
| CS-065 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Flag proposed excavations affecting recently restored roads under configured rules. |
| CS-066 | D | NOT_IMPLEMENTED | — | — | [ADM] Show an explanatory conflict warning with links to the relevant projects. |
| CS-067 | D | NOT_IMPLEMENTED | — | — | [ADM] Create a coordination case from a detected conflict. |
| CS-068 | D | NOT_IMPLEMENTED | — | — | [ADM] Propose a shared schedule or joint-work review. |
| CS-069 | P | NOT_IMPLEMENTED | — | — | [ADM] Allow relevant departments to accept, reject or request changes to a coordination proposal. |
| CS-070 | P | NOT_IMPLEMENTED | — | — | [ADM] Record the decision, participating departments and reasons for acceptance or rejection. |
| CS-071 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Display coordinated dates on the shared work calendar and public project timeline. |
| CS-072 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Preserve original schedule commitments after coordination changes. |
| CS-073 | P | NOT_IMPLEMENTED | — | — | [ADM] Record justified emergency-excavation exceptions. |
| CS-074 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Recheck relevant conflicts when project dates or locations change. |
| CS-075 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Track coordination outcomes, including why some projects could not technically be combined. |
| CS-076 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Advanced geographic-overlap analysis using suitable road/utility geometry. |
| CS-077 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Connect with participating municipal or utility coordination systems where an appropriate integration is available. |
| CS-078 | D | PARTIAL | components/map/osm-map.tsx; lib/services/map-server.ts; app/api/map/route.ts | tests/map-coordinates.test.ts; e2e/public-discovery.spec.ts | [COMMON] Display official project locations on a shared map. |
| CS-079 | D | PASS | components/map/osm-map.tsx | tests/map-coordinates.test.ts | [COMMON] Display citizen issues and external observations as distinguishable marker types. |
| CS-080 | D | PASS | components/map/osm-map.tsx | npm run typecheck | [COMMON] Open a project or issue from its map marker. |
| CS-081 | D | PASS | components/map/osm-map.tsx | npm run typecheck | [COMMON] Search/filter by category, department, location and status. |
| CS-082 | D | NOT_IMPLEMENTED | — | — | [COMMON] Follow a project or location for updates. |
| CS-083 | D | NOT_IMPLEMENTED | — | — | [ADM] Publish affected road segments and known road closures. |
| CS-084 | D | NOT_IMPLEMENTED | — | — | [COMMON] View declared disruptions and known affected roads. |
| CS-085 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Suggest an alternative route that avoids known closed or blocked segments where the available road-network data supports it. |
| CS-086 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Display relevant project dates and the last-update time alongside disruption information. |
| CS-087 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Show an appropriate limitation message when route or closure data is missing, stale or incomplete. |
| CS-088 | P | NOT_IMPLEMENTED | — | — | [COMMON] Manage project-following and notification preferences. |
| CS-089 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Filter nearby issues/projects using geographic proximity. |
| CS-090 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Integrate live traffic data when a suitable provider is configured. |
| CS-091 | D | NOT_IMPLEMENTED | — | — | [COMMON] Submit reports for unlisted public works. |
| CS-092 | D | NOT_IMPLEMENTED | — | — | [COMMON] Submit reports for potholes, damaged roads/property, fallen trees, broken streetlights, open drains, leaks, garbage and blocked footpaths. |
| CS-093 | D | NOT_IMPLEMENTED | — | — | [COMMON] Record an issue's category, description, location and observation time. |
| CS-094 | D | NOT_IMPLEMENTED | — | — | [COMMON] Upload a photo as evidence. |
| CS-095 | P | NOT_IMPLEMENTED | — | — | [COMMON] Upload a video subject to configured file-size, type and safety limits. |
| CS-096 | D | PARTIAL | components/map/osm-map.tsx; lib/services/map-server.ts; supabase/migrations/202610100008_public_map_feed.sql | tests/map-coordinates.test.ts | [SYSTEM] Display reported issues on the public map with the correct source and status labels. |
| CS-097 | P | NOT_IMPLEMENTED | — | — | [COMMON] Let users correct a report's location or request a correction after submission. |
| CS-098 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Record the report source, creation time, evidence references and available location metadata. |
| CS-099 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Allow reports to remain visible and trackable even when no official project match exists. |
| CS-100 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Keep personal contact information and non-public evidence out of public report pages unless explicitly appropriate and authorized. |
| CS-101 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Accept pothole detections from a supported phone, dashcam or detector feed when available. |
| CS-102 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Store supplied detection timestamp, location accuracy, detector/source identifier and confidence information. |
| CS-103 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Display automatic detections as candidate observations rather than officially verified potholes. |
| CS-104 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Support externally reported pothole locations where access terms and coverage permit. |
| CS-105 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Label external records with source attribution and provenance. |
| CS-106 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Preserve external IDs where available, the import timestamp and the source's observation date where provided. |
| CS-107 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Match incoming records to possible existing CivicSync issues without blindly duplicating them. |
| CS-108 | P | NOT_IMPLEMENTED | — | — | [ADM] Review external or automatically detected observations using the same appropriate official review process. |
| CS-109 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Show external-data freshness and handle missing, malformed or unavailable feeds safely. |
| CS-110 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Keep native citizen reporting usable even when every external data source is unavailable. |
| CS-111 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Run scheduled incremental imports if the source offers a permitted and suitable access method. |
| CS-112 | D | NOT_IMPLEMENTED | — | — | [COMMON] Provide an "I verify this" action for a person who has actually observed the issue. |
| CS-113 | D | NOT_IMPLEMENTED | — | — | [COMMON] Display the community observation/verification count. |
| CS-114 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Show official review status separately from the community count. |
| CS-115 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Keep a report Unverified until it has received the relevant official review. |
| CS-116 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Prevent an eligible account from repeatedly verifying the same issue to inflate its count. |
| CS-117 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Suggest likely duplicate reports based on geographic proximity and issue category. |
| CS-118 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Use description similarity to improve possible duplicate detection. |
| CS-119 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Suggest related official projects using location, category and available text. |
| CS-120 | P | NOT_IMPLEMENTED | — | — | [ADM] Approve or reject a suggested report-to-project match and record the reason. |
| CS-121 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Keep an issue's validity and its relationship to a project as separate decisions. |
| CS-122 | D | PARTIAL | lib/services/neighbourhood-server.ts; app/api/neighbourhood/issues/[id]/challenge/route.ts | tests/neighbourhood-api.test.ts | [COMMON] Allow Common People to flag a report they believe is inaccurate or misleading. |
| CS-123 | P | NOT_IMPLEMENTED | — | — | [ADM] Review challenged reports and capture evidence or reasoning. |
| CS-124 | P | NOT_IMPLEMENTED | — | — | [ADM] Correct, reject, refer or request more information about reports where appropriate. |
| CS-125 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Preserve decision history and relevant reasons without disclosing confidential information. |
| CS-126 | P | NOT_IMPLEMENTED | — | — | [ADM] Apply penalties only after deliberate false reporting is established through a documented review. |
| CS-127 | P | NOT_IMPLEMENTED | — | — | [COMMON] Provide a correction or appeal mechanism where supported by the review policy. |
| CS-128 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Detect suspicious reporting/verification patterns and expose them for authorized review rather than automatic punishment. |
| CS-129 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Give high-risk safety reports an urgent triage path independent of popularity. |
| CS-130 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Avoid publicly exposing reporters' identities or unnecessary personal information. |
| CS-131 | D | NOT_IMPLEMENTED | — | — | [ADM] View citizen reports, external pothole observations and available automatic detections. |
| CS-132 | D | NOT_IMPLEMENTED | — | — | [ADM] Review report evidence, observation counts, duplicate suggestions and possible project matches. |
| CS-133 | D | NOT_IMPLEMENTED | — | — | [ADM] Accept an issue for official action. |
| CS-134 | D | NOT_IMPLEMENTED | — | — | [ADM] Request more information from the reporting user where possible. |
| CS-135 | D | NOT_IMPLEMENTED | — | — | [ADM] Reject an issue with an appropriate reason. |
| CS-136 | D | NOT_IMPLEMENTED | — | — | [ADM] Mark a report as a duplicate and link it to the canonical issue. |
| CS-137 | D | NOT_IMPLEMENTED | — | — | [ADM] Refer an issue to another appropriate department or authority, with a recorded reason. |
| CS-138 | D | NOT_IMPLEMENTED | — | — | [ADM] Record whether the department accepts responsibility, requires investigation or cannot act. |
| CS-139 | D | NOT_IMPLEMENTED | — | — | [ADM] Publish an appropriate response and relevant public status update. |
| CS-140 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Track response dates, assignments and status changes. |
| CS-141 | P | NOT_IMPLEMENTED | — | — | [ADM] Assign accepted issues to an authorized unit or responsible party. |
| CS-142 | P | NOT_IMPLEMENTED | — | — | [ADM] Attach remediation evidence and update the issue's resolution status. |
| CS-143 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Support resolution review, reopening and additional remediation when a claimed fix is inadequate. |
| CS-144 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Keep official issue resolution distinct from community confirmation and social-group completion. |
| CS-145 | D | NOT_IMPLEMENTED | — | — | [GROUP] Create a group registration/application. |
| CS-146 | D | NOT_IMPLEMENTED | — | — | [ADM] Review and approve or reject group registrations. |
| CS-147 | D | NOT_IMPLEMENTED | — | — | [GROUP] Maintain a public profile after approval. |
| CS-148 | D | NOT_IMPLEMENTED | — | — | [GROUP] Record group location, contact details and service areas. |
| CS-149 | P | NOT_IMPLEMENTED | — | — | [GROUP] Describe the group's eligible work types, capabilities and limitations. |
| CS-150 | D | NOT_IMPLEMENTED | — | — | [COMMON] Browse approved group pages. |
| CS-151 | D | NOT_IMPLEMENTED | — | — | [COMMON] View the group's taken-up issues, current work and completed work. |
| CS-152 | D | NOT_IMPLEMENTED | — | — | [GROUP] Publish progress updates and before-and-after evidence. |
| CS-153 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Display community confirmations and distinguish them from official inspection results. |
| CS-154 | P | NOT_IMPLEMENTED | — | — | [ADM] Moderate suspicious or impersonating group profiles and manage their approval status. |
| CS-155 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Preserve the group's public work history and material status changes. |
| CS-156 | P | NOT_IMPLEMENTED | — | — | [GROUP] Maintain group membership and control which members can update its public work page. |
| CS-157 | D | NOT_IMPLEMENTED | — | — | [GROUP] Browse suitable reported issues. |
| CS-158 | D | NOT_IMPLEMENTED | — | — | [GROUP] View issue location, category, description, community count, time since posting and current status. |
| CS-159 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Rank ordinary eligible issues primarily by independent community observations, then by posting age. |
| CS-160 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Apply safety/urgency overrides before ordinary ranking. |
| CS-161 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Filter opportunities by group location, service area, work type and suitability. |
| CS-162 | D | NOT_IMPLEMENTED | — | — | [GROUP] Accept a suitable issue as a group task. |
| CS-163 | D | NOT_IMPLEMENTED | — | — | [GROUP] Refer an unsuitable issue for official action. |
| CS-164 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Prevent multiple groups from unknowingly claiming the same work; allow coordinated joint work if approved. |
| CS-165 | D | NOT_IMPLEMENTED | — | — | [GROUP] Mark accepted work In Progress. |
| CS-166 | D | NOT_IMPLEMENTED | — | — | [GROUP] Post progress notes and evidence. |
| CS-167 | D | NOT_IMPLEMENTED | — | — | [GROUP] Submit work as completed, including completion evidence. |
| CS-168 | D | NOT_IMPLEMENTED | — | — | [COMMON] Confirm or dispute whether the group's claimed work appears complete, where eligible. |
| CS-169 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Keep Awaiting Confirmation, Confirmed, Disputed and Reopened outcomes distinct. |
| CS-170 | P | NOT_IMPLEMENTED | — | — | [GROUP] Reopen or update a group task when additional work is needed. |
| CS-171 | D | NOT_IMPLEMENTED | — | — | [COMMON] Contact a nearby group about an important issue using its published contact option. |
| CS-172 | P | NOT_IMPLEMENTED | — | — | [GROUP] Accept, decline or refer a contacted issue without implying that unaccepted work is assigned. |
| CS-173 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Keep group task status independent from the linked government issue/project lifecycle. |
| CS-174 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Record who performed material group-task updates and when. |
| CS-175 | D | NOT_IMPLEMENTED | — | — | [COMMON] Browse groups' historical and ongoing work before choosing whom to support. |
| CS-176 | D | NOT_IMPLEMENTED | — | — | [COMMON] Select a group or eligible specific activity/project to sponsor. |
| CS-177 | D | NOT_IMPLEMENTED | — | — | [GROUP] Create a sponsorship request for the group or a defined activity. |
| CS-178 | D | NOT_IMPLEMENTED | — | — | [GROUP] State the sponsorship purpose, target amount and intended work. |
| CS-179 | D | PASS | lib/services/neighbourhood-server.ts; app/sponsorship | tests/neighbourhood-api.test.ts | [COMMON] Record a simulated sponsorship pledge for the hackathon demo. |
| CS-180 | D | PASS | lib/services/neighbourhood-server.ts; app/sponsorship | npm run typecheck | [SYSTEM] Label simulated pledges clearly and never imply that real money was transferred. |
| CS-181 | D | NOT_IMPLEMENTED | — | — | [GROUP] Publish progress updates showing what sponsored support enabled. |
| CS-182 | D | NOT_IMPLEMENTED | — | — | [COMMON] View the reported use of support and related work evidence. |
| CS-183 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Distinguish target, pledged, received, allocated, reported-spent and refunded amounts as applicable. |
| CS-184 | P | NOT_IMPLEMENTED | — | — | [ADM] Review or moderate sponsorship requests under the platform's configured eligibility rules. |
| CS-185 | P | NOT_IMPLEMENTED | — | — | [GROUP] Correct or update funding-use reports without silently erasing earlier records. |
| CS-186 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Handle cancelled campaigns and disclose the applicable pledge/refund treatment. |
| CS-187 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Maintain a history of campaigns, updates, pledges and their status. |
| CS-188 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Add a real payment-provider flow only after payment authorization, reconciliation, receipts, refunds and required safeguards are implemented. |
| CS-189 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Offer recurring pledges, matching contributions or richer sponsor impact reports if the product later supports them. |
| CS-190 | D | NOT_IMPLEMENTED | — | — | [SYSTEM] Update the relevant public project or issue page after a permitted status change. |
| CS-191 | P | NOT_IMPLEMENTED | — | — | [COMMON] Notify users who follow a project when meaningful updates occur. |
| CS-192 | P | NOT_IMPLEMENTED | — | — | [COMMON] Let users manage notification preferences. |
| CS-193 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Send in-app notifications for assigned issues, responses, deadlines and accepted group tasks. |
| CS-194 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Support opt-in email notifications. |
| CS-195 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Support SMS or WhatsApp notifications through configured providers and valid consent. |
| CS-196 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Track notification delivery failures and avoid repeatedly sending failed notifications without controls. |
| CS-197 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Maintain a shared event/timeline history for important project, issue, coordination and task changes. |
| CS-198 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Associate important updates with their actor, timestamp, affected record and evidence when applicable. |
| CS-199 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Keep the public timeline readable without exposing confidential internal comments or personal data. |
| CS-200 | D | NOT_IMPLEMENTED | — | — | [ADM] Dashboard for planned, active, delayed, completed and cancelled public projects. |
| CS-201 | D | PARTIAL | app/admin/page.tsx; lib/services/admin-server.ts | npm run typecheck; npm run build | [ADM] Dashboard for issue review, unresolved issues and urgent reports. |
| CS-202 | D | NOT_IMPLEMENTED | — | — | [ADM] List of overdue milestones and pending restoration inspections. |
| CS-203 | D | NOT_IMPLEMENTED | — | — | [ADM] Filter metrics by ward/area, department, project type and time period. |
| CS-204 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Calculate recorded excavation frequency for each supported road segment. |
| CS-205 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Calculate closure-days or disruption duration using recorded project/closure intervals. |
| CS-206 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Preserve original-versus-revised deadline information and actual completion performance. |
| CS-207 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Track restoration defects, remediation status and inspection turnaround. |
| CS-208 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Track coordination cases and their accepted, rejected and completed outcomes. |
| CS-209 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Track issue review time, resolution time and reopening rate. |
| CS-210 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Track reporting freshness and flag projects without recent meaningful updates. |
| CS-211 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Track group tasks, completed work, disputes and evidence completeness. |
| CS-212 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Show sponsorship targets, pledges and actual receipt/use status separately. |
| CS-213 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Publish metric definitions, time periods, exclusions and data limitations. |
| CS-214 | P | NOT_IMPLEMENTED | — | — | [ADM] Export authorized dashboard reports. |
| CS-215 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Label the Civic Disruption Debt Index as a configured metric, showing its weights and calculation. |
| CS-216 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Estimate disruption avoided by comparing documented baseline and coordinated schedules, with assumptions visible. |
| CS-217 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Identify repeated-excavation hotspots and underserved areas using adequate data. |
| CS-218 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Support advanced budget and disruption analysis without claiming unvalidated financial savings. |
| CS-219 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Enforce authorization on the backend for every protected read or write. |
| CS-220 | P | PARTIAL | lib/validation; lib/services; supabase/migrations | tests/map-coordinates.test.ts; tests/neighbourhood-api.test.ts | [SYSTEM] Validate inputs, uploaded files, coordinates, dates and status transitions. |
| CS-221 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Protect API secrets and database service credentials from browser exposure. |
| CS-222 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Apply rate limits and abuse controls to reporting, verification, contact and authentication actions. |
| CS-223 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Restrict evidence access and validate permitted file types and sizes. |
| CS-224 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Use appropriate private storage and public evidence representations. |
| CS-225 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Minimize exposed personal information; strip unnecessary photo metadata from public copies when appropriate. |
| CS-226 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Define data retention, deletion and privacy-request procedures. |
| CS-227 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Maintain database backups and a tested recovery procedure. |
| CS-228 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Log errors, monitor system health and alert maintainers to relevant failures. |
| CS-229 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Use database constraints and transactions where operations must succeed or fail together. |
| CS-230 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Preserve material audit history when project, issue, coordination or sponsorship records change. |
| CS-231 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Define administrative review, escalation, moderation and appeal procedures. |
| CS-232 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Test that one department cannot modify records outside its authorized scope. |
| CS-233 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Test that a group cannot publish official projects, apply official penalties or close government issues. |
| CS-234 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Test that a group cannot confirm its own completion as independent community verification. |
| CS-235 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Test that repeated verification by the same eligible account does not inflate counts. |
| CS-236 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Test that changing a deadline preserves the original promised date and revision history. |
| CS-237 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Test that completing a government project does not bypass restoration inspections or automatically close unrelated reports. |
| CS-238 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Test that completing a group task does not automatically resolve a linked government issue. |
| CS-239 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Test that simulated sponsorship does not trigger real payments. |
| CS-240 | P | PARTIAL | lib/services/neighbourhood-server.ts; app/api/neighbourhood/issues/route.ts | tests/neighbourhood-api.test.ts | [SYSTEM] Test that external-data or routing-service failure does not disable core citizen reporting. |
| CS-241 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Test mobile layouts, map behaviour, missing coordinates and empty/stale data states. |
| CS-242 | P | NOT_IMPLEMENTED | — | — | [SYSTEM] Document environment setup, database schema, deployment, backups and recovery. |
| CS-243 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Conduct broader accessibility, security and load/performance assessments before wide deployment. |
| CS-244 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Natural-language assistant answering project questions using retrieved CivicSync records. |
| CS-245 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Explain missing data honestly instead of inventing project reasons, deadlines or responsibility. |
| CS-246 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Integrate additional authorized municipal or utility project feeds. |
| CS-247 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Integrate suitable phone/dashcam pothole-detection feeds. |
| CS-248 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Integrate a supported external pothole feed and monitor its availability, coverage and provenance. |
| CS-249 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Integrate advanced routing or live traffic services where available. |
| CS-250 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Add advanced road/utility spatial conflict analysis using suitable geographic data. |
| CS-251 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Add multilingual notifications, advanced impact reports and richer neighborhood analytics. |
| CS-252 | A | NOT_IMPLEMENTED | — | — | [SYSTEM] Document external integration agreements, data-sharing terms, permitted uses and operational limitations. |
