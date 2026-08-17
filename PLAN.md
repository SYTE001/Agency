# TikTok Agency OS — PLAN.md

## 0. Project Goal

Build a web-based internal operating system for TikTok Shop / Creator / Live Commerce agencies.

The product is **not** a clone of TikTok Partner Center.

Its job is to become the agency's operational layer above TikTok data:

> DATA → WORK → OWNER → ACTION → RESULT

The dashboard must help an agency answer within seconds:

1. What is performing?
2. What is declining?
3. What requires action today?
4. Which creator/campaign/client is responsible?
5. How much GMV/revenue/commission is being generated?
6. What work is overdue?

Primary users:

- Agency Owner / Director
- Account Manager
- Creator / Talent Manager
- Campaign Manager
- Live / Operations Manager
- Finance
- Admin

---

# 1. Core Product Thesis

TikTok already provides platform analytics.

The SaaS should solve the problems around that data:

- fragmented creator information
- campaign follow-up
- content approval
- deadlines
- sample/product tracking
- creator communication
- live scheduling
- issue/alert tracking
- commission calculation
- client reporting
- internal accountability
- historical performance
- action recommendations

The product should therefore be designed as:

## Agency Operating System

not:

## TikTok Analytics Clone

---

# 2. MVP Scope

Build these six core modules first:

1. Overview
2. Creators
3. Campaigns
4. Content
5. LIVE
6. Finance

Secondary modules:

7. Brands / Clients
8. Products
9. Tasks / Activity
10. Reports
11. Settings / Team / Roles

Do not build every possible feature in v1.

---

# 3. Product Workflow

The primary business workflow is:

```text
BRAND
  ↓
CAMPAIGN
  ↓
CREATOR SELECTION
  ↓
PRODUCT / SAMPLE
  ↓
CONTENT BRIEF
  ↓
DRAFT
  ↓
REVISION
  ↓
APPROVAL
  ↓
PUBLISHED
  ↓
LIVE / SALES
  ↓
GMV
  ↓
COMMISSION
  ↓
SETTLEMENT
  ↓
REPORT
```

Secondary workflow:

```text
CREATOR
  ↓
PERFORMANCE
  ↓
ALERT
  ↓
FOLLOW-UP
  ↓
ACTION
  ↓
RESULT
```

This second workflow is critical.

Analytics without action is not the product.

---

# 4. Information Architecture

```text
App
├── Overview
│
├── Creators
│   ├── All Creators
│   ├── Creator Detail
│   ├── Performance
│   └── Contracts / Notes
│
├── Brands
│   ├── All Brands
│   └── Brand Detail
│
├── Campaigns
│   ├── Active
│   ├── Upcoming
│   ├── Completed
│   └── Campaign Detail
│
├── Content
│   ├── Pipeline
│   ├── Review Queue
│   └── Content Detail
│
├── LIVE
│   ├── Schedule
│   ├── Live Sessions
│   └── Live Detail
│
├── Products
│   ├── Catalog
│   └── Samples
│
├── Finance
│   ├── Revenue
│   ├── Commission
│   ├── Settlements
│   └── Creator Payout
│
├── Reports
│
├── Tasks
│
└── Settings
    ├── Team
    ├── Roles
    ├── Integrations
    └── Agency Settings
```

---

# 5. Overview Dashboard

The Overview page is the most important screen.

## Primary KPIs

- Total GMV
- GMV growth
- Agency revenue
- Active creators
- Active campaigns
- Active brands
- Today's LIVE sessions
- Pending settlements

## Operational Alerts

Examples:

```text
12 creators have declining performance
8 campaign tasks are overdue
17 content items require review
5 creators have not submitted content
3 LIVE sessions need operator assignment
4 settlements are pending
```

Every alert must be actionable.

Example:

```text
Creator performance ↓ 32%

[View creator]
[Assign follow-up]
```

Avoid passive warning cards.

---

# 6. Creator Module

## Creator table

Fields:

- profile photo
- username
- display name
- category
- followers
- engagement rate
- GMV
- GMV growth
- videos
- average views
- LIVE GMV
- active campaigns
- status
- manager
- last activity

Filters:

- category
- follower range
- GMV
- growth
- status
- manager
- campaign
- brand
- LIVE
- date range

## Creator detail

Sections:

```text
Profile
Performance
Campaigns
Content
LIVE
Revenue / Commission
Tasks
Notes
Activity History
```

## Creator health

Create a simple health state:

```text
Healthy
Watch
At Risk
Inactive
```

Do not invent AI scores without explainable inputs.

---

# 7. Creator Discovery / Matching

This should be phase 2, not a hard dependency for MVP.

Input:

```text
Brand
Product
Category
Target audience
Follower range
Budget
GMV target
Required creator count
```

Output:

```text
Suggested Creators
Match Score
Reason
Historical category performance
GMV
Engagement
Average views
Previous brand work
```

The match score must be explainable.

Example:

```text
92% match

+ strong Beauty GMV
+ target audience fit
+ historical skincare performance
- higher creator fee
```

---

# 8. Brands Module

Each brand should have:

- company profile
- contact person
- campaigns
- products
- total GMV
- total spend
- agency revenue
- active creators
- contracts
- notes
- tasks
- reports

Brand detail should answer:

> How much business does this client generate for the agency?

---

# 9. Campaign Module

Campaign lifecycle:

```text
Draft
↓
Planning
↓
Recruiting
↓
Active
↓
Content Review
↓
Published
↓
Completed
↓
Reporting
```

Campaign fields:

- campaign name
- brand
- owner
- start date
- end date
- budget
- creator target
- selected creators
- products
- content target
- live target
- GMV target
- actual GMV
- commission
- status
- progress
- notes

Campaign detail:

```text
Overview
Creators
Products
Content
Tasks
Timeline
Performance
Finance
Activity
```

---

# 10. Content Pipeline

Content status:

```text
Brief
Assigned
Waiting for Draft
Draft Submitted
Revision
Approved
Scheduled
Published
Rejected
Cancelled
```

Kanban should be the default interface.

Example:

```text
BRIEF
  12

DRAFT
  8

REVISION
  5

APPROVED
  14

PUBLISHED
  61
```

Each content item:

- creator
- campaign
- product
- brief
- due date
- publish date
- content URL
- status
- revision count
- reviewer
- notes
- performance snapshot

---

# 11. LIVE Module

LIVE schedule should feel operational.

Calendar views:

- day
- week
- month

LIVE session fields:

- creator/host
- brand
- product
- room/studio
- operator
- start time
- end time
- target GMV
- actual GMV
- viewers
- orders
- conversion
- status
- notes

Statuses:

```text
Scheduled
Preparing
Live
Ended
Cancelled
Needs Review
```

LIVE dashboard:

```text
LIVE NOW
Upcoming
Today's GMV
Today's Sessions
Underperforming Sessions
```

---

# 12. Finance Module

Finance must separate platform numbers from agency numbers.

Core fields:

```text
Gross GMV
Creator Commission
Agency Share
Agency Revenue
Creator Payout
Pending Settlement
Paid Settlement
```

Example:

```text
GMV                    Rp100M
Creator Commission     Rp10M
Agency Share            30%
Agency Revenue           Rp3M
Creator Share             Rp7M
```

Finance views:

- revenue summary
- creator payout
- agency commission
- brand revenue
- campaign revenue
- settlement status
- transaction history

Use explicit calculation formulas.

Never hide financial calculations behind unexplained numbers.

---

# 13. Reports

Reports should be generated from existing data.

Examples:

## Client report

```text
Brand
Campaign
Period

GMV
Orders
Creators
Videos
LIVE Sessions
Top Creators
Top Products
Agency Performance
```

## Internal report

```text
Agency GMV
Revenue
Creator Productivity
Campaign Completion
Content Completion
LIVE Performance
Pending Tasks
Financial Status
```

Export targets:

- CSV
- PDF (later)
- shareable web report (later)

---

# 14. Task / Activity System

This is one of the highest-value features.

Every operational object can create a task.

Examples:

```text
Follow up creator
Review draft
Approve campaign
Confirm sample shipment
Schedule LIVE
Send client report
Check settlement
```

Task fields:

- title
- owner
- related entity
- priority
- due date
- status
- notes
- created by
- completed by

Activity timeline should exist on:

- creator
- campaign
- brand
- content
- LIVE
- finance record

---

# 15. Alerts

MVP alerts should be deterministic.

Examples:

```text
Creator GMV ↓ > 20% over comparison window
Content overdue
Campaign deadline approaching
Creator inactive
LIVE target missed
Settlement pending
Campaign completion below target
```

Do not start with AI-generated alerts.

Build reliable rules first.

---

# 16. Roles & Permissions

Minimum RBAC:

```text
Owner
Admin
Account Manager
Creator Manager
Campaign Manager
LIVE Manager
Finance
Viewer
```

Permissions must be resource-based.

Examples:

```text
Creator Manager:
read creators
edit creators
read campaigns
no finance write

Finance:
read finance
write settlements
read campaigns
no creator management

Viewer:
read-only
```

Use server-side authorization.

Do not rely only on UI hiding.

---

# 17. Database Model

Use a relational schema.

Core tables:

```text
agencies
users
roles
user_roles

brands
brand_contacts

creators
creator_metrics
creator_platform_accounts

campaigns
campaign_creators
campaign_products

products
product_metrics

content_items
content_revisions

live_sessions
live_metrics

tasks
activities
notes

commissions
creator_payouts
settlements

reports
report_items

integrations
sync_jobs
sync_logs
```

Recommended relationships:

```text
Agency
 ├── Users
 ├── Brands
 ├── Creators
 ├── Campaigns
 ├── Products
 ├── LIVE Sessions
 └── Finance

Campaign
 ├── Brand
 ├── Creators
 ├── Products
 ├── Content
 ├── LIVE Sessions
 └── Finance
```

Every business table should include:

```text
id
agency_id
created_at
updated_at
```

Use `agency_id` for multi-tenant isolation.

---

# 18. Multi-Tenant Architecture

The product must be multi-tenant from the start.

Rules:

```text
ONE AGENCY = ONE TENANT

Every business record belongs to an agency.

Users can access only records belonging
to their agency.
```

Do not create a single global database namespace where every tenant can query everything.

Recommended with Supabase:

- PostgreSQL
- Row Level Security
- Supabase Auth
- agency membership table
- server-side validation
- storage buckets scoped by agency

---

# 19. Integration Architecture

Do not tightly couple the UI directly to TikTok APIs.

Use:

```text
TikTok / Other Sources
        ↓
Integration Layer
        ↓
Sync Jobs
        ↓
Normalized Database
        ↓
Business Logic
        ↓
Dashboard
```

Suggested components:

```text
integrations
sync_jobs
sync_logs
external_accounts
external_ids
```

Every external object should preserve its source ID.

Example:

```text
creator.external_id
campaign.external_id
product.external_id
```

This avoids duplicate records and makes synchronization possible.

---

# 20. TikTok Integration Strategy

Important:

The SaaS must use authorized integrations / official APIs where available.

Do not build the architecture around scraping or browser automation.

The first version should support:

```text
Manual Data Import
CSV Import
Mock Data
```

Then:

```text
TikTok OAuth / Partner Integration
↓
Sync
↓
Normalize
↓
Dashboard
```

This allows product development without blocking on external API approval.

---

# 21. Mock Data Strategy

Build realistic seed data.

Minimum:

```text
1 agency
5 users
20 brands
100 creators
50 products
20 campaigns
200 content items
30 LIVE sessions
300 finance records
500 tasks/activity records
```

Use Indonesian-like names and realistic Rupiah amounts.

Data distribution must create realistic situations:

- strong creators
- declining creators
- overdue content
- active campaigns
- completed campaigns
- pending settlements
- underperforming LIVE
- high-performing products

The dashboard must not look empty.

---

# 22. UI / UX Direction

Design principle:

## Apple-like operational minimalism

Requirements:

- clean spacing
- strong hierarchy
- low visual noise
- precise alignment
- high contrast
- light and dark mode
- compact but readable tables
- responsive desktop-first layout
- meaningful empty states
- minimal gradients
- no decorative AI graphics
- no excessive glassmorphism
- no dashboard card explosion

The UI should feel closer to:

```text
Linear
Raycast
Stripe Dashboard
Apple System UI
Notion database
```

than a generic AI SaaS template.

---

# 23. Overview Layout

Recommended desktop hierarchy:

```text
TOP BAR
Agency selector | Search | Date | Notifications | User

SIDEBAR
Overview
Creators
Brands
Campaigns
Content
LIVE
Products
Finance
Reports
Tasks
Settings

MAIN
Greeting / Date

KPI Row
GMV | Revenue | Creators | Campaigns

Performance Chart

Operational Alerts

Campaign Progress

LIVE Today

Top Creators

Recent Activity
```

Do not put 15 equal cards above the fold.

---

# 24. Search

Global search must eventually support:

```text
Creator
Brand
Campaign
Product
Content
LIVE session
Task
```

Example:

```text
⌘ K

Search "somethinc"
```

Results grouped by entity.

---

# 25. Technical Stack

Recommended baseline:

```text
Frontend:
Next.js
TypeScript
React

Styling:
Tailwind CSS
shadcn/ui or equivalent component system

Backend:
Next.js server actions / route handlers
Supabase

Database:
PostgreSQL

Auth:
Supabase Auth

Storage:
Supabase Storage

Deployment:
Vercel

Charts:
Recharts / lightweight chart library

Validation:
Zod

Forms:
React Hook Form

Testing:
Vitest
Playwright
```

Do not introduce a second backend unless required.

---

# 26. Code Architecture

Preferred structure:

```text
app/
components/
features/
lib/
services/
types/
utils/
database/
hooks/
```

Feature modules:

```text
features/
├── creators/
├── brands/
├── campaigns/
├── content/
├── live/
├── finance/
├── tasks/
└── reports/
```

Keep domain logic in `features` / `services`.

Avoid putting all business logic directly inside page components.

---

# 27. Development Phases

## Phase 0 — Discovery & Architecture

Deliverables:

- workflow map
- entity map
- database ERD
- role matrix
- API boundaries
- navigation map

Do not build polished UI yet.

---

## Phase 1 — Foundation

Build:

- Next.js app structure
- Supabase project
- authentication
- agency membership
- RBAC
- database migrations
- RLS
- base UI system
- layout
- navigation

Acceptance:

- user can sign in
- user belongs to one agency
- data isolation works
- role restrictions work

---

## Phase 2 — Core CRM

Build:

- Creators
- Brands
- Products
- Search
- Detail pages
- Notes
- Tasks
- Activity timeline

Acceptance:

- CRUD works
- filtering works
- relations work
- activity is recorded

---

## Phase 3 — Campaign & Content Operations

Build:

- Campaigns
- Campaign creators
- Content pipeline
- Kanban
- deadlines
- revision tracking
- progress

Acceptance:

```text
Campaign
→ Creator
→ Content
→ Approval
→ Published
```

works end-to-end.

---

## Phase 4 — LIVE Operations

Build:

- LIVE calendar
- sessions
- hosts
- rooms
- targets
- performance
- status

Acceptance:

An operator can schedule and track a LIVE session without external spreadsheets.

---

## Phase 5 — Finance

Build:

- commissions
- creator payout
- agency revenue
- settlements
- financial dashboard

Acceptance:

Financial calculations are traceable from source transaction → commission → agency share → payout.

---

## Phase 6 — Overview Intelligence

Now connect all modules.

Build:

- KPI aggregation
- performance charts
- operational alerts
- creator health
- campaign health
- overdue indicators
- activity feed

This phase should make the product feel like one system rather than separate CRUD pages.

---

## Phase 7 — Integration

Only after internal workflows work.

Build:

- OAuth
- external account linking
- sync jobs
- external IDs
- import/export
- sync logs
- retry logic

Start with read-only synchronization.

Do not immediately build write-back automation.

---

## Phase 8 — Reporting

Build:

- client report
- internal report
- CSV export
- shareable report
- period comparison

---

# 28. Future Features

Do not include in MVP.

Potential later modules:

```text
AI Creator Matching
AI Brief Generator
AI Campaign Planner
Automated Follow-up
WhatsApp integration
Email integration
Slack integration
Client portal
Advanced attribution
Forecasting
Anomaly detection
Agency benchmarking
Creator marketplace
Automated payouts
Contract management
Mobile app
```

Priority should be based on actual agency workflow pain.

---

# 29. Non-Goals

Do NOT build these first:

- social media feed clone
- TikTok clone
- generic CRM
- generic project management app
- generic AI chatbot
- giant analytics wall
- fake AI recommendations
- scraping infrastructure
- complex mobile app
- dozens of chart types
- unnecessary animations

---

# 30. Core Product Metrics

Internal SaaS metrics:

```text
Daily Active Users
Weekly Active Agencies
Creators managed / agency
Campaigns managed / agency
Content completion rate
Task completion rate
LIVE sessions managed
GMV tracked
Agency revenue tracked
Settlement processing time
```

Operational metrics:

```text
Campaign completion %
Content on-time %
Creator activity %
GMV growth
Revenue growth
LIVE target achievement %
```

---

# 31. Acceptance Criteria

The MVP is considered usable when an agency can perform this complete flow:

```text
1. Create brand
2. Add creators
3. Add products
4. Create campaign
5. Assign creators
6. Create content tasks
7. Track draft → revision → approval → published
8. Schedule LIVE
9. Record LIVE results
10. Record GMV
11. Calculate commission
12. Create creator payout
13. See campaign performance
14. See agency overview
15. Export report
```

The entire flow must work without editing the database manually.

---

# 32. Quality Requirements

Performance:

- fast initial navigation
- table pagination
- server-side filtering where appropriate
- avoid loading all records into browser
- aggregate expensive metrics server-side
- skeleton loading
- sensible caching

Security:

- RLS enabled
- tenant isolation
- server-side authorization
- validated inputs
- no secrets in client
- audit-sensitive actions

Reliability:

- database migrations
- seeded test data
- error states
- empty states
- retryable sync jobs
- logs

---

# 33. DeepSeek CLI Execution Rules

DeepSeek CLI should work sequentially.

Before changing code:

1. Inspect existing repository.
2. Identify current stack.
3. Identify existing database/schema.
4. Preserve working architecture unless a change is necessary.
5. Build one phase at a time.
6. Run tests/typecheck/lint after each phase.
7. Do not create duplicate components or parallel systems.
8. Do not invent API endpoints that do not exist.
9. Use mock adapters before external API integration.
10. Keep external providers behind a service interface.

For every major task, DeepSeek should report:

```text
Changed files
Database changes
Routes/pages added
Components added
Tests added
Known issues
Next recommended task
```

---

# 34. Prompt Pattern for DeepSeek CLI

Use this pattern when assigning implementation tasks:

```text
You are working on TikTok Agency OS.

First inspect the repository and existing architecture.

Do not rewrite working architecture without a concrete reason.

Task:
[DESCRIBE ONE TASK]

Requirements:
- Follow the existing stack and conventions.
- Preserve multi-tenant isolation.
- Use Supabase/RLS correctly.
- Keep domain logic out of page components.
- Add loading, empty, error, and success states.
- Add types and validation.
- Add tests where practical.
- Run lint/typecheck/tests after implementation.

Before finishing:
1. Summarize files changed.
2. Summarize schema changes.
3. Report test results.
4. Report any assumptions.
5. Report any remaining issue.

Do not silently skip failed checks.
```

---

# 35. Recommended Build Order

Absolute priority:

```text
1. Foundation
2. Auth + Agency + RBAC
3. Database + RLS
4. Creators
5. Brands
6. Products
7. Campaigns
8. Content Pipeline
9. Tasks / Activity
10. LIVE
11. Finance
12. Overview
13. Reports
14. Integration Layer
15. TikTok Integration
16. AI / Automation
```

This order is intentional.

Do not start with the Overview dashboard.

The Overview is an aggregation layer and will become inaccurate if the underlying operational modules do not exist.

---

# 36. Final Product Positioning

The product should ultimately be positioned as:

> **The operating system for TikTok commerce agencies.**

Not:

> TikTok analytics dashboard.

Its differentiation is:

```text
TikTok Data
+
Agency Workflow
+
Team Accountability
+
Campaign Operations
+
Finance
+
Actionable Alerts
```

The most valuable screen is not the chart.

It is the screen that tells the agency:

> "These are the 7 things you need to deal with today."
