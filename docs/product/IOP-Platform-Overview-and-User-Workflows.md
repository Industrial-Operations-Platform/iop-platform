# IOP - Maintenance and Operational Tracking

IOP brings daily technical reports, maintenance, workforce planning and operational analysis into one shared platform. Individual accounts give Team Leaders, Task Force members and Technicians the views and actions appropriate to their responsibilities.

The proposal is to centralize operational knowledge, make responsibility and follow-up visible, and use information recorded throughout the day to prepare a focused shift-end meeting.

## 1. Business purpose

The current shift-end discussion relies on a physical board and the explanations of the people present. IOP creates a persistent operational record before, during and after that discussion. A colleague returning from leave, joining another department or receiving a maintenance assignment can recover the context without relying on an individual explanation.

The system helps answer practical questions:

- What happened today, and which earlier issues remain open?
- Where was a problem reported, and which equipment reference is involved?
- What intervention is planned, who is responsible, and when is the next action due?
- Who is scheduled for each shift and zone?
- Which faults recur, and where should Task Force investigate?
- What improvement was implemented, and what result was observed afterwards?

| Operational need | IOP capability | Intended benefit |
| --- | --- | --- |
| Information scattered across conversations and boards | Shared reports with author, date, location and follow-up | Preserve context between people and shifts |
| Open matters difficult to track | Explicit state, responsibility, action date and feedback date | Make the next step visible |
| Manual preparation of the shift-end meeting | Daily topic view and a separate view of older pending issues | Reduce preparation and repeated explanations |
| Repeated technical problems | Frequency, accumulated alarm duration and period analysis | Support investigation and prioritization |
| Coordination of people | Personal schedules, shifts, zones and operational duties | Make planned distribution visible |
| Technical history difficult to retrieve | Linked reports, maintenance outcomes and equipment references | Retain knowledge for future work |

The objective is a shorter, better-prepared shift-end meeting and greater continuity of work. Recording the facts during the day allows the meeting to focus on safety, exceptions, blocked operation, decisions and unresolved matters.

## 2. One connected operational workflow

An observation can move through the platform without losing its original context:

1. A Technician records the observation, location and equipment reference when known.
2. The report becomes available to the team and to shift handover.
3. The Team Leader reviews priority, responsibility and the need for maintenance.
4. The assigned worker performs the intervention and records the outcome.
5. Completion review identifies which related reports are resolved and which remain outside the repair.
6. Task Force investigates recurrence and tracks improvement actions.
7. The incoming team receives the relevant context and continues the pending work.

Analysis may also initiate an investigation before a manual report exists. Where explicit links are available, the user can open the original source record rather than duplicate its narrative.

Three records serve different purposes:

| Record | Main question | Retained information |
| --- | --- | --- |
| Shift report | What happened or needs to be communicated? | Observation, context, author and follow-up |
| Maintenance work | What intervention will be performed? | Scope, priority, assignment, progress and outcome |
| Improvement action | What change should be tested or evaluated? | Hypothesis, objective, owner, evidence and comparison |

A single problem can lead to both maintenance and an improvement. Linking these records preserves the relationship while each keeps its own lifecycle.

## 3. Workspaces by profile

### Team Leader

The Team Leader combines the daily operational picture with people planning and maintenance coordination. The profile can prepare the meeting, publish current information, plan availability and zone assignments, assign maintenance, investigate analytical results and manage improvements.

The main views are Start, the daily Handover overview, personal Journal, Department matrix, formal Shift records, My day, My team, Weekly plan, Weekly schedules, Maintenance board and records, My work, all six analysis templates, Improvements, read-only Asset Locator, Area overview and global search.

**Practical use:** review the day's reports, check earlier open issues, confirm maintenance responsibilities and discuss only the matters needing a decision. Record the responsible person and next step while the relevant evidence is available.

### Task Force

Task Force combines analytical investigation with reports from the operational team. Members can consult schedules, contribute reports, manage formal shift records, propose maintenance, update their own or assigned work, manage improvement actions and use the read-only Locator.

The analysis workspace supports investigation from a Halle or area down to a source equipment code and message. Improvement Tracking keeps a hypothesis, target and observed result attached to an action.

**Practical use:** identify a recurrent message, inspect the period and equipment context, review previous reports and interventions, and create a measurable improvement action. Task Force consults workforce planning; maintenance assignment remains a Team Leader or Administrator responsibility.

### Technician

The Technician workspace concentrates on the current working day: assignment, team information, departmental issues, personal reporting and assigned maintenance.

Available views include Start, My day, Meeting preparation, personal Journal, Department matrix, permitted Area overview and search. Maintenance assignments are opened from Start; the Technician does not have a separate Maintenance item in the sidebar.

**Practical use:** record a fault when it is observed, add the equipment code when known, document the measure taken and retain follow-up if the issue remains open. Open assigned maintenance from Start and document progress or the outcome within the record's permissions.

### Administrator

The Administrator maintains users, data imports and preparation, workforce configuration, maintenance priorities, equipment identities, asset models, plant schematics and integration settings.

| Capability | Team Leader | Task Force | Technician |
| --- | --- | --- | --- |
| Personal Start and daily schedule | Yes | Yes | Yes |
| Read and contribute shift reports | Yes | Yes | Yes |
| Coordinate reports and Start highlights | Yes | Ordinary contribution | Ordinary contribution |
| Publish Information announcements | Yes | No | No |
| Manage formal shift transfers | Yes | Yes | No |
| Edit schedules and workplace distribution | Yes | Read only | Read only |
| Update own or assigned maintenance | Yes | Yes | Yes, entered from Start |
| Assign maintenance to people or teams | Yes | No | No |
| Consult Data Analysis | Yes | Yes | No |
| Manage improvement actions | Yes | Yes | No |
| Consult Asset Locator | Read only | Read only | No |
| Administer assets, models, users or integrations | Administrator only | Administrator only | Administrator only |

Access also depends on current permissions and the authorized site. A work assignment does not grant administration rights.

## 4. Modules and existing views

### Start and in-app activity

**Purpose:** give each person a useful entry point for the current day.

Start combines profile and home-team context, scheduled day or week, current information, unfinished maintenance assignments and departmental reports needing attention. Personal statistics identify their reporting period and distinguish planned work from resolved assigned reports.

**Existing views:** profile-specific Start, assignment period selection, current Information, departmental attention and open reports, maintenance assignment cards, compact analytical snapshot where authorized, account menu and in-app activity notifications.

**Example:** a Technician starts the day, checks the planned zone, reads the Team Leader's announcement and opens an assigned inspection.

### Shift Handover - journal and meeting preparation

**Purpose:** preserve what happened during the shift and make it useful for the next team.

A report starts with a concise summary and department. Optional context includes area, exact equipment reference, details, reported condition, Ultimo reference, challenge, known cause, measure, responsibility, due date and feedback deadline. An unknown cause must not prevent an initial report.

**Existing views:** Meeting preparation or Team Leader Daily overview, personal Journal, Department matrix, historical search, Department status, report detail and revisions, new and corrected reports, follow-up, and category-specific publication forms.

| Meeting topic | Content |
| --- | --- |
| Safety | Hazards and near misses |
| Information | Team Leader announcements with display dates and supporting images |
| Successes | Outcomes linked to selected reports or reviewed maintenance work |
| People | Existing Workforce distribution for the selected day |
| Performance | Reported blocked or nonoperating plant requiring action |
| Problems | Technical issues, known causes, measures and follow-up |

The daily canvas shows the chosen day's reports. Department status separately carries forward unresolved Problems and Performance issues. The Journal remains personal; the matrix provides shared departmental follow-up and historical filtering.

**Example:** a report about intermittent drive vibration stays available with its responsible person and feedback date. A routine completed inspection can remain in history without occupying the meeting. Marking a subject for discussion and highlighting it on Start are separate choices.

### Formal Shift records

**Purpose:** retain a structured transfer between responsible people using actual planned shifts.

**Existing views:** transfer list, planned shift selection, new draft and record editor, draft review, published record and closing outcome, closed evidence, incoming acknowledgement, previous-shift context and retained history.

A transfer carries selected report revisions and the evidence reviewed at closure. A different incoming manager can acknowledge receipt with a note. Closing the transfer does not resolve the technical issues it carries.

**Example:** the outgoing manager selects the relevant reports for the early shift and location, reviews them, publishes the transfer and records the closing outcome. The incoming manager receives the preserved evidence and acknowledges it.

### Workforce and shifts

**Purpose:** distinguish when a person is available from where and in what function they are assigned.

**Existing views:** My day, shift leaders, My team, Weekly plan and its compact seven-day distribution, Weekly schedules, assignment form, assignment and schedule details, Schedule import, manual schedule entry, and configuration of shifts, zones, phones, teams, technical levels and worker profiles.

Personal schedules describe availability, training and absence. Assignments describe zone work, floating support, maintenance duties and phone responsibility. The system checks compatible working intervals and conflicting responsibilities.

**Example:** the Team Leader reviews the week, finds an available worker without a destination and assigns support in another zone. The worker remains visible in their primary team's view.

**Company planning integration:** the current administrator import accepts supported schedule input, including the admitted email format. The next integration should incorporate the planning currently communicated by email, show recognized people and shifts, and allow review before confirmation. A later connection to the company's source system should handle updates. Imported availability does not automatically decide zone and phone assignments.

### Maintenance

**Purpose:** turn a technical need into an intervention with scope, priority, responsibility and an outcome.

**Existing views:** Board, Records, My work, new work, detail, edit, status actions, blocked reason, completion review, reopening reason, related-report review, revision history and administrator priority configuration.

Work can be Corrective, Preventive or Inspection. The record may include location, a registered asset, exact related equipment identifiers, manual repair target, person or team, deadline and external reference. Open, In progress, Blocked and Done are explicit states. Blocking requires a reason; completion requires an outcome and review.

Related pending reports must be included or explicitly excluded before completion. Included reports are resolved with the authorized maintenance outcome. Exclusions retain their explanation and leave those reports outside the repair.

**Example:** a roller intervention refers to nearby sensor codes as evidence. The assigned worker documents the result and closes only the reviewed reports covered by that repair. A different issue stays open with its exclusion reason.

### Data Analysis

**Purpose:** investigate operational patterns and present historical results from imported source data.

**Existing templates:** Executive Overview, Halle analysis, Bereich analysis, Equipment analysis, Error analysis and Daily / monthly. Associated views include period and source filters, rankings, source-group Pareto, trends, monthly comparisons, heatmaps, frequency-versus-duration plots and source evidence where applicable.

The executive template presents the selected month, configured priority indicators, area rankings, an area/day matrix and daily frequency and alarm-minute series. Team Leaders and Task Force consult and filter; administrators maintain the input and reporting settings.

**Example:** Task Force selects a Halle and several months, identifies a recurrent equipment code and narrows the investigation to its messages. The Team Leader presents the monthly executive view to management.

Frequency, alarm duration and reporting-date coverage help teams assess recurring faults and compare periods.

### Improvement Tracking

**Purpose:** maintain an improvement from initial hypothesis through implementation and evaluation.

**Existing views:** action list and filters, new action, action detail, edit, notes and result evidence, evidence corrections, before/after selection and results, saved comparison evidence and action revision history.

An action records context, location, owner, objective and dates, with optional equipment or issue links. A quantitative target can use reported frequency or accumulated alarm seconds. Planned, In progress, Implemented, Evaluated, Blocked and Cancelled describe the lifecycle.

**Example:** Task Force proposes reviewing a cleaning practice, records the hypothesis and implementation date, and compares periods for the same equipment. The result and supporting observations remain linked to the action.

### Asset Locator

**Purpose:** provide visual orientation and equipment context through plant and equipment schematics.

**Existing views:** Plant overview, scene cards and filtering, area scene, component selection, Asset search and placement results, read-only equipment context, administrator scene creation and model editing, component properties, revision history and prepared-model review.

Team Leaders and Task Force use Locator in read-only mode. Administrators manage scene geometry and explicit asset placements. Report and maintenance markers represent dated operational evidence rather than live health.

**Example:** open an equipment scene, inspect nearby components and follow linked reports or maintenance work.

### Assets and Asset Management

**Purpose:** maintain stable equipment identities and recover the available technical history.

**Assets views:** directory, registration and edit, lifecycle and validation fields, exact source aliases, Digital Asset Record and linked-source timeline.

**Asset Management views:** Inventory model, model detail and editor, Type catalog and structured field definitions, Source mappings, mapping review and history, and Canonical Pareto with mapping coverage.

The standalone registry, Digital Asset Record and model administration are Administrator-only. Advanced operational profiles use compact equipment references within their workflows and the read-only Locator.

**Example:** an administrator checks an equipment record and links its references so reports, maintenance and analytical history can be consulted together.

### Area overview and global search

**Purpose:** gather the available context of a location and find original records across modules.

**Existing views:** global search input and grouped results, area/date selection, current pending reports, selected-day journal, unfinished maintenance, compact asset references, analytical coverage and exact formal-shift context when authorized and configured.

**Example:** the Team Leader opens a department, reviews pending work and the selected day's reports, and follows a result to its original record. Each profile sees the information available to its role.

### Administration, data and integrations

**Purpose:** keep shared data, access and operating configuration usable.

**Existing data views:** Administration overview, Import files, import date confirmation and results, import review, Files & source rows, source filters and lines, Data preparation, and KPI settings & goals.

**Existing user views:** user directory and profile information, create account, user details and access editor, own display-name editor, sign-in and initial password replacement.

**Existing integration views:** connection settings and change history for WinCC, Ultimo and Microsoft Entra. These planned connections extend the current analysis, maintenance and access workflows.

**Example:** an administrator imports a daily CSV, checks the retained result and source rows, and allows authorized analysts to consult the admitted period. Local backup and audit operations support the platform but are not additional general-purpose user views.

## 5. Shift-end meeting on a shared display

The intended Ausgabe workflow starts during the working day. Technicians record meaningful observations and results as they occur. Before the meeting, the Team Leader reviews the daily canvas, checks earlier unresolved issues and selects what requires discussion.

During the meeting, a room display presents the relevant view while the Team Leader navigates from their computer. Routine work stays in history. Shared time is used for safety, current information, staffing, blocked operation, decisions, responsibilities and important results.

| Stage | Working method |
| --- | --- |
| During the shift | Record observations, measures and results |
| Before the meeting | Review the day, earlier pending work and discussion topics |
| During the meeting | Present the important subjects and open detail when needed |
| When an action is agreed | Record the responsible person, date and next step |
| At transfer | Preserve the context and use formal transfer/receipt when appropriate |
| Next shift | Recover the evidence and continue pending work |

The first display option is to show the Team Leader's computer on a compatible room screen, potentially using a wireless connection. A second option is a screen-connected device opening the shared application once hosting and authorized access are prepared. The choice depends on the company's room equipment and network.

The planned room display will let the Team Leader use these views to guide the discussion and record decisions during the meeting.

## 6. Planned company integrations

| Integration | Why it matters for IOP | Current capability and planned connection |
| --- | --- | --- |
| WinCC | Bring alarm information into IOP to identify recurring faults and prioritize technical investigation | Daily CSV import is available. A direct connection is planned to automate data collection. |
| Ultimo | Connect daily technical follow-up with the company's maintenance process and keep work references together | Maintenance references can be recorded. A direct connection is planned to share work-order information. |
| Microsoft Entra ID | Let employees use corporate work accounts and support centralized access management | Connection settings are available. Corporate sign-in is a planned integration. |
| Company shift-assignment system | Reuse the official shift plan, reduce repeated entry and keep operational planning aligned with company schedules | Manual schedule import is available. Automatic email intake and a connection to the planning system are planned. |

With company schedules available in Workforce, the Team Leader can focus on assigning zones, support duties and phones. Schedule changes can be reviewed before updating the operational plan.

## 7. Practical demonstration

### Case A - from a reported fault to maintenance follow-up

A motor roller issue in **LB-Puffer / Halle A T3** illustrates how **Burak Kiliç**, as Team Leader, and **Asam Amiti**, as assigned Technician, can coordinate work in IOP.

1. **Technician / report:** record the observed vibration, department, area and exact source code when known. Leave the cause unknown until investigated.
2. **Team Leader / daily overview:** review the new report with the day's other events and the earlier pending issues.
3. **Team Leader / Maintenance:** define the intervention, priority, responsible worker and deadline.
4. **Assigned worker / My work:** open the scope, perform the inspection and document findings.
5. **Authorized completion review:** confirm the outcome and decide which related reports are included or excluded.
6. **Task Force / Data Analysis:** review recurrence by period, source equipment and message, retaining the limits of aggregate data.
7. **Task Force / Improvements:** record a hypothesis, owner, target and implementation date. Compare suitable periods and retain the observed evaluation.
8. **Team Leader / shared meeting view:** present the important result and the work still requiring continuity. Use a formal shift record when a structured transfer is needed.

### Case B - company planning received by email

The company sends the week's shift assignments. The intended integration brings that planning into IOP, identifies matched people and shift types and shows changes or unresolved mappings for review. After confirmation, the Team Leader uses the imported availability to plan zones, support and phone responsibility.

The existing schedule import provides a starting point for the planned automatic email intake and connection to the company's scheduling system.

## 8. Operational introduction

A focused pilot should select a department, Team Leader, Technicians and Task Force participants; review real people, zones, shifts and equipment references; agree what gets recorded and when; and test the meeting workflow on the room display.

| Topic | Decision or preparation needed |
| --- | --- |
| People and operating context | Confirm teams, authorized profiles, zones and current schedules |
| Reporting method | Agree concise summaries, required context and follow-up practice |
| Company planning | Confirm the email format, source system and update/review process |
| Shared access | Define company hosting, authorized access and room display setup |
| Equipment context | Validate identity and physical placement before relying on precise location |
| Provider connections | Coordinate access with IT and the owners of connected systems |
| Evaluation | Agree how to review preparation time, meeting time, continuity and user feedback |

IOP provides a shared operational record for decisions, planning and follow-up across shifts.

## 9. Application views

| Module | Main views and actions |
| --- | --- |
| Access | Sign in, account details and personal profile |
| Start | Daily and weekly assignments, team information and notifications |
| Workforce | My day, My team, weekly planning, schedules and assignments |
| Shift Handover | Daily overview, Journal, Department matrix, reports and follow-up |
| Formal Handover | Drafts, published transfers, closure and receiving acknowledgement |
| Maintenance | Board, Records, My work, assignment, progress and completion review |
| Data Analysis | Executive Overview, area and equipment analysis, faults and period comparisons |
| Improvements | Actions, objectives, evidence and before/after comparisons |
| Asset Locator | Plant overview, area scenes, equipment search and component details |
| Assets | Equipment directory, Digital Asset Record and technical history |
| Asset Management | Equipment models, type definitions and equipment-reference mapping |
| Operational Context | Area overview and global search |
| Administration | Account activity and latest data imports |
| Data Administration | Import review, source records, data preparation and KPI settings |
| User Administration | Accounts, profiles and access management |
| Integrations | WinCC, Ultimo and corporate sign-in settings |


### Access

#### Public welcome page

**Users:** All

The signed-out introduction presents the three main capabilities and the entry to the application.

![Public welcome page](images/live-views/01-landing.png)

#### Platform overview

**Users:** All

The About dialog explains the platform and its connected operational modules.

![Platform overview](images/live-views/02-about.png)

#### Individual account sign-in

**Users:** All

The local sign-in dialog uses individual accounts and passwords. Corporate identity is a future integration.

![Individual account sign-in](images/live-views/03-sign-in.png)

#### My profile

**Users:** All

The personal dialog allows the signed-in person to update their display name.

![My profile](images/live-views/18-own-profile.png)

### Start

#### Technician Start

**Users:** Technician

Personal profile, scheduled work, current information, departmental issues and maintenance assignments are combined on Start.

**Practical example:** At the beginning of a shift, check the assignment and open work requiring attention.

![Technician Start](images/live-views/10-start-technician.png)

#### Technician Start - operational updates

**Users:** Technician

The lower part of Start provides the departmental pending reports and the compact analytical snapshot where authorized.

![Technician Start - operational updates](images/live-views/10b-start-activity-technician.png)

#### Account, language and appearance

**Users:** All

The account menu provides language and appearance choices and the account actions.

![Account, language and appearance](images/live-views/11-account-menu.png)

#### In-app notifications

**Users:** All

Activity is presented inside IOP, including report mentions and maintenance assignment events.

![In-app notifications](images/live-views/12-notifications.png)

#### Team Leader Start

**Users:** Team Leader

Personal profile, scheduled work, current information, departmental issues and maintenance assignments are combined on Start.

**Practical example:** At the beginning of a shift, check the assignment and open work requiring attention.

![Team Leader Start](images/live-views/13-start-team-leader.png)

#### Team Leader Start - operational updates

**Users:** Team Leader

The lower part of Start provides the departmental pending reports and the compact analytical snapshot where authorized.

![Team Leader Start - operational updates](images/live-views/13b-start-activity-team-leader.png)

#### Task Force Start

**Users:** Task Force

Personal profile, scheduled work, current information, departmental issues and maintenance assignments are combined on Start.

**Practical example:** At the beginning of a shift, check the assignment and open work requiring attention.

![Task Force Start](images/live-views/15-start-task-force.png)

#### Start - daily assignment and maintenance

**Users:** All

The assignment panel shows the current date, working hours, zone and duty, with unfinished maintenance assigned to the person.

**Practical example:** Open a maintenance card to review its scope.

![Start - daily assignment and maintenance](images/live-views/16-start-assignment-day.png)

#### Start - weekly assignment

**Users:** All

The compact weekly selection presents Monday-to-Sunday planned assignments and the work due in that period.

**Practical example:** Check the next working days without changing the saved plan.

![Start - weekly assignment](images/live-views/17-start-assignment-week.png)

### Workforce

#### My day

**Users:** All

Daily schedules and assignments show colleagues by zone, support duties and shift leaders.

![My day](images/live-views/20-workforce-day.png)

#### My team

**Users:** Team Leader

The Team Leader sees the staff in their configured primary teams, with the current saved weekly availability and assignments.

**Practical example:** Review colleagues, shifts and work outside the home zone.

![My team](images/live-views/21-workforce-team.png)

#### Weekly plan

**Users:** Team Leader, Administrator

The weekly distribution presents planned shifts, zones, support and phone responsibility.

![Weekly plan](images/live-views/22-workforce-week.png)

#### Weekly plan - shift columns

**Users:** Team Leader, Administrator

The alternative layout groups the weekly distribution by shift.

![Weekly plan - shift columns](images/live-views/23-workforce-seven-days.png)

#### Weekly schedule editor

**Users:** Team Leader, Administrator

Seven dated cards support applying a configured shift or absence to selected days and reviewing individual exceptions.

![Weekly schedule editor](images/live-views/25-workforce-weekly-editor.png)

#### New workplace assignment

**Users:** Team Leader, Administrator

The assignment form separates the person, date, shift, function, zone, hours and phone responsibility.

![New workplace assignment](images/live-views/26-workforce-assignment.png)

#### Schedule import and daily entry

**Users:** Administrator

The administrator can paste an admitted CSV or email format and review personal schedule data.

**Practical example:** The future company integration will build on this entry workflow and reduce repeated transcription.

![Schedule import and daily entry](images/live-views/27-workforce-import.png)

#### Schedule import - manual schedule and records

**Users:** Administrator

Manual daily entry and the retained schedule list are available within the import workspace.

![Schedule import - manual schedule and records](images/live-views/28-workforce-import-lower.png)

#### Workforce configuration - shifts and zones

**Users:** Administrator

Shift definitions, working hours, active days, zones and phone labels are configured here.

![Workforce configuration - shifts and zones](images/live-views/29-workforce-config.png)

#### Workforce configuration - teams and worker profiles

**Users:** Administrator

Team leadership, technical levels and a worker's home zone are managed independently of access profiles.

![Workforce configuration - teams and worker profiles](images/live-views/30-workforce-config-workers.png)

#### Assignment detail and history

**Users:** Authorized readers

The assignment detail displays person, shift, location, responsibility and retained revisions.

![Assignment detail and history](images/live-views/31-workforce-detail.png)

#### Email schedule import

**Users:** Administrator

The admitted email import is associated with an exact person before its schedule can be previewed.

![Email schedule import](images/live-views/32-workforce-email.png)

#### Schedule import preview

**Users:** Administrator

A preview shows the proposed dated schedule and revision decision before committing the import.

![Schedule import preview](images/live-views/33-workforce-preview.png)

### Shift Handover

#### Daily overview

**Users:** Team Leader

The daily overview organizes reports into Safety, Information, Successes, People, Performance and Problems.

**Practical example:** Review the daily topics alongside the open issues that need follow-up.

![Daily overview](images/live-views/40-handover-daily.png)

#### Personal Journal

**Users:** All

The Journal shows the authenticated author's entries for the chosen day, with access to earlier history.

![Personal Journal](images/live-views/42-handover-journal.png)

#### Department matrix

**Users:** All

The shared table exposes dates, report details, external references, due dates, responsibility and state.

![Department matrix](images/live-views/43-handover-matrix.png)

#### Search handover history

**Users:** All

Historical filters retrieve earlier dates, categories, equipment references and resolved issues.

![Search handover history](images/live-views/44-handover-history.png)

#### Report detail

**Users:** All

The original narrative, technical context, responsibility and follow-up remain available together.

![Report detail](images/live-views/45-handover-detail.png)

#### Report follow-up and revision history

**Users:** Authorized contributors

The report detail provides updates, state changes and attributed revision evidence.

![Report follow-up and revision history](images/live-views/46-handover-follow-up.png)

#### New technical issue

**Users:** All contributors

A concise report can be created with location and equipment context. The condition determines the technical workflow.

![New technical issue](images/live-views/47-handover-technical-form.png)

#### Technical issue - expanded detail and deadlines

**Users:** All contributors

The expanded technical form provides details, Ultimo reference, problem analysis, responsibility and action or feedback deadlines.

![Technical issue - expanded detail and deadlines](images/live-views/48-handover-technical-detail.png)

#### Safety report

**Users:** All contributors

Record a hazard or near miss, identify its area and add the information needed for follow-up.

![Safety report](images/live-views/49-handover-safety-form.png)

#### Information announcement

**Users:** Team Leader

Announcements can have an inclusive display-through date, supporting images and explicit people mentions.

![Information announcement](images/live-views/50-handover-information-form.png)

#### Success publication

**Users:** Authorized contributors

A success selects the reports or maintenance work whose result is being recorded and reviewed.

![Success publication](images/live-views/51-handover-success-form.png)

#### Add follow-up and coordinate a report

**Users:** Authorized contributors

Add an attributed note, change the issue state or coordinate responsibility within the current permissions.

![Add follow-up and coordinate a report](images/live-views/52-handover-update.png)

#### Assign report responsibility

**Users:** Team Leader, Administrator

The coordination form selects the responsible person and retains a note explaining the update.

![Assign report responsibility](images/live-views/53-handover-assign.png)

#### Correct a published report

**Users:** Author or coordinator

Corrections preserve the original content and require the current report revision and a reason.

![Correct a published report](images/live-views/54-handover-correction.png)

#### Current department status

**Users:** All

Problems and blocked-operation reports remain available across days until resolved.

**Practical example:** Review older pending work separately from today's reports.

![Current department status](images/live-views/55-handover-pending.png)

#### Meeting preparation

**Users:** Task Force, Technician

The shared meeting canvas brings daily reports and discussion topics together for shift handover.

**Practical example:** Prepare the subjects that need a decision or continuity in the next shift.

![Meeting preparation](images/live-views/56-meeting-preparation.png)

### Formal Handover

#### Formal shift records

**Users:** Team Leader, Task Force, Administrator

Transfers are linked to actual Workforce intervals and retain distinct draft, published and closed states.

![Formal shift records](images/live-views/60-shift-records.png)

#### Draft shift transfer

**Users:** Advanced operational profiles

Review the selected report evidence before publishing the transfer.

![Draft shift transfer](images/live-views/61-shift-draft.png)

#### Shift record editor

**Users:** Advanced operational profiles

Choose the planned shift, write a concise transfer summary and select the reports to carry.

![Shift record editor](images/live-views/62-shift-record-editor.png)

#### Published shift transfer and closure

**Users:** Advanced operational profiles

The open record accepts a closing outcome while preserving the report review.

![Published shift transfer and closure](images/live-views/63-shift-open.png)

#### Closed transfer and incoming acknowledgement

**Users:** Advanced operational profiles

Frozen selected and pending evidence is shown with the receiving acknowledgement workflow.

![Closed transfer and incoming acknowledgement](images/live-views/64-shift-closed.png)

#### Previous shift and retained transfer history

**Users:** Advanced operational profiles

The previous shift and current pending issues are displayed separately from immutable closed-transfer evidence.

![Previous shift and retained transfer history](images/live-views/65-shift-history.png)

#### New formal shift record

**Users:** Advanced operational profiles

Create a draft for an actual planned shift and location and choose the reports to transfer.

![New formal shift record](images/live-views/66-new-shift-record.png)

#### Incoming manager acknowledgement

**Users:** Incoming manager

The receiving acknowledgement is appended to the closed transfer with actor and time.

**Practical example:** Confirm receipt without changing the retained transfer evidence.

![Incoming manager acknowledgement](images/live-views/67-transfer-acknowledgement.png)

### Maintenance

#### Technician - assigned maintenance

**Users:** Technician

A Technician opens an assigned maintenance record directly from Start and uses the authorized work actions.

![Technician - assigned maintenance](images/live-views/19-technician-maintenance.png)

#### Maintenance board

**Users:** Team Leader, Task Force, Administrator

Work cards are organized by Open, In progress, Blocked and Done, with filters and supported status movement.

![Maintenance board](images/live-views/70-maintenance-board.png)

#### Maintenance records

**Users:** Authorized readers

The list provides a searchable and filterable alternative to the board.

![Maintenance records](images/live-views/71-maintenance-records.png)

#### My work

**Users:** Assigned workers

The personal work view focuses on the authenticated worker's assignments. Technicians enter assigned maintenance from Start.

![My work](images/live-views/72-maintenance-mine.png)

#### Maintenance detail and repair scope

**Users:** Authorized readers

The record retains the chosen intervention, location, responsible person or team and related handover reports.

![Maintenance detail and repair scope](images/live-views/73-maintenance-detail.png)

#### Completion review

**Users:** Assigned worker or coordinator

Finalization requires an outcome, task and workplace confirmation, and review of the related pending issues.

![Completion review](images/live-views/74-maintenance-completion.png)

#### Completion review - included and excluded reports

**Users:** Assigned worker or coordinator

Pending reports in scope must be included or explicitly excluded with a retained explanation.

![Completion review - included and excluded reports](images/live-views/75-maintenance-report-decisions.png)

#### Edit maintenance

**Users:** Author, assignee or coordinator

The form captures category, repair target, exact identifiers, priority, due date and intervention details.

![Edit maintenance](images/live-views/76-maintenance-edit.png)

#### Maintenance priority configuration

**Users:** Administrator

Priority labels and ranks are configured by the administrator.

![Maintenance priority configuration](images/live-views/77-maintenance-priorities.png)

#### New maintenance work

**Users:** Authorized contributors

Create a corrective, preventive or inspection record. Team Leaders and administrators may assign the work.

![New maintenance work](images/live-views/78-maintenance-new.png)

#### Block a maintenance job

**Users:** Author, assignee or coordinator

Moving work to Blocked requires a reason, so the team can see why the intervention cannot progress.

![Block a maintenance job](images/live-views/79-maintenance-block.png)

#### Maintenance revision history

**Users:** Authorized readers

Attributed revisions retain the record content, actor, timestamp and reason for material changes.

**Practical example:** Recover an earlier work scope without overwriting the current record.

![Maintenance revision history](images/live-views/79b-maintenance-history.png)

#### Reopen completed maintenance

**Users:** Authorized editors

Reopening requires an explanation and preserves the previous recorded outcome.

![Reopen completed maintenance](images/live-views/79c-maintenance-reopen.png)

### Data Analysis

#### Executive Overview

**Users:** Team Leader, Task Force, Administrator

The monthly overview combines priority indicators, area rankings and daily trends for management review.

**Practical example:** Present the selected month to management.

![Executive Overview](images/live-views/80-analysis-0.png)

#### Executive Overview - area matrix and daily trends

**Users:** Analytical readers

The monthly overview combines area rankings, an area/day matrix and daily frequency and accumulated alarm duration.

![Executive Overview - area matrix and daily trends](images/live-views/80b-executive-trends.png)

#### Halle analysis

**Users:** Team Leader, Task Force, Administrator

Compare Halles by fault frequency and alarm duration to focus technical investigation.

**Practical example:** Compare sectors and focus the investigation.

![Halle analysis](images/live-views/81-analysis-1.png)

#### Bereich analysis

**Users:** Team Leader, Task Force, Administrator

Compare areas within the selected Halle and identify where reported faults concentrate.

**Practical example:** Find affected areas within the selected sector.

![Bereich analysis](images/live-views/82-analysis-2.png)

#### Equipment analysis

**Users:** Team Leader, Task Force, Administrator

Investigate recurring equipment faults using rankings, trends and period filters.

**Practical example:** Review recurring behavior for exact source equipment codes.

![Equipment analysis](images/live-views/83-analysis-3.png)

#### Error analysis

**Users:** Team Leader, Task Force, Administrator

Review alarm messages, types and groups to identify recurring fault patterns.

**Practical example:** Investigate messages, types and groups.

![Error analysis](images/live-views/84-analysis-4.png)

#### Daily / monthly

**Users:** Team Leader, Task Force, Administrator

Compare daily and monthly behavior to understand how fault frequency and alarm duration change over time.

**Practical example:** Compare daily or monthly behavior with consistent filters.

![Daily / monthly](images/live-views/85-analysis-5.png)

#### Analytical filters

**Users:** Analytical readers

Period, sector, area and equipment constraints are available through the template's filter panel.

![Analytical filters](images/live-views/86-analysis-filters.png)

#### Equipment analysis - historical trend table

**Users:** Analytical readers

The expanded data tables retain period totals for the applied equipment investigation.

![Equipment analysis - historical trend table](images/live-views/88-analysis-pareto.png)

#### Source-group Pareto charts

**Users:** Analytical readers

Frequency and accumulated-duration rankings show cumulative shares against the complete selected source total.

**Practical example:** Use the rankings to prioritize an investigation.

![Source-group Pareto charts](images/live-views/88b-source-pareto.png)

#### Daily / monthly - investigation detail

**Users:** Analytical readers

Period trends and the contributing source groups remain available with the applied selection.

![Daily / monthly - investigation detail](images/live-views/89-analysis-history.png)

### Improvements

#### Improvement actions

**Users:** Team Leader, Task Force, Administrator

Actions retain their owner, location, target, status and evidence count.

![Improvement actions](images/live-views/110-improvements-list.png)

#### New improvement action

**Users:** Advanced operational profiles

Record a hypothesis, objective, owner and due date, with optional quantitative target and source links.

![New improvement action](images/live-views/111-improvement-new.png)

#### Improvement detail

**Users:** Advanced operational profiles

The action combines its hypothesis, target, state, attribution and links to original evidence.

![Improvement detail](images/live-views/112-improvement-detail.png)

#### Improvement evidence

**Users:** Advanced operational profiles

Notes and results retain their authorship, references and correction history.

![Improvement evidence](images/live-views/113-improvement-evidence.png)

#### Before and after comparison

**Users:** Advanced operational profiles

Choose non-overlapping periods and the same exact source selection to evaluate observed changes.

**Practical example:** Missing imports and unequal coverage remain visible.

![Before and after comparison](images/live-views/114-improvement-comparison.png)

#### Edit improvement action

**Users:** Advanced operational profiles

Changes retain a reason and revision; implementation and evaluation require their corresponding evidence.

![Edit improvement action](images/live-views/115-improvement-edit.png)

#### Observed comparison and data coverage

**Users:** Advanced operational profiles

Compare periods, review data coverage and check whether enough information is available to evaluate an improvement.

**Practical example:** Check the available data before assessing the result.

![Observed comparison and data coverage](images/live-views/116-improvement-result.png)

#### Comparison data and coverage

**Users:** Advanced operational profiles

Review reporting dates, the analysis period and equipment references behind a comparison.

![Comparison data and coverage](images/live-views/117-improvement-provenance.png)

### Asset Locator

#### Plant overview

**Users:** Team Leader and Task Force read; Administrator manages

Navigate between plant areas through a visual overview of equipment schematics.

**Practical example:** Open an area to inspect its retained components.

![Plant overview](images/live-views/120-locator-overview.png)

#### Plant overview - area group

**Users:** Advanced operational profiles

Filter the overview to a group of areas and open the scene relevant to the investigation.

**Practical example:** Use the selected group to locate Pick Tower 2.

![Plant overview - area group](images/live-views/120b-locator-reference-group.png)

#### Area scene

**Users:** Advanced operational profiles

Inspect an area schematic, its conveyors, sensors and equipment context.

![Area scene](images/live-views/121-locator-scene.png)

#### Edit scene model

**Users:** Administrator

Administrators can organize an area scene and maintain component details and positions.

![Edit scene model](images/live-views/122-locator-edit.png)

#### Component properties and asset placement

**Users:** Administrator

Each component has explicit geometry, identity, elevation and verification fields.

![Component properties and asset placement](images/live-views/123-locator-component.png)

#### Scene revision and component controls

**Users:** Administrator

Changes are saved with a revision note; earlier scene revisions remain retained.

![Scene revision and component controls](images/live-views/124-locator-save-history.png)

#### Asset placement search results

**Users:** Advanced operational profiles

Search registered equipment by code or name and review its recorded scene placement.

![Asset placement search results](images/live-views/126-locator-search-results.png)

#### Create a scene

**Users:** Administrator

An empty scene can be configured and populated with reusable components.

![Create a scene](images/live-views/127-locator-new-scene.png)

#### Prepared area model review

**Users:** Administrator

Model candidates indicate what can be prepared and which scenes require manual review.

**Practical example:** Review candidate preparation without modifying the scene.

![Prepared area model review](images/live-views/128-locator-model-review.png)

#### Scene revision history

**Users:** Administrator

The retained history records former schematic revisions and the note associated with each change.

![Scene revision history](images/live-views/129-locator-history.png)

#### Read-only Locator scene

**Users:** Team Leader, Task Force

Team Leaders and Task Force can inspect area scenes and equipment details during operational follow-up.

![Read-only Locator scene](images/live-views/160-locator-read-only.png)

### Assets

#### Asset directory

**Users:** Administrator

The registry lists stable equipment identities, locations and lifecycle states.

![Asset directory](images/live-views/90-assets-directory.png)

#### Digital Asset Record

**Users:** Administrator

The equipment record brings together identification, location, maintenance, reports and analytical history.

![Digital Asset Record](images/live-views/91-asset-record.png)

#### Asset timeline and source evidence

**Users:** Administrator

The timeline supports tracing a retained observation back to its owning source module.

![Asset timeline and source evidence](images/live-views/92-asset-timeline.png)

#### Asset registration and editing

**Users:** Administrator

The asset form maintains exact identifiers, location, lifecycle and explicit source aliases.

![Asset registration and editing](images/live-views/93-asset-editor.png)

#### Equipment references and identity

**Users:** Administrator

Connect equipment codes used by different sources to the appropriate equipment record.

![Equipment references and identity](images/live-views/94-asset-aliases.png)

#### Original alarm record

**Users:** Administrator

Open the original alarm information behind an equipment timeline entry.

![Original alarm record](images/live-views/102-analytical-evidence.png)

#### Register an equipment identity

**Users:** Administrator

Choose a reported identifier or enter an exact manual code with its configured location and initial identity state.

![Register an equipment identity](images/live-views/103-asset-register.png)

### Asset Management

#### Inventory model

**Users:** Administrator

The model inventory distinguishes configured types, parent relationships and survey decisions.

![Inventory model](images/live-views/95-asset-model-inventory.png)

#### Asset model detail

**Users:** Administrator

Structured equipment data includes manufacturer, model, serial, composition, controllers and attributed survey evidence.

![Asset model detail](images/live-views/96-asset-model-detail.png)

#### Asset model editor

**Users:** Administrator

Maintain typed metadata and explicit composition or controller relationships without rewriting source facts.

![Asset model editor](images/live-views/97-asset-model-edit.png)

#### Reusable type catalog

**Users:** Administrator

Type definitions configure containment, controller capabilities and additional structured fields.

![Reusable type catalog](images/live-views/98-asset-types.png)

#### Source mapping review

**Users:** Administrator

Imported tuples and reviewed candidate mappings remain explicit, including pending and ambiguous cases.

![Source mapping review](images/live-views/99-source-mappings.png)

#### Equipment-reference mapping

**Users:** Administrator

Link an imported equipment reference to its registered asset and record the review decision.

![Equipment-reference mapping](images/live-views/100-mapping-editor.png)

#### Canonical asset Pareto

**Users:** Administrator

Rank equipment by fault frequency and alarm duration, with unlinked equipment references visible for review.

![Canonical asset Pareto](images/live-views/101-canonical-pareto.png)

#### Structured asset type fields

**Users:** Administrator

A reusable type can define required or optional text, number, boolean and date metadata fields.

![Structured asset type fields](images/live-views/104-asset-type-schema.png)

### Operational Context

#### Area overview

**Users:** All, with profile-specific sources

The selected location combines the journal date, current pending issues, maintenance and independently authorized analytical or formal-shift context.

![Area overview](images/live-views/153-area-overview.png)

#### Global search

**Users:** All, with profile-specific sources

Current search results for Halle are grouped by their original source and open exact records within the user's access.

![Global search](images/live-views/154-global-search.png)

### Administration

#### Administrator landing - personal context

**Users:** Administrator

The administrator landing retains personal context and current information above the account and data activity panels.

![Administrator landing - personal context](images/live-views/130-administration.png)

#### Administration - accounts and source activity

**Users:** Administrator

Account totals, recent account changes and the latest source file support daily platform administration.

**Practical example:** Check access changes and the last received dataset.

![Administration - accounts and source activity](images/live-views/130b-admin-activity.png)

### Data Administration

#### Import files

**Users:** Administrator

Submit a daily CSV, confirm its reporting date and review the retained import history.

![Import files](images/live-views/131-imports.png)

#### Import review

**Users:** Administrator

Review imported and rejected records and identify data that needs attention.

![Import review](images/live-views/132-import-review.png)

#### Original source rows and filters

**Users:** Administrator

Filter and inspect source columns and physical lines while retaining their original import references.

![Original source rows and filters](images/live-views/134-source-rows.png)

#### Data preparation

**Users:** Administrator

Define how imported equipment, areas and alarm descriptions are grouped for analysis.

![Data preparation](images/live-views/135-data-preparation.png)

#### KPI settings and goals

**Users:** Administrator

Select executive message KPIs, frequency or duration and optional daily-average goals.

![KPI settings and goals](images/live-views/137-kpi-settings.png)

#### Source-file column filters

**Users:** Administrator

Narrow imported records by equipment, area, message or other source fields.

**Practical example:** Narrow a file to the equipment or message supporting an investigation.

![Source-file column filters](images/live-views/138-source-filters.png)

#### Expanded preparation rules and corrections

**Users:** Administrator

Maintain area groupings and naming corrections so reports use consistent terminology.

![Expanded preparation rules and corrections](images/live-views/139-preparation-rules.png)

### User Administration

#### Users and profiles

**Users:** Administrator

Individual accounts are listed with current profile and access state.

![Users and profiles](images/live-views/140-users.png)

#### Create an individual account

**Users:** Administrator

The account form captures a person's display name, username and selected access profile.

![Create an individual account](images/live-views/141-user-create.png)

#### User details and profile access

**Users:** Administrator

An account's display name, profile and active state can be managed with retained history.

![User details and profile access](images/live-views/142-user-details.png)

### Integrations

#### Integration readiness

**Users:** Administrator

Review the connection settings for WinCC analysis, Ultimo maintenance information and corporate sign-in.

![Integration readiness](images/live-views/150-integrations.png)

#### Provider configuration history

**Users:** Administrator

Review who changed an integration setting and when.

![Provider configuration history](images/live-views/151-integration-history.png)

#### WinCC configuration

**Users:** Administrator

Prepare the connection used to bring WinCC information into operational analysis.

![WinCC configuration](images/live-views/152-integration-editor.png)

#### Microsoft Entra configuration

**Users:** Administrator

Prepare corporate sign-in so employees can access IOP with their work accounts.

![Microsoft Entra configuration](images/live-views/155-integration-editor.png)
