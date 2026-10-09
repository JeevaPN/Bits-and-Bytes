Full master feature checklist
This list supersedes the earlier checklist: it includes the original Street Passport and Dig-Once concepts, your team's added workflows, the fused issue lifecycle, optional detector data and the three-role RBAC model.
A. Website foundation and public experience
CS-001 [D][SYSTEM] CivicSync landing page explaining the platform and its purpose.
CS-002 [D][SYSTEM] Main navigation for Projects, Map, Report an Issue, Community Groups and Sponsorship.
CS-003 [D][COMMON] Public browsing of projects, issues and approved group pages without mandatory sign-in.
CS-004 [D][SYSTEM] Responsive layouts for desktop, tablet and mobile.
CS-005 [D][SYSTEM] Loading, empty, success, validation-error and failure states for major actions.
CS-006 [P][SYSTEM] Consistent labels, icons, date formats and status indicators.
CS-007 [P][SYSTEM] Search by street, landmark and project name.
CS-008 [P][SYSTEM] Shareable public URLs for projects, issues, groups and sponsorship campaigns.
CS-009 [P][SYSTEM] Pagination or efficient loading for large maps, lists and activity feeds.
CS-010 [P][SYSTEM] Accessible forms, keyboard navigation, readable contrast and screen-reader labels.
CS-011 [P][SYSTEM] Language support infrastructure, including configurable Indian regional languages.
CS-012 [P][SYSTEM] Clearly labelled demo, simulated and externally sourced data where applicable.
CS-013 [P][SYSTEM] Help text explaining verification counts, official review, group completion and sponsorship terminology.
B. Authentication and three-role RBAC
CS-014 [D][SYSTEM] Three primary role types: Admin, Common People and Social Service Groups.
CS-015 [D][SYSTEM] Separate role-aware dashboard/navigation for each primary role.
CS-016 [D][SYSTEM] Public project/QR browsing without account creation.
CS-017 [P][COMMON] Account registration, sign-in, sign-out and account recovery.
CS-018 [P][SYSTEM] Server-side authorization for protected actions; hiding buttons is not sufficient.
CS-019 [P][SYSTEM] Department and jurisdiction scopes for Admin permissions.
CS-020 [P][SYSTEM] Authorized account creation/invitation or approval for government staff as appropriate.
CS-021 [P][GROUP] Social-service group registration/application.
CS-022 [P][ADM] Approve, reject, request more information about or suspend group registrations, with recorded reasons.
CS-023 [P][SYSTEM] Only approved group accounts can manage the public group page and accept group tasks.
CS-024 [P][SYSTEM] Common People accounts can act as individual or organization sponsors without creating a fourth primary role.
CS-025 [P][SYSTEM] Permission checks prevent people from modifying records outside their ownership or authority.
CS-026 [P][SYSTEM] Session controls, failed-login protections and rate limiting.
CS-027 [P][SYSTEM] Revocation of access when an account or group loses authorization.
CS-028 [P][SYSTEM] Record the acting user and context for important role-protected operations.
C. Government public-works portal
CS-029 [D][ADM] Create official project records.
CS-030 [D][ADM] Record project title, description, work type and location.
CS-031 [D][ADM] Record the responsible department and contractor.
CS-032 [D][ADM] Record planned start date and expected completion date.
CS-033 [D][ADM] Set or manage planned, active, delayed, completed and cancelled project states.
CS-034 [D][ADM] Upload project progress and completion photos.
CS-035 [D][ADM] Publish approved public project information.
CS-036 [D][SYSTEM] Generate a unique QR code linking to each published project's stable public page.
CS-037 [D][COMMON] Scan a worksite QR code and read project information without signing in.
CS-038 [P][ADM] Record optional project budgets, scope and funding-source details.
CS-039 [P][ADM] Maintain project milestones and their planned dates.
CS-040 [P][ADM] Record actual milestone completion and supporting evidence.
CS-041 [P][ADM] Record explanations for delays and revised completion dates.
CS-042 [P][SYSTEM] Preserve the original promised date and the history of subsequent revisions.
CS-043 [P][SYSTEM] Distinguish manually declared status from deadline-derived warnings such as At Risk or Overdue.
CS-044 [P][ADM] Respond to citizen reports linked to government projects.
CS-045 [P][ADM] Link a project to one or multiple affected street segments.
CS-046 [P][ADM] Create drafts and use publication approval steps where the participating authority requires them.
CS-047 [P][ADM] Import projects through validated spreadsheets or CSV files with row-level errors reported.
CS-048 [P][ADM] Export authorized project reports and project history.
D. Street Passport and road restoration
CS-049 [D][SYSTEM] Maintain a persistent digital record for each supported street segment.
CS-050 [D][COMMON] Show past, current and planned projects affecting a street segment.
CS-051 [D][SYSTEM] Show previous excavation, resurfacing and recorded restoration events.
CS-052 [D][SYSTEM] Show linked unresolved issues and reported defects.
CS-053 [P][SYSTEM] Maintain evidence, dates and actors for important street-history events.
CS-054 [P][ADM] Schedule restoration inspections after declared project completion.
CS-055 [P][ADM] Record restoration inspection outcome, inspector, date and supporting evidence.
CS-056 [P][ADM] Create remediation follow-ups when restoration defects are found.
CS-057 [P][ADM] Record reinspection and final restoration outcome.
CS-058 [P][SYSTEM] Keep construction completion separate from restoration approval.
CS-059 [P][SYSTEM] Link a verified defect to the relevant project and responsible party when supported by the evidence and applicable authority.
CS-060 [P][SYSTEM] Configure a post-restoration protection period used by the conflict engine.
CS-061 [A][SYSTEM] Import authoritative road geometry and available utility-asset data under suitable access arrangements.
E. Dig-Once coordination and shared works calendar
CS-062 [D][SYSTEM] Compare project locations and schedules for potential conflicts.
CS-063 [D][SYSTEM] Detect projects planned for the same road segment around overlapping dates.
CS-064 [D][SYSTEM] Detect possible conflicts with nearby segments within a configurable geographic distance.
CS-065 [D][SYSTEM] Flag proposed excavations affecting recently restored roads under configured rules.
CS-066 [D][ADM] Show an explanatory conflict warning with links to the relevant projects.
CS-067 [D][ADM] Create a coordination case from a detected conflict.
CS-068 [D][ADM] Propose a shared schedule or joint-work review.
CS-069 [P][ADM] Allow relevant departments to accept, reject or request changes to a coordination proposal.
CS-070 [P][ADM] Record the decision, participating departments and reasons for acceptance or rejection.
CS-071 [P][SYSTEM] Display coordinated dates on the shared work calendar and public project timeline.
CS-072 [P][SYSTEM] Preserve original schedule commitments after coordination changes.
CS-073 [P][ADM] Record justified emergency-excavation exceptions.
CS-074 [P][SYSTEM] Recheck relevant conflicts when project dates or locations change.
CS-075 [P][SYSTEM] Track coordination outcomes, including why some projects could not technically be combined.
CS-076 [A][SYSTEM] Advanced geographic-overlap analysis using suitable road/utility geometry.
CS-077 [A][SYSTEM] Connect with participating municipal or utility coordination systems where an appropriate integration is available.
F. Public map, route suggestions and project following
CS-078 [D][COMMON] Display official project locations on a shared map.
CS-079 [D][COMMON] Display citizen issues and external observations as distinguishable marker types.
CS-080 [D][COMMON] Open a project or issue from its map marker.
CS-081 [D][COMMON] Search/filter by category, department, location and status.
CS-082 [D][COMMON] Follow a project or location for updates.
CS-083 [D][ADM] Publish affected road segments and known road closures.
CS-084 [D][COMMON] View declared disruptions and known affected roads.
CS-085 [D][SYSTEM] Suggest an alternative route that avoids known closed or blocked segments where the available road-network data supports it.
CS-086 [P][SYSTEM] Display relevant project dates and the last-update time alongside disruption information.
CS-087 [P][SYSTEM] Show an appropriate limitation message when route or closure data is missing, stale or incomplete.
CS-088 [P][COMMON] Manage project-following and notification preferences.
CS-089 [P][SYSTEM] Filter nearby issues/projects using geographic proximity.
CS-090 [A][SYSTEM] Integrate live traffic data when a suitable provider is configured.
G. Citizen issue reporting and observation intake
CS-091 [D][COMMON] Submit reports for unlisted public works.
CS-092 [D][COMMON] Submit reports for potholes, damaged roads/property, fallen trees, broken streetlights, open drains, leaks, garbage and blocked footpaths.
CS-093 [D][COMMON] Record an issue's category, description, location and observation time.
CS-094 [D][COMMON] Upload a photo as evidence.
CS-095 [P][COMMON] Upload a video subject to configured file-size, type and safety limits.
CS-096 [D][SYSTEM] Display reported issues on the public map with the correct source and status labels.
CS-097 [P][COMMON] Let users correct a report's location or request a correction after submission.
CS-098 [P][SYSTEM] Record the report source, creation time, evidence references and available location metadata.
CS-099 [P][SYSTEM] Allow reports to remain visible and trackable even when no official project match exists.
CS-100 [P][SYSTEM] Keep personal contact information and non-public evidence out of public report pages unless explicitly appropriate and authorized.
H. Automatic pothole observations and external data
CS-101 [A][SYSTEM] Accept pothole detections from a supported phone, dashcam or detector feed when available.
CS-102 [A][SYSTEM] Store supplied detection timestamp, location accuracy, detector/source identifier and confidence information.
CS-103 [P][SYSTEM] Display automatic detections as candidate observations rather than officially verified potholes.
CS-104 [P][SYSTEM] Support externally reported pothole locations where access terms and coverage permit.
CS-105 [P][SYSTEM] Label external records with source attribution and provenance.
CS-106 [P][SYSTEM] Preserve external IDs where available, the import timestamp and the source's observation date where provided.
CS-107 [P][SYSTEM] Match incoming records to possible existing CivicSync issues without blindly duplicating them.
CS-108 [P][ADM] Review external or automatically detected observations using the same appropriate official review process.
CS-109 [P][SYSTEM] Show external-data freshness and handle missing, malformed or unavailable feeds safely.
CS-110 [P][SYSTEM] Keep native citizen reporting usable even when every external data source is unavailable.
CS-111 [A][SYSTEM] Run scheduled incremental imports if the source offers a permitted and suitable access method.
I. Community verification, issue matching and trust & safety
CS-112 [D][COMMON] Provide an "I verify this" action for a person who has actually observed the issue.
CS-113 [D][COMMON] Display the community observation/verification count.
CS-114 [D][SYSTEM] Show official review status separately from the community count.
CS-115 [D][SYSTEM] Keep a report Unverified until it has received the relevant official review.
CS-116 [D][SYSTEM] Prevent an eligible account from repeatedly verifying the same issue to inflate its count.
CS-117 [D][SYSTEM] Suggest likely duplicate reports based on geographic proximity and issue category.
CS-118 [P][SYSTEM] Use description similarity to improve possible duplicate detection.
CS-119 [P][SYSTEM] Suggest related official projects using location, category and available text.
CS-120 [P][ADM] Approve or reject a suggested report-to-project match and record the reason.
CS-121 [P][SYSTEM] Keep an issue's validity and its relationship to a project as separate decisions.
CS-122 [D][COMMON] Allow Common People to flag a report they believe is inaccurate or misleading.
CS-123 [P][ADM] Review challenged reports and capture evidence or reasoning.
CS-124 [P][ADM] Correct, reject, refer or request more information about reports where appropriate.
CS-125 [P][SYSTEM] Preserve decision history and relevant reasons without disclosing confidential information.
CS-126 [P][ADM] Apply penalties only after deliberate false reporting is established through a documented review.
CS-127 [P][COMMON] Provide a correction or appeal mechanism where supported by the review policy.
CS-128 [P][SYSTEM] Detect suspicious reporting/verification patterns and expose them for authorized review rather than automatic punishment.
CS-129 [D][SYSTEM] Give high-risk safety reports an urgent triage path independent of popularity.
CS-130 [P][SYSTEM] Avoid publicly exposing reporters' identities or unnecessary personal information.
J. Official issue review and departmental response
CS-131 [D][ADM] View citizen reports, external pothole observations and available automatic detections.
CS-132 [D][ADM] Review report evidence, observation counts, duplicate suggestions and possible project matches.
CS-133 [D][ADM] Accept an issue for official action.
CS-134 [D][ADM] Request more information from the reporting user where possible.
CS-135 [D][ADM] Reject an issue with an appropriate reason.
CS-136 [D][ADM] Mark a report as a duplicate and link it to the canonical issue.
CS-137 [D][ADM] Refer an issue to another appropriate department or authority, with a recorded reason.
CS-138 [D][ADM] Record whether the department accepts responsibility, requires investigation or cannot act.
CS-139 [D][ADM] Publish an appropriate response and relevant public status update.
CS-140 [P][SYSTEM] Track response dates, assignments and status changes.
CS-141 [P][ADM] Assign accepted issues to an authorized unit or responsible party.
CS-142 [P][ADM] Attach remediation evidence and update the issue's resolution status.
CS-143 [P][SYSTEM] Support resolution review, reopening and additional remediation when a claimed fix is inadequate.
CS-144 [P][SYSTEM] Keep official issue resolution distinct from community confirmation and social-group completion.
K. Social service group directory and registration
CS-145 [D][GROUP] Create a group registration/application.
CS-146 [D][ADM] Review and approve or reject group registrations.
CS-147 [D][GROUP] Maintain a public profile after approval.
CS-148 [D][GROUP] Record group location, contact details and service areas.
CS-149 [P][GROUP] Describe the group's eligible work types, capabilities and limitations.
CS-150 [D][COMMON] Browse approved group pages.
CS-151 [D][COMMON] View the group's taken-up issues, current work and completed work.
CS-152 [D][GROUP] Publish progress updates and before-and-after evidence.
CS-153 [D][SYSTEM] Display community confirmations and distinguish them from official inspection results.
CS-154 [P][ADM] Moderate suspicious or impersonating group profiles and manage their approval status.
CS-155 [P][SYSTEM] Preserve the group's public work history and material status changes.
CS-156 [P][GROUP] Maintain group membership and control which members can update its public work page.
L. Social service work selection and task management
CS-157 [D][GROUP] Browse suitable reported issues.
CS-158 [D][GROUP] View issue location, category, description, community count, time since posting and current status.
CS-159 [D][SYSTEM] Rank ordinary eligible issues primarily by independent community observations, then by posting age.
CS-160 [P][SYSTEM] Apply safety/urgency overrides before ordinary ranking.
CS-161 [P][SYSTEM] Filter opportunities by group location, service area, work type and suitability.
CS-162 [D][GROUP] Accept a suitable issue as a group task.
CS-163 [D][GROUP] Refer an unsuitable issue for official action.
CS-164 [P][SYSTEM] Prevent multiple groups from unknowingly claiming the same work; allow coordinated joint work if approved.
CS-165 [D][GROUP] Mark accepted work In Progress.
CS-166 [D][GROUP] Post progress notes and evidence.
CS-167 [D][GROUP] Submit work as completed, including completion evidence.
CS-168 [D][COMMON] Confirm or dispute whether the group's claimed work appears complete, where eligible.
CS-169 [P][SYSTEM] Keep Awaiting Confirmation, Confirmed, Disputed and Reopened outcomes distinct.
CS-170 [P][GROUP] Reopen or update a group task when additional work is needed.
CS-171 [D][COMMON] Contact a nearby group about an important issue using its published contact option.
CS-172 [P][GROUP] Accept, decline or refer a contacted issue without implying that unaccepted work is assigned.
CS-173 [P][SYSTEM] Keep group task status independent from the linked government issue/project lifecycle.
CS-174 [P][SYSTEM] Record who performed material group-task updates and when.
M. Sponsorship and funding transparency
CS-175 [D][COMMON] Browse groups' historical and ongoing work before choosing whom to support.
CS-176 [D][COMMON] Select a group or eligible specific activity/project to sponsor.
CS-177 [D][GROUP] Create a sponsorship request for the group or a defined activity.
CS-178 [D][GROUP] State the sponsorship purpose, target amount and intended work.
CS-179 [D][COMMON] Record a simulated sponsorship pledge for the hackathon demo.
CS-180 [D][SYSTEM] Label simulated pledges clearly and never imply that real money was transferred.
CS-181 [D][GROUP] Publish progress updates showing what sponsored support enabled.
CS-182 [D][COMMON] View the reported use of support and related work evidence.
CS-183 [P][SYSTEM] Distinguish target, pledged, received, allocated, reported-spent and refunded amounts as applicable.
CS-184 [P][ADM] Review or moderate sponsorship requests under the platform's configured eligibility rules.
CS-185 [P][GROUP] Correct or update funding-use reports without silently erasing earlier records.
CS-186 [P][SYSTEM] Handle cancelled campaigns and disclose the applicable pledge/refund treatment.
CS-187 [P][SYSTEM] Maintain a history of campaigns, updates, pledges and their status.
CS-188 [P][SYSTEM] Add a real payment-provider flow only after payment authorization, reconciliation, receipts, refunds and required safeguards are implemented.
CS-189 [A][SYSTEM] Offer recurring pledges, matching contributions or richer sponsor impact reports if the product later supports them.
N. Notifications, communication and shared event history
CS-190 [D][SYSTEM] Update the relevant public project or issue page after a permitted status change.
CS-191 [P][COMMON] Notify users who follow a project when meaningful updates occur.
CS-192 [P][COMMON] Let users manage notification preferences.
CS-193 [P][SYSTEM] Send in-app notifications for assigned issues, responses, deadlines and accepted group tasks.
CS-194 [P][SYSTEM] Support opt-in email notifications.
CS-195 [A][SYSTEM] Support SMS or WhatsApp notifications through configured providers and valid consent.
CS-196 [P][SYSTEM] Track notification delivery failures and avoid repeatedly sending failed notifications without controls.
CS-197 [P][SYSTEM] Maintain a shared event/timeline history for important project, issue, coordination and task changes.
CS-198 [P][SYSTEM] Associate important updates with their actor, timestamp, affected record and evidence when applicable.
CS-199 [P][SYSTEM] Keep the public timeline readable without exposing confidential internal comments or personal data.
O. Analytics and city accountability
CS-200 [D][ADM] Dashboard for planned, active, delayed, completed and cancelled public projects.
CS-201 [D][ADM] Dashboard for issue review, unresolved issues and urgent reports.
CS-202 [D][ADM] List of overdue milestones and pending restoration inspections.
CS-203 [D][ADM] Filter metrics by ward/area, department, project type and time period.
CS-204 [P][SYSTEM] Calculate recorded excavation frequency for each supported road segment.
CS-205 [P][SYSTEM] Calculate closure-days or disruption duration using recorded project/closure intervals.
CS-206 [P][SYSTEM] Preserve original-versus-revised deadline information and actual completion performance.
CS-207 [P][SYSTEM] Track restoration defects, remediation status and inspection turnaround.
CS-208 [P][SYSTEM] Track coordination cases and their accepted, rejected and completed outcomes.
CS-209 [P][SYSTEM] Track issue review time, resolution time and reopening rate.
CS-210 [P][SYSTEM] Track reporting freshness and flag projects without recent meaningful updates.
CS-211 [P][SYSTEM] Track group tasks, completed work, disputes and evidence completeness.
CS-212 [P][SYSTEM] Show sponsorship targets, pledges and actual receipt/use status separately.
CS-213 [P][SYSTEM] Publish metric definitions, time periods, exclusions and data limitations.
CS-214 [P][ADM] Export authorized dashboard reports.
CS-215 [P][SYSTEM] Label the Civic Disruption Debt Index as a configured metric, showing its weights and calculation.
CS-216 [P][SYSTEM] Estimate disruption avoided by comparing documented baseline and coordinated schedules, with assumptions visible.
CS-217 [A][SYSTEM] Identify repeated-excavation hotspots and underserved areas using adequate data.
CS-218 [A][SYSTEM] Support advanced budget and disruption analysis without claiming unvalidated financial savings.
P. Security, privacy and operational readiness
These features are not decorative additions. They are required to make a real deployment trustworthy.
CS-219 [P][SYSTEM] Enforce authorization on the backend for every protected read or write.
CS-220 [P][SYSTEM] Validate inputs, uploaded files, coordinates, dates and status transitions.
CS-221 [P][SYSTEM] Protect API secrets and database service credentials from browser exposure.
CS-222 [P][SYSTEM] Apply rate limits and abuse controls to reporting, verification, contact and authentication actions.
CS-223 [P][SYSTEM] Restrict evidence access and validate permitted file types and sizes.
CS-224 [P][SYSTEM] Use appropriate private storage and public evidence representations.
CS-225 [P][SYSTEM] Minimize exposed personal information; strip unnecessary photo metadata from public copies when appropriate.
CS-226 [P][SYSTEM] Define data retention, deletion and privacy-request procedures.
CS-227 [P][SYSTEM] Maintain database backups and a tested recovery procedure.
CS-228 [P][SYSTEM] Log errors, monitor system health and alert maintainers to relevant failures.
CS-229 [P][SYSTEM] Use database constraints and transactions where operations must succeed or fail together.
CS-230 [P][SYSTEM] Preserve material audit history when project, issue, coordination or sponsorship records change.
CS-231 [P][SYSTEM] Define administrative review, escalation, moderation and appeal procedures.
CS-232 [P][SYSTEM] Test that one department cannot modify records outside its authorized scope.
CS-233 [P][SYSTEM] Test that a group cannot publish official projects, apply official penalties or close government issues.
CS-234 [P][SYSTEM] Test that a group cannot confirm its own completion as independent community verification.
CS-235 [P][SYSTEM] Test that repeated verification by the same eligible account does not inflate counts.
CS-236 [P][SYSTEM] Test that changing a deadline preserves the original promised date and revision history.
CS-237 [P][SYSTEM] Test that completing a government project does not bypass restoration inspections or automatically close unrelated reports.
CS-238 [P][SYSTEM] Test that completing a group task does not automatically resolve a linked government issue.
CS-239 [P][SYSTEM] Test that simulated sponsorship does not trigger real payments.
CS-240 [P][SYSTEM] Test that external-data or routing-service failure does not disable core citizen reporting.
CS-241 [P][SYSTEM] Test mobile layouts, map behaviour, missing coordinates and empty/stale data states.
CS-242 [P][SYSTEM] Document environment setup, database schema, deployment, backups and recovery.
CS-243 [A][SYSTEM] Conduct broader accessibility, security and load/performance assessments before wide deployment.
Q. Advanced assistance and integrations
CS-244 [A][SYSTEM] Natural-language assistant answering project questions using retrieved CivicSync records.
CS-245 [A][SYSTEM] Explain missing data honestly instead of inventing project reasons, deadlines or responsibility.
CS-246 [A][SYSTEM] Integrate additional authorized municipal or utility project feeds.
CS-247 [A][SYSTEM] Integrate suitable phone/dashcam pothole-detection feeds.
CS-248 [A][SYSTEM] Integrate a supported external pothole feed and monitor its availability, coverage and provenance.
CS-249 [A][SYSTEM] Integrate advanced routing or live traffic services where available.
CS-250 [A][SYSTEM] Add advanced road/utility spatial conflict analysis using suitable geographic data.
CS-251 [A][SYSTEM] Add multilingual notifications, advanced impact reports and richer neighborhood analytics.
CS-252 [A][SYSTEM] Document external integration agreements, data-sharing terms, permitted uses and operational limitations.
