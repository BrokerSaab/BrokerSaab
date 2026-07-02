# Business Requirements Document (BRD)
# BrokerSaab — Web Application

---

**Document Version:** 1.0  
**Prepared By:** BrokerSaab Engineering Team  
**Date:** June 26, 2026  
**Status:** Final Draft  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Application Overview](#2-application-overview)
3. [User Roles & Personas](#3-user-roles--personas)
4. [Module 1 — User (Client) Management](#module-1--user-client-management)
5. [Module 2 — Advisor Management](#module-2--advisor-management)
6. [Module 3 — Admin Management](#module-3--admin-management)
7. [Module 4 — Payment & Subscription System](#module-4--payment--subscription-system)
8. [Module 5 — Support & Ticketing System](#module-5--support--ticketing-system)
9. [Cross-Cutting Concerns](#cross-cutting-concerns)
10. [API Endpoints Reference](#api-endpoints-reference)
11. [Test Scenarios by Module](#test-scenarios-by-module)
12. [Validation Rules Reference](#validation-rules-reference)
13. [Glossary](#glossary)

---

## 1. Executive Summary

BrokerSaab is a B2C marketplace platform connecting clients (individuals or businesses seeking financial/legal advisory services) with verified professional advisors. The platform manages the complete lifecycle: advisor discovery → consultation booking → fee negotiation → escrow-based work delivery → payment release.

**Core Value Proposition:**
- Clients find trusted, KYC-verified advisors by category, location, and expertise
- Advisors gain a managed channel for bookings, fee quotes, and escrow-protected service delivery
- Admins operate a two-tier (Super Admin + Sub Admin) review pipeline to verify and manage advisors

**Tech Stack:**
- Frontend: Next.js (React) — deployed on Vercel (`frontend-tellar.vercel.app`)
- Backend: Node.js + Express + Prisma ORM — deployed on Render (`brokersaab-backend.onrender.com`)
- Database: PostgreSQL (via Prisma)
- Payments: Razorpay (primary) + Stripe (secondary)
- Push Notifications: Expo Push Notifications
- Real-time: Socket.IO

---

## 2. Application Overview

### 2.1 Site Map

```
PUBLIC ROUTES
├── /                          Home / Marketplace landing
├── /about                     About BrokerSaab
├── /services                  Service categories browser
├── /how-we-work               Platform explainer page
├── /contact                   Contact / Feedback form
├── /advisors                  Public advisor catalog (searchable)
└── /advisors/[id]             Individual advisor public profile

AUTH ROUTES
├── /auth                      Client OTP login / Registration
└── /auth/admin                Admin / Super Admin login

ADVISOR ROUTES
├── /advisors/onboarding       Advisor 8-step registration funnel
├── /advisor/dashboard         Advisor workspace
├── /advisor/profile           Profile self-edit
├── /advisor/services          Service & specialization config
└── /advisor/badge             Authorized dealer subscription status

CLIENT ROUTES
├── /bookings                  Client booking management
├── /buy-pack                  Purchase contact unlock credit packs
└── /tickets/[id]              Service ticket (escrow work order) detail

ADMIN ROUTES (implied from API — rendered as SPA sections)
├── /admin/dashboard           KPI overview
├── /admin/advisors            Advisor list + filters
├── /admin/advisors/pending    Pending review queue
├── /admin/users               Client user list
├── /admin/sub-admins          Sub-admin management
├── /admin/bookings            Platform-wide bookings
├── /admin/subscriptions       Advisor subscription records
├── /admin/contact-unlocks     Contact unlock analytics
├── /admin/funnel              Onboarding drop-off analytics
└── /admin/change-requests     Advisor sensitive field change queue
```

### 2.2 System Actors

| Actor | Description |
|---|---|
| **Client** | End user seeking advisory services; signs up via OTP |
| **Advisor** | Professional (financial/legal) registered and KYC-verified on platform |
| **Sub Admin** | Internal team member who reviews advisor KYC documents |
| **Super Admin** | Platform owner with full oversight; final approval authority |

---

## 3. User Roles & Personas

### 3.1 Role Summary

| Feature Area | Client | Advisor | Sub Admin | Super Admin |
|---|:---:|:---:|:---:|:---:|
| OTP-based login | ✓ | — | — | — |
| Email + Password login | ✓ (optional) | ✓ | ✓ | ✓ |
| Advisor search / browse | ✓ | — | — | — |
| Book consultation | ✓ | — | — | — |
| Request fee quote | ✓ | — | — | — |
| Accept / pay for quote | ✓ | — | — | — |
| Close escrow ticket | ✓ | — | — | — |
| Submit fee quote | — | ✓ | — | — |
| Manage work stages | — | ✓ | — | — |
| View own KYC status | — | ✓ | — | — |
| Review advisor KYC | — | — | ✓ | ✓ |
| Approve advisor | — | — | ✓* | ✓ |
| Create sub-admins | — | — | — | ✓ |
| Platform analytics | — | — | — | ✓ |
| Export data | — | — | — | ✓ |

*Sub Admin can submit for final approval; Super Admin grants final APPROVED status.

---

## Module 1 — User (Client) Management

### 1.1 Overview

Clients are end-users who consume advisory services. A client account is created automatically upon first OTP verification. Clients can search advisors, book consultations, request fee quotes, and track service delivery via escrow tickets.

---

### 1.2 Pages & Screens

#### Page: `/auth` — Client Authentication

**Purpose:** Entry point for client signup and login.

**Two Flows:**

**Flow A — OTP Login (New + Returning Users):**
```
Step 1: Phone Number Entry
  - Field: Phone Number (10-digit, 6-9 prefix)
  - CTA: "Send OTP"
  - Backend: POST /auth/otp/send

Step 2: OTP Verification
  - Field: 6-digit OTP (auto-sent via SMS, 5-minute TTL)
  - CTA: "Verify OTP"
  - Resend option after timer expires
  - Backend: POST /auth/otp/verify

Step 3a (New User): Complete Registration
  - Field: Full Name (required)
  - Field: Email (optional)
  - CTA: "Create Account"
  - Backend: POST /auth/register/complete

Step 3b (Existing User): Redirect to Dashboard
  - JWT access token issued (24h validity)
  - Refresh token issued (30-day validity)
  - Wallet balance returned in response
```

**Flow B — Password Login (Optional, for returning users who set a password):**
```
  - Field: Phone Number
  - Field: Password
  - CTA: "Login"
  - Backend: POST /auth/login/phone-password
```

**Post-Login:** Wallet auto-created if not exists. User redirected to home or previous page.

**Optional: Set Password** (after OTP login)
```
  - Field: New Password (8+ chars, uppercase + lowercase + digit)
  - Field: Confirm Password
  - CTA: "Set Password"
  - Backend: POST /auth/password/set
```

---

#### Page: `/` — Home / Marketplace

**Purpose:** Discovery hub for advisors and services.

**Key Sections:**
- Hero banner with search bar
- Service category grid (browse by m1–m28 categories)
- Featured advisor cards (image, name, specialization, rating, location)
- "How it works" explainer section
- Testimonials carousel

**Functionality:**
- Quick search by advisor name, service type, or location
- Category selection routes to `/advisors` with pre-applied filter

---

#### Page: `/advisors` — Advisor Catalog

**Purpose:** Searchable, filterable list of all APPROVED advisors.

**Filters Available:**
| Filter | Type | Description |
|---|---|---|
| Search | Text | Name, business name, location |
| Category | Multi-select | m1–m28 service categories |
| State | Dropdown | Geographic state |
| Experience | Range | Min/Max years |
| Fee | Range | Consultation fee range (₹) |
| Rating | Star selector | Minimum average rating |
| Availability | Toggle | Only show advisors with open slots |

**Advisor Card Shows:**
- Profile photo
- Full name + Business name
- Top category badges
- Average rating + review count
- Location (city/state)
- Consultation fee
- "View Profile" CTA
- "Authorized Dealer" badge (if applicable)

---

#### Page: `/advisors/[id]` — Advisor Profile Detail

**Purpose:** Full public profile of a single advisor.

**Sections:**
1. **Header** — Cover image, avatar, name, rating, location, fee
2. **About** — Bio, business name, experience years, languages
3. **Services** — Categories and specializations
4. **Availability** — Weekly slot calendar
5. **Reviews** — Past client ratings and text reviews
6. **Action Panel:**
   - "Book Consultation" (triggers booking flow)
   - "Request Fee Quote" (triggers quote request form)
   - "Unlock Contact" (triggers credit deduction or pack purchase prompt)

**Booking Flow (initiated from this page):**
```
Step 1: Select Slot
  - Date picker → shows available slots for that date
  - Select time slot

Step 2: Choose Mode
  - PHONE / VIDEO / CHAT / PHYSICAL (in-person)

Step 3: Add Note (optional)
  - Short message to advisor

Step 4: Confirm & Pay
  - Displays fee breakdown
  - Payment method: Wallet / Razorpay / Stripe
  - Backend: POST /bookings then POST /payments/checkout
```

---

#### Page: `/bookings` — Client Booking Management

**Purpose:** View all past and upcoming consultations.

**Booking Statuses:**

| Status | Meaning |
|---|---|
| PENDING | Created, awaiting payment |
| ACCEPTED | Paid, advisor notified |
| COMPLETED | Advisor marked complete |
| CANCELLED | Cancelled by either party |

**Each Booking Card Shows:**
- Advisor name + avatar
- Date/time + mode (Phone/Video/Chat/Physical)
- Status badge
- Amount paid
- "View Details" CTA

**Booking Detail Modal:**
- Full transaction details
- Advisor contact (if unlocked)
- Chat room link (if applicable)

---

#### Page: `/buy-pack` — Contact Unlock Credit Packs

**Purpose:** Purchase credits to unlock advisor contact information.

**Pack Options:**
- Displayed as cards with credit count + validity + price
- Example: 20 credits / 1 year / ₹X

**Purchase Flow:**
```
Select Pack → Initiate Razorpay Order → Pay → Credits Added to Account
Backend: POST /payments/wallet/add or dedicated pack purchase endpoint
```

**Credit Usage:**
- 1 credit = unlock 1 advisor's contact details
- Free unlocks may be granted for first-time connects

---

#### Page: `/tickets/[id]` — Service Ticket (Escrow Work Order)

**Purpose:** Track and manage active escrow work order between client and advisor.

**Ticket Lifecycle:**

```
OPEN → IN_PROGRESS → AWAITING_CONFIRM → CLOSED (PAYOUT_RELEASED)
                                      ↘ DISPUTED
```

**Page Sections:**
1. **Header** — Ticket ID, advisor name, status badge, total amount
2. **Work Stages Panel:**
   - Each stage: title, description, status
   - Stage statuses: PENDING → IN_PROGRESS → AWAITING_CONFIRM → CONFIRMED
   - Client action: "Confirm Stage" button (when AWAITING_CONFIRM)
3. **Comments Thread:**
   - Chronological client–advisor messaging
   - Add comment text box
   - Backend: POST /tickets/:id/comments
4. **Action Bar:**
   - "Close Ticket & Pay" — triggers rating modal + payment release
   - "Dispute Ticket" — escalates to admin

**Close Ticket Modal:**
```
  - Rating: 1–5 stars
  - Review text (optional)
  - "Confirm & Release Payment" CTA
  - Backend: POST /tickets/:id/close
```

---

### 1.3 Client Account Settings

**Profile Settings:**
- Update Full Name
- Update Email
- View Phone Number (read-only; contact support to change)
- Upload Avatar
- Backend: POST /users/upload/avatar, GET /users/me

**Wallet:**
- View current balance (₹)
- "Add Money" CTA → Razorpay payment page
- Transaction history table (date, type, amount, status)

**Contact Unlocks:**
- Remaining credits display
- Purchased packs list (pack name, credits remaining, expiry date)
- Unlock history (advisor name, date, credits used)

---

### 1.4 Client User Test Scenarios

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| U-01 | OTP Registration | Enter valid phone → Receive OTP → Verify → Enter name | Account created, JWT issued, redirected to home |
| U-02 | Duplicate Phone Registration | Enter phone of existing user → OTP → Verify | Existing user logged in (no duplicate account) |
| U-03 | Invalid OTP | Enter wrong OTP | Error: "Invalid OTP. Please try again" |
| U-04 | Expired OTP | Wait 5+ mins → Enter OTP | Error: "OTP has expired" |
| U-05 | Set Password | Post-login → Set password (valid format) | Password saved, can login with phone+password |
| U-06 | Weak Password | Set password without uppercase/digit | Validation error listing requirements |
| U-07 | Browse Advisors | Apply category + state filter | Filtered list of APPROVED advisors only |
| U-08 | Book Consultation | Select slot → choose mode → pay via wallet | Booking created, wallet deducted, advisor notified |
| U-09 | Double Booking Prevention | Try booking same slot twice | Second booking rejected |
| U-10 | Request Fee Quote | Open advisor profile → "Request Quote" → submit | Quote created, advisor receives notification |
| U-11 | Accept Quote & Pay | View submitted quote → Accept → Pay | Escrow ticket created, payment debited |
| U-12 | Confirm Stage | Advisor marks stage AWAITING_CONFIRM → Client confirms | Stage moves to CONFIRMED |
| U-13 | Close Ticket | All stages confirmed → Close ticket + rate | Payment released to advisor, ticket CLOSED |
| U-14 | Buy Credit Pack | Navigate to /buy-pack → Select pack → Pay | Credits added to account |
| U-15 | Unlock Advisor Contact | Use credit → unlock advisor | Contact revealed, credit deducted |

---

## Module 2 — Advisor Management

### 2.1 Overview

Advisors are professional service providers who register, complete KYC, and get verified by admin. Verified advisors appear in the public catalog and can receive bookings, quote requests, and manage service delivery via escrow tickets.

---

### 2.2 Pages & Screens

#### Page: `/advisors/onboarding` — 8-Step Registration Funnel

**Purpose:** Guided multi-step registration for new advisors. Progress is saved at each step (can resume from any step using phone number lookup).

---

##### Step 1: Phone OTP Verification

**Fields:**
| Field | Type | Validation |
|---|---|---|
| Phone Number | Text | 10 digits, prefix 6-9 |
| OTP | 6-digit | 5-min TTL |

**Actions:** "Send OTP" → "Verify OTP"
**Backend:** POST /auth/otp/send, POST /auth/otp/verify

---

##### Step 2: Advisor Type Selection

**Options:**
| Type | Description |
|---|---|
| REGULAR | Standard verified advisor |
| AUTHORIZED | Premium tier; can purchase "Authorized Dealer" badge |

**Backend:** Progress saved via POST /advisors/onboarding-progress

---

##### Step 3: Account Details

**Fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| Full Name | Text | Yes | 2–100 chars |
| Email | Email | Yes | Valid format, unique |
| Password | Password | Yes | 8+ chars, upper + lower + digit |
| Confirm Password | Password | Yes | Must match |
| Business Name | Text | No | Max 100 chars |
| Years of Experience | Number | Yes | 0–99 |
| Consultation Fee (₹) | Decimal | Yes | ≥ 0 |
| Location / City | Text | Yes | — |

---

##### Step 4: Profile Information

**Fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| Bio | Textarea | No | Max 1000 chars |
| State | Dropdown | Yes | Indian states list |
| Circle | Text | No | Admin circle / block |
| Subdivision | Text | No | Revenue subdivision |
| Languages | Multi-select | No | English, Hindi, Regional languages |
| License Number | Text | No | Unique if provided |
| GST Number | Text | No | Valid GST format |

---

##### Step 5: KYC Document Upload

**Documents:**
| Document | Required | Details |
|---|---|---|
| Aadhaar Card | Yes | Upload image + enter 12-digit Aadhaar number |
| Passport Photo | Yes | Used as profile avatar |
| License Copy | No | Professional license (insurance, legal, etc.) |
| GST Certificate | No | If GST-registered |
| Other | No | Additional supporting documents |

**Aadhaar Handling:** Number validated (12 digits, not starting 0 or 1); only last 4 digits shown in UI (hashed in DB for privacy).

---

##### Step 6: Service Categories

**UI:** Multi-select tile grid

**Categories (m1–m28):**
| Module | Category |
|---|---|
| m1 | Life Insurance |
| m2 | Health Insurance |
| m3 | Motor Insurance |
| m4 | Property Insurance |
| m5 | Travel Insurance |
| m6 | Crop Insurance |
| m7 | Marine Insurance |
| m8 | Commercial Insurance |
| m9 | Mutual Funds |
| m10 | Stock / Equity Advisory |
| m11 | Fixed Deposits / Bonds |
| m12 | Real Estate Advisory |
| m13 | Tax Planning & Filing |
| m14 | Legal Advisory |
| m15 | Loan Advisory |
| m16 | Gold & Commodity |
| m17 | NRI Services |
| m18 | Retirement Planning |
| m19 | Business Advisory |
| m20–m28 | Specialization modules (custom text per advisor) |

**Backend:** POST /advisors/categories, POST /advisors/specializations

---

##### Step 7: Availability Configuration

**UI:** Weekly slot builder

**Fields:**
| Field | Type | Validation |
|---|---|---|
| Day of Week | Dropdown | Sunday (0) – Saturday (6) |
| Start Time | Time picker | HH:MM (24h format) |
| End Time | Time picker | HH:MM, must be after start |

**Rules:**
- Multiple slots per day allowed
- Slots must not overlap
- Repeats weekly (recurring schedule)

**Backend:** POST /advisors/availability

---

##### Step 8: Review & Submit

**Shows:** Summary of all entered information across all steps  
**Action:** "Submit for Review" → creates Advisor record with status = PENDING  
**Backend:** POST /auth/advisor/signup (final account creation)

**Post-Submit State:**
- Advisor sees "Application Under Review" status page
- Admin receives notification of new PENDING advisor
- Advisor can track status on dashboard

---

#### Page: `/advisor/dashboard` — Advisor Workspace

**Purpose:** Central hub for all advisor activities.

**Dashboard Sections:**

**Header KPIs:**
- Total Bookings (all time)
- Pending Quote Requests (badge count)
- Active Tickets
- Wallet Balance

**Booking Panel:**
| Column | Content |
|---|---|
| Client Name | Client who booked |
| Date & Time | Scheduled slot |
| Mode | Phone / Video / Chat / Physical |
| Status | PENDING / ACCEPTED / COMPLETED / CANCELLED |
| Action | "Mark Complete" (for ACCEPTED bookings) |

**Quote Requests Panel:**
- List of incoming quote requests from clients
- Each shows: client name, service category, message, timestamp
- "Submit Quote" CTA opens fee breakdown form

**Active Service Tickets:**
- Ticket ID, client name, amount, current status
- "View Ticket" CTA

**Subscription Status (AUTHORIZED type only):**
- Badge status (ACTIVE / EXPIRED / NOT_SUBSCRIBED)
- Expiry date
- "Renew" CTA

---

#### Page: `/advisor/profile` — Profile Edit

**Purpose:** Advisor self-service profile updates.

**Editable Fields (Immediate Update):**
| Field | Validation |
|---|---|
| Bio | Max 1000 chars |
| Business Name | Max 100 chars |
| Location / City | — |
| State | Indian states list |
| Circle | — |
| Subdivision | — |
| Years of Experience | 0–99 |
| Consultation Fee | ≥ 0 |
| Languages | Multi-select |
| Email | Valid email format |
| GST Number | Valid GST format |
| Cover Image | Image upload |
| Avatar / Profile Photo | Image upload |

**Backend:** PATCH /advisors/me/profile, POST /advisors/upload/avatar, POST /advisors/upload/cover

**Sensitive Field Change Requests (Require Admin Approval):**
| Field | Description |
|---|---|
| Phone Number | New phone + OTP verification |
| Aadhaar Number | New Aadhaar number |
| License Number | New license number |
| Full Name | Name change |

**Change Request Flow:**
```
Advisor submits new value → Request created (PENDING)
→ Admin reviews in change requests panel
→ APPROVED: value updated in system
→ REJECTED: advisor notified, can resubmit
```

**Pending Change Requests Panel:** Shows field, new value, status, submitted date.

---

#### Page: `/advisor/services` — Service & Category Management

**Sections:**
1. **Categories:** Re-select active service categories (same multi-select as onboarding Step 6)
2. **Specializations:** Per-category custom text for open modules (m21–m28)
3. **Availability Slots:** Manage weekly recurring slots (add, edit, delete)

---

#### Page: `/advisor/badge` — Authorized Dealer Subscription

**Purpose:** Manage the "Authorized Dealer" premium badge subscription.

**Visible Only To:** AUTHORIZED type advisors

**Page Sections:**
- Current subscription status (ACTIVE / EXPIRED / NOT_SUBSCRIBED)
- Subscription expiry date (if active)
- Pricing: ₹1,999 + GST 18% = **₹2,358.82 / year**
- Benefits list
- "Subscribe Now" / "Renew" CTA

**Purchase Flow:**
```
CTA Click → Create Razorpay Order (POST /subscriptions/create-order)
→ Razorpay Checkout popup
→ User completes payment
→ Verify payment (POST /subscriptions/verify-payment)
→ Subscription activated for 1 year
→ isAuthorizedDealer flag = true on profile
```

---

### 2.3 Advisor Verification Workflow

```
[Advisor Submits] 
      ↓ Status: PENDING
[Super Admin assigns to Sub Admin]
      ↓ Status: UNDER_REVIEW
[Sub Admin reviews KYC documents]
      ↓
  ┌───────────────────────────────────┐
  │  Approve → SUBMITTED_FOR_APPROVAL │
  │  Reject  → REJECTED (with reason) │
  └───────────────────────────────────┘
      ↓ (if submitted)
[Super Admin final review]
      ↓
  ┌────────────────────────────────────┐
  │  Approve → APPROVED (live on site) │
  │  Reject  → REJECTED (with reason)  │
  │  Suspend → SUSPENDED (frozen)      │
  └────────────────────────────────────┘
```

**Advisor Status Definitions:**

| Status | Meaning | Visible in Catalog? |
|---|---|---|
| PENDING | Submitted, awaiting assignment | No |
| UNDER_REVIEW | Assigned to Sub Admin for review | No |
| SUBMITTED_FOR_APPROVAL | Sub Admin approved, awaiting Super Admin | No |
| APPROVED | Fully verified and live | Yes |
| REJECTED | Failed verification (reason given) | No |
| SUSPENDED | Admin-frozen account | No |

---

### 2.4 Quote Workflow (Advisor Perspective)

```
Client sends quote request
      ↓ Status: REQUESTED
Advisor submits fee breakdown
      ↓ Status: QUOTED
Client views quote
      ↓ Status: VIEWED
Client accepts quote + pays
      ↓ Status: ACCEPTED → Escrow Ticket Created
```

**Fee Quote Submission Form:**

| Field | Type | Validation |
|---|---|---|
| Line Items | Repeatable rows | Description (text) + Amount (₹) |
| Advisor Note | Textarea | Optional, max 500 chars |
| Validity Period | Number | 1–168 hours (default: 48) |

**Backend:** POST /quotes/:id/submit

**Proactive Quote:** Advisor can also send unsolicited quotes to clients who have unlocked their contact.  
**Backend:** POST /quotes/proactive

---

### 2.5 Escrow Service Ticket Workflow (Advisor Perspective)

**After quote payment, ticket created at status OPEN.**

**Advisor Actions:**

| Action | Description | Backend |
|---|---|---|
| Add Stage | Create new work milestone | POST /tickets/:id/stages |
| Mark IN_PROGRESS | Start working on stage | PATCH /tickets/:id/stages/:stageId |
| Mark AWAITING_CONFIRM | Ask client to confirm stage | PATCH /tickets/:id/stages/:stageId |
| Add Comment | Communicate with client | POST /tickets/:id/comments |

**Stage Statuses:**

```
PENDING → IN_PROGRESS → AWAITING_CONFIRM → CONFIRMED (by client)
```

**Payout:** When client closes ticket, advisor receives total amount minus 15% platform commission.

---

### 2.6 Advisor Test Scenarios

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| A-01 | Complete Onboarding (8 steps) | Fill all steps → Submit | Advisor account created, status = PENDING |
| A-02 | Resume Onboarding | Start onboarding → Close browser → Reopen with same phone | Progress restored from last saved step |
| A-03 | Duplicate Email | Use email already registered | Validation error: "Email already in use" |
| A-04 | Invalid Aadhaar | Enter 11-digit number or starting with 0 | Validation error |
| A-05 | Skip Optional Step | Leave license / GST blank | Onboarding proceeds; fields null in DB |
| A-06 | Overlapping Slots | Add two slots for same day same time | Error: "Slots overlap" |
| A-07 | Edit Profile (immediate) | Change bio / fee | Changes reflected immediately |
| A-08 | Sensitive Field Change | Request phone number change | Request created (PENDING), pending admin review |
| A-09 | Two Pending Same Field | Submit second change request for same field | Error: "Pending request already exists for this field" |
| A-10 | Submit Fee Quote | Advisor fills line items + note + validity | Quote status → QUOTED, client notified |
| A-11 | Edit Quote Before View | Submit quote → edit before client views | Updated successfully |
| A-12 | Add Work Stage | Open ticket → Add stage with title | Stage created, ticket status → IN_PROGRESS |
| A-13 | Mark Stage Complete | Mark AWAITING_CONFIRM → Client confirms | Stage CONFIRMED, advisor can add next stage |
| A-14 | Subscribe (AUTHORIZED) | Click Subscribe → Complete Razorpay | Badge activated, expiry set to 1 year |
| A-15 | Subscribe (REGULAR type) | Try to subscribe as REGULAR advisor | Button hidden / blocked; error if API called directly |
| A-16 | Proactive Quote | Advisor sends unsolicited quote to connected client | Quote appears in client's quote list |

---

## Module 3 — Admin Management

### 3.1 Overview

The admin module is a two-tier internal management system:
- **Super Admin** — Full platform control, final approval authority
- **Sub Admin** — Handles KYC review queue and support tickets (limited scope)

Both roles log in via `/auth/admin` using email + password.

---

### 3.2 Admin Login Page: `/auth/admin`

**Fields:**
| Field | Type | Validation |
|---|---|---|
| Email | Email | Must match AdminUsers record |
| Password | Password | — |

**Backend:** POST /auth/login/password

**Post-Login:** Role-based redirect:
- Super Admin → Full admin dashboard
- Sub Admin → Restricted queue view

---

### 3.3 Super Admin — All Pages & Functionality

#### Admin Dashboard: `/admin/dashboard`

**KPI Cards:**
| Metric | Description |
|---|---|
| Total Users | All registered clients |
| Total Advisors | All (across all statuses) |
| Approved Advisors | APPROVED status count |
| Pending Review | SUBMITTED_FOR_APPROVAL count |
| Platform Revenue | Gross revenue from all payments |
| Active Subscriptions | Current paid advisor subscriptions |
| Total Bookings | All-time consultation count |

**Charts & Tables:**
- Onboarding funnel drop-off (step 1–8 completion rates)
- Connection trend (advisor unlocks over time)
- Recent audit logs (admin actions table)

---

#### Advisor Management: `/admin/advisors`

**Advisor List Table — Columns:**
| Column | Notes |
|---|---|
| Advisor Name + Photo | |
| Phone | |
| Email | |
| State | |
| Status | Color-coded badge |
| Type | REGULAR / AUTHORIZED |
| Join Date | |
| Categories | |
| Actions | View, Edit, Verify, Suspend |

**Filters:**
| Filter | Options |
|---|---|
| Status | PENDING, UNDER_REVIEW, SUBMITTED_FOR_APPROVAL, APPROVED, REJECTED, SUSPENDED |
| Type | REGULAR, AUTHORIZED |
| State | All Indian states |
| Search | Name, phone, email |
| Join Period | Last 7d, 30d, 90d, All |
| Min Received | Minimum connections received |

**Advisor Detail Panel (Slide-in or modal):**
- All profile fields (read + edit)
- KYC Documents section (each doc: image viewer + "Verified" toggle)
- Change Requests history
- Verification action buttons:
  - "Approve" — sets status APPROVED
  - "Reject" — sets status REJECTED (requires rejection reason text, min 5 chars)
  - "Suspend" — sets status SUSPENDED

**Direct Edit (Super Admin only):**
- Edit any advisor field without change request
- Backend: PATCH /admin/advisors/:id/edit

**Assign Categories:**
- Admin can manually assign/fix service categories
- Backend: PATCH /admin/advisors/:id/categories

**Grant/Revoke Authorized Dealer:**
- Toggle isAuthorizedDealer flag (independent of subscription)
- Backend: POST /admin/advisors/:id/dealer

**Repair Categories:**
- Auto-assigns categories to APPROVED advisors based on specializations
- Backend: POST /admin/repair-categories

---

#### Pending Review Queue: `/admin/advisors/pending`

**For Super Admin:** Shows all SUBMITTED_FOR_APPROVAL advisors (from sub-admin queues)

**Table Columns:**
- Advisor Name + Status
- Sub Admin who submitted
- Date submitted
- Documents verified count
- Action: "Approve" / "Reject"

---

#### Bulk Assign Advisors to Sub Admin

**Feature:** Super Admin can assign multiple PENDING advisors to a sub-admin in one action.

**Flow:**
```
Select advisors (checkboxes) → 
Choose Sub Admin from dropdown → 
"Assign" → 
Advisors status → UNDER_REVIEW, assigned to selected sub-admin
```

**Backend:** POST /admin/advisors/assign-bulk

---

#### User Management: `/admin/users`

**User List Table — Columns:**
| Column | Notes |
|---|---|
| Name | |
| Phone | |
| Email | |
| State | |
| Join Date | |
| Total Connections | Advisors unlocked |
| Active Pack | Current contact pack |

**Filters:**
| Filter | Options |
|---|---|
| State | All Indian states |
| Search | Name, phone, email |
| Join Period | Last 7d, 30d, 90d, All |
| Min/Max Connections | Connection count range |

---

#### Sub Admin Management: `/admin/sub-admins`

**Sub Admin List Table — Columns:**
| Column | Notes |
|---|---|
| Name | |
| Email | |
| Status | ACTIVE / INACTIVE |
| Assigned | Count of advisors assigned |
| Under Review | Count currently reviewing |
| Submitted | Count forwarded to super admin |
| Processed | Total approved/rejected |
| Actions | Edit password, Activate/Deactivate, Delete |

**Create Sub Admin Form:**
| Field | Validation |
|---|---|
| Full Name | 2+ chars |
| Email | Valid, unique |
| Password | 8+ chars, upper + lower + digit |

**Bulk Create:** Upload or fill up to 10 sub-admins at once.

**Reset Password:**
- Enter new password for sub-admin
- Backend: PATCH /admin/sub-admins/:id/password

**Deactivate / Reactivate:**
- Toggle status ACTIVE ↔ INACTIVE
- Deactivated sub-admins cannot log in
- Backend: PATCH /admin/sub-admins/:id/status

**Delete Sub Admin:**
- Removes sub-admin account
- All assigned advisors revert to PENDING status (unassigned)
- Backend: DELETE /admin/sub-admins/:id

---

#### Analytics — Contact Unlocks: `/admin/contact-unlocks`

**Table Columns:**
| Column | Notes |
|---|---|
| Client Name | Who unlocked |
| Advisor Name | Who was unlocked |
| Date | Unlock timestamp |
| Was Free | Boolean (free intro vs. credit used) |
| Pack Used | Which credit pack |

**Filters:** Search (client/advisor name), period, advisor ID, free-only toggle

**Analytics Dashboard:** Trend chart of connections over time; top advisors by connections received; top clients by connections made.

---

#### Contact Pack Subscriptions: `/admin/contact-subscriptions`

**Table:** All credit pack purchases across all clients.

**Columns:**
| Column | Notes |
|---|---|
| Client Name | |
| Pack Name | |
| Credits Total | Purchased amount |
| Credits Used | Consumed |
| Credits Remaining | |
| Purchase Date | |
| Expiry Date | |

---

#### Onboarding Funnel Analytics: `/admin/funnel`

**Purpose:** Identify where advisors drop off during 8-step registration.

**Chart:** Funnel visualization — step 1 to step 8 with completion counts and drop-off %.

**Table:**
| Step | Name | Started | Completed | Drop-off % |
|---|---|---|---|---|
| 1 | Phone OTP | N | N | N% |
| 2 | Advisor Type | N | N | N% |
| 3 | Account Details | N | N | N% |
| 4 | Profile Info | N | N | N% |
| 5 | KYC Documents | N | N | N% |
| 6 | Categories | N | N | N% |
| 7 | Availability | N | N | N% |
| 8 | Review & Submit | N | N | N% |

---

#### Platform Bookings: `/admin/bookings`

**Table:** All bookings on the platform.

**Columns:** Client, Advisor, Date/Time, Mode, Status, Amount, Payment Method

**Filters:** Status (PENDING / ACCEPTED / COMPLETED / CANCELLED)

---

#### Advisor Subscriptions: `/admin/subscriptions`

**Table:** All AUTHORIZED_DEALER subscription records.

**Columns:** Advisor Name, Start Date, Expiry Date, Amount, Status

---

#### Change Requests Queue: `/admin/change-requests`

**Purpose:** Review advisor requests to change sensitive fields.

**Table Columns:**
| Column | Notes |
|---|---|
| Advisor Name | |
| Field Name | phoneNumber / aadhaarNumber / licenseNumber / fullName |
| Current Value | Existing value |
| Requested Value | What they want to change to |
| Status | PENDING / APPROVED / REJECTED |
| Date | Submitted on |
| Action | Approve / Reject |

**Filters:** Status, Field Name

**Approve Action:**
- Applies new value to Advisor record and User record
- Marks request APPROVED

**Reject Action:**
- Marks request REJECTED with optional admin note
- Advisor notified

---

#### Data Export

**Available Exports (XLSX):**
| Entity | Endpoint |
|---|---|
| Advisors | GET /admin/export/advisors |
| Users | GET /admin/export/users |
| Funnel Data | GET /admin/export/funnel |
| Subscriptions | GET /admin/export/subscriptions |
| Bookings | GET /admin/export/bookings |
| Contact Packs | GET /admin/export/contact-subscriptions |

---

### 3.4 Sub Admin — Pages & Functionality

#### Sub Admin Dashboard

**Stats Cards:**
- Assigned advisors (total assigned to this sub-admin)
- Under Review (currently being reviewed)
- Submitted to Super Admin
- Total Processed (approved + rejected)

---

#### Sub Admin Advisor Queue: `/admin/advisors/my-queue`

**Purpose:** Sub Admin sees only advisors assigned to them with status UNDER_REVIEW.

**Actions Per Advisor:**
1. View full profile + KYC documents
2. Toggle "Document Verified" on each KYC document
3. "Submit for Final Approval" → status changes to SUBMITTED_FOR_APPROVAL
4. "Reject" → status changes to REJECTED (rejection reason required)

**Cannot:**
- Directly set status to APPROVED
- View or edit advisors assigned to other sub-admins
- Access analytics or user management

---

#### Sub Admin Support Tickets

**View:** Only tickets assigned to this sub-admin.

**Actions:**
- Update ticket status: OPEN → IN_PROGRESS → RESOLVED → CLOSED
- Add closing notes when status set to CLOSED

---

### 3.5 Admin Audit Logging

All significant admin actions are recorded in AuditLog table:
- Admin ID + role
- Action type (LOGIN, KYC_VERIFY, ADVISOR_APPROVED, ADVISOR_REJECTED, SUB_ADMIN_CREATED, etc.)
- Target entity (advisor ID, user ID, etc.)
- Timestamp
- IP address (if captured)

---

### 3.6 Admin Test Scenarios

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| AD-01 | Super Admin Login | Enter valid credentials at /auth/admin | Logged in, full dashboard visible |
| AD-02 | Sub Admin Login | Enter sub-admin credentials | Logged in, only queue and assigned tickets visible |
| AD-03 | Assign Advisor to Sub Admin | Bulk select PENDING advisors → Assign to sub-admin | Advisors status → UNDER_REVIEW, visible in sub-admin queue |
| AD-04 | Sub Admin Submit for Approval | Sub admin reviews → Submit | Advisor status → SUBMITTED_FOR_APPROVAL, visible in super admin pending queue |
| AD-05 | Super Admin Approve Advisor | Click Approve on submitted advisor | Status → APPROVED, advisor visible in public catalog |
| AD-06 | Reject with Reason | Click Reject → Leave reason blank | Error: "Reason required (min 5 chars)" |
| AD-07 | Reject with Valid Reason | Enter reason → Confirm reject | Status → REJECTED, advisor notified |
| AD-08 | Suspend Advisor | Click Suspend | Status → SUSPENDED, advisor disappears from public catalog |
| AD-09 | Toggle KYC Verified | Check "Verified" on Aadhaar document | Document marked verified in DB |
| AD-10 | Approve Change Request | Review sensitive field change → Approve | New value applied to advisor profile |
| AD-11 | Reject Change Request | Reject change request | Request REJECTED, advisor can resubmit |
| AD-12 | Create Sub Admin | Fill form → Create | Sub admin account created, can login |
| AD-13 | Deactivate Sub Admin | Toggle status → Inactive | Sub admin cannot log in; existing assignments remain |
| AD-14 | Delete Sub Admin | Delete | Sub admin removed, assigned advisors revert to PENDING |
| AD-15 | Reset Sub Admin Password | Enter new password | Password updated |
| AD-16 | Export Advisors | Click Export Advisors | XLSX file downloaded with all advisor data |
| AD-17 | View Funnel Analytics | Navigate to /admin/funnel | Step-by-step completion rates visible |
| AD-18 | Repair Categories | Click Repair Categories | Orphaned advisors auto-assigned categories from specializations |
| AD-19 | Grant Authorized Dealer | Toggle isAuthorizedDealer on REGULAR advisor | Badge granted (admin override, no subscription required) |
| AD-20 | Sub Admin Sees Only Assigned | Login as sub admin → View advisors list | Only UNDER_REVIEW advisors assigned to them visible |

---

## Module 4 — Payment & Subscription System

### 4.1 Overview

BrokerSaab supports multiple payment flows, all processed via Razorpay (primary) with Stripe as secondary. An internal wallet system reduces friction for repeat clients.

**Platform Commission:** 15% of all consultation and escrow payments retained; 85% released to advisor.

---

### 4.2 Payment Gateways

| Gateway | Usage |
|---|---|
| Razorpay | Primary — advisor subscriptions, credit packs, bookings |
| Stripe | Secondary — bookings |
| Internal Wallet | Instant deduction for consultations |

---

### 4.3 Flow 1: Consultation Booking Payment

**Trigger:** Client books consultation with advisor.

```
Client creates booking (status: PENDING)
         ↓
POST /payments/checkout
  {
    bookingId: "...",
    method: "WALLET" | "RAZORPAY" | "STRIPE"
  }
         ↓
IF WALLET:
  Check balance >= advisor fee
  Deduct balance → create DEBIT transaction
  Booking status → ACCEPTED
  Advisor notified via push notification

IF RAZORPAY / STRIPE:
  Create payment order
  Return order ID + client_key to frontend
  Frontend opens payment gateway popup
  On success → verify → booking ACCEPTED

Platform retains 15% commission
Remaining 85% held in escrow until booking COMPLETED
         ↓
Advisor marks booking COMPLETED
         ↓
Net amount credited to advisor's wallet
```

**Cancellation:**
- Either party cancels → full refund to client wallet (instant)
- Transaction marked REFUNDED

---

### 4.4 Flow 2: Quote Payment & Escrow Ticket Creation

**Trigger:** Client accepts advisor's fee quote.

```
Client views accepted quote
         ↓
POST /payments/quote-checkout
  {
    quoteId: "...",
    method: "WALLET" | "RAZORPAY"
  }
         ↓
Payment processed (same as booking flow above)
         ↓
ServiceTicket created with status OPEN
  - escrowAmount = total quote amount
  - 15% commission held
  - 85% escrowed

Advisor notified → begins work
         ↓
Work stages completed + client confirms
         ↓
Client closes ticket + rates advisor
         ↓
POST /tickets/:id/close
  {
    rating: 1-5,
    reviewText: "..."
  }
         ↓
Transaction: net amount credited to advisor's wallet
ServiceTicket status → CLOSED / PAYOUT_RELEASED
```

---

### 4.5 Flow 3: Advisor Subscription — Authorized Badge

**Trigger:** AUTHORIZED type advisor initiates badge subscription.

```
POST /subscriptions/create-order
  → Creates Razorpay order
  → Returns { orderId, amount: 235882 (paise), currency: "INR" }

Frontend opens Razorpay checkout (₹2,358.82)

User pays → Razorpay calls webhook + frontend receives success callback

POST /subscriptions/verify-payment
  {
    orderId: "...",
    paymentId: "...",
    signature: "..."   // Razorpay HMAC signature
  }
  → Validate signature (HMAC-SHA256 of orderId|paymentId)
  → IF valid:
      AdvisorSubscription record created (status: SUCCESS)
      expiresAt = now + 365 days
      Advisor.isAuthorizedDealer = true
      
GET /subscriptions/status
  → Returns { isActive, daysRemaining, expiresAt }
```

**Renewal:** Same flow; creates new subscription record; expiry extended.

**Expiry Handling:** After expiry, badge is removed from public profile. Advisor must renew.

---

### 4.6 Flow 4: Client Contact Pack Purchase

**Trigger:** Client wants to unlock advisor contact details.

```
Client browses packs at /buy-pack

Select pack (e.g., 20 credits / ₹X / 1 year)
         ↓
Initiate Razorpay order
         ↓
Pay → Verify
         ↓
UserContactSubscription created:
  creditsTotal: 20
  creditsUsed: 0
  expiresAt: now + 365 days

Client unlocks advisor:
  Check: has available credits in active pack?
  Deduct 1 credit from pack (creditsUsed++)
  ContactUnlock record created
  Advisor contact info revealed
```

**Free Unlock:** Platform may grant free unlock for first-time connections (isFree = true).

---

### 4.7 Wallet System

**Client Wallet:**
- Created automatically on first OTP login
- Balance starts at ₹0
- Deposited via Razorpay "Add Money" flow
- Debited for bookings and quote payments
- Refunded on cancellations

**Advisor Wallet:**
- Created on account approval
- Credited when bookings marked COMPLETED (85% of fee)
- Credited when tickets CLOSED (85% of quote total)
- Withdrawal: if supported (check implementation)

**Transaction Types:**

| Type | Direction | Trigger |
|---|---|---|
| CREDIT | +Balance | Add money, refund |
| DEBIT | -Balance | Booking payment, contact pack |
| PAYOUT | +Advisor balance | Booking/ticket completion |
| COMMISSION | Platform revenue | Each transaction |

**Transaction Statuses:** SUCCESS / FAILED / REFUNDED / PENDING

---

### 4.8 Payment Test Scenarios

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| P-01 | Wallet Payment - Sufficient Balance | Book consultation → Pay via wallet (balance ≥ fee) | Booking ACCEPTED, wallet debited |
| P-02 | Wallet Payment - Insufficient Balance | Book consultation → Pay via wallet (balance < fee) | Error: "Insufficient wallet balance" |
| P-03 | Add Money to Wallet | /wallet → Add ₹500 → Pay via Razorpay | Wallet balance increases by ₹500 |
| P-04 | Razorpay Payment - Success | Book → Razorpay → Complete payment | Booking ACCEPTED, transaction recorded |
| P-05 | Razorpay Payment - Fail | Book → Razorpay → Cancel/fail | Booking remains PENDING, no deduction |
| P-06 | Quote Payment | Accept quote → Pay | Escrow ticket created, advisor notified |
| P-07 | Ticket Close - Payout | Close ticket with 5-star rating | Advisor wallet credited with 85% of quote amount |
| P-08 | Advisor Subscription - New | AUTHORIZED advisor → Subscribe → Pay | Subscription ACTIVE, badge visible on profile |
| P-09 | Advisor Subscription - Duplicate | AUTHORIZED advisor (already active) → Subscribe again | Error or graceful renewal handling |
| P-10 | REGULAR Advisor - Subscribe Attempt | REGULAR advisor → try subscription endpoint | Error: "Must be AUTHORIZED type" |
| P-11 | Credit Pack Purchase | Select pack → Pay → Credits Added | creditsTotal updated, pack listed in account |
| P-12 | Unlock Advisor Contact | Client with active pack → Unlock advisor | Contact revealed, creditsUsed+1 |
| P-13 | Unlock Without Credits | Client with 0 credits → Try unlock | Error: "No credits available. Please purchase a pack." |
| P-14 | Subscription Expiry Check | Query /subscriptions/status after expiry | isActive = false, daysRemaining = 0 |
| P-15 | Razorpay Signature Verification | Tampered signature in verify-payment call | Error: "Payment verification failed" |
| P-16 | Booking Cancellation Refund | Cancel ACCEPTED booking | Client wallet refunded full amount |

---

## Module 5 — Support & Ticketing System

### 5.1 Client Support Tickets

**Purpose:** Clients and advisors can raise support requests to the platform.

**Create Support Ticket Form:**

| Field | Type | Validation |
|---|---|---|
| Subject | Text | 3–200 chars |
| Description | Textarea | 10–2000 chars |
| Category | Dropdown | GENERAL, BILLING, TECHNICAL, BOOKING_ISSUE, ADVISOR_ISSUE, OTHER |
| Priority | Dropdown | LOW, MEDIUM, HIGH, URGENT |

**Backend:** POST /support/tickets

**Ticket Statuses:**

| Status | Meaning |
|---|---|
| OPEN | Submitted, unassigned |
| IN_PROGRESS | Admin is working on it |
| RESOLVED | Admin has addressed |
| CLOSED | Fully closed (with notes) |

**Client View:** List of own tickets + status badge + "View" CTA  
**Backend:** GET /support/tickets, GET /support/tickets/:id

---

### 5.2 Admin Support Ticket Management

**Super Admin:**
- Sees ALL support tickets from all users
- Assigns tickets to sub-admins: POST /admin/tickets/:id/assign

**Sub Admin:**
- Sees only tickets assigned to them
- Updates status and adds closing notes
- Backend: PATCH /admin/tickets/:id

---

### 5.3 Support Test Scenarios

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| S-01 | Create Support Ticket | Fill form → Submit | Ticket created with status OPEN |
| S-02 | Missing Subject | Submit with blank subject | Validation error |
| S-03 | Short Description | Submit with 5-char description | Error: "Min 10 chars" |
| S-04 | View Own Tickets | Navigate to support section | Only own tickets listed |
| S-05 | Admin Assign Ticket | Super Admin assigns ticket to sub-admin | Sub-admin sees ticket in queue |
| S-06 | Sub Admin Close Ticket | Close with notes | Status → CLOSED, notes saved |
| S-07 | Sub Admin Sees Others' Tickets | Sub admin queries tickets not assigned to them | Not returned in list |

---

## Cross-Cutting Concerns

### Authentication & Authorization

**JWT Token Lifecycle:**
- Access Token: 24-hour validity
- Refresh Token: 30-day validity
- Refresh flow: POST /auth/token/refresh

**Role Enforcement:**
- All protected routes require `Authorization: Bearer <access_token>` header
- Middleware validates JWT and extracts role
- Role-based guards prevent cross-role access (e.g., advisor cannot access admin routes)

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit

---

### Real-Time Features

**Socket.IO Events:**

| Event | Trigger | Recipient |
|---|---|---|
| `ticket:created` | Quote payment successful | Advisor |
| `ticket:stage_updated` | Stage status changed | Client |
| `quote:viewed` | Client opens quote | Advisor |
| `quote:accepted` | Client accepts quote | Advisor |
| `payment:released` | Ticket closed | Advisor |
| `booking:new` | Booking created | Advisor |

**Push Notifications (Expo):**
- New booking received
- New quote request
- Quote accepted by client
- Stage confirmed by client
- Ticket closed + payout released

---

### File Storage & Uploads

**Uploaded File Types:**
| File | Endpoint | Format |
|---|---|---|
| Advisor Avatar | POST /advisors/upload/avatar | Image (JPEG/PNG) |
| Advisor Cover | POST /advisors/upload/cover | Image |
| User Avatar | POST /users/upload/avatar | Image |
| KYC Aadhaar | POST /advisors/documents | Image/PDF |
| KYC Passport Photo | POST /advisors/documents | Image |
| KYC License | POST /advisors/documents | Image/PDF |
| KYC GST Certificate | POST /advisors/documents | Image/PDF |

---

### Data Privacy

- Aadhaar number: last 4 digits shown in UI; full number hashed in database
- Phone numbers: not exposed in public advisor profiles (unlocked via credit system)
- KYC documents: accessible only to the advisor themselves and admin users

---

## API Endpoints Reference

### Authentication

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | /auth/otp/send | Public | Send OTP to phone |
| POST | /auth/otp/verify | Public | Verify OTP |
| POST | /auth/register/complete | Public | Complete client registration |
| POST | /auth/login/phone-password | Public | Client phone + password login |
| POST | /auth/login/password | Public | Admin / Advisor email + password login |
| POST | /auth/password/set | Auth | Set or reset password |
| POST | /auth/advisor/signup | Public | Create advisor account |
| POST | /auth/token/refresh | Public | Refresh access token |

### Users

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /users/me | Client | Get own profile |
| POST | /users/upload/avatar | Client | Upload profile photo |
| POST | /users/push-token | Client | Register push token |

### Advisors

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /advisors | Public | Search / list approved advisors |
| GET | /advisors/:id | Public | Get single advisor profile |
| GET | /advisors/me | Advisor | Get own profile |
| GET | /advisors/me/full | Advisor | Get all editable fields |
| PATCH | /advisors/me/profile | Advisor | Update profile fields |
| POST | /advisors/me/change-requests | Advisor | Submit sensitive field change |
| GET | /advisors/me/change-requests | Advisor | List own change requests |
| POST | /advisors/upload/avatar | Advisor | Upload profile photo |
| POST | /advisors/upload/cover | Advisor | Upload cover image |
| POST | /advisors/categories | Advisor | Set service categories |
| POST | /advisors/specializations | Advisor | Set specializations |
| POST | /advisors/availability | Advisor | Set weekly slots |
| POST | /advisors/documents | Advisor | Upload KYC documents |
| POST | /advisors/onboarding-progress | Public | Save funnel step progress |
| GET | /advisors/onboarding-progress/:phone | Public | Resume funnel progress |

### Bookings

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | /bookings | Client | Create consultation booking |
| GET | /bookings | Client/Advisor | List own bookings |
| GET | /bookings/:id | Client/Advisor | Get booking detail |
| POST | /bookings/:id/status | Advisor | Update booking status |

### Payments

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | /payments/checkout | Client | Pay for booking |
| POST | /payments/quote-checkout | Client | Pay for accepted quote |
| POST | /payments/wallet/add | Client | Add money to wallet |

### Quotes

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | /quotes | Client | Request quote from advisor |
| POST | /quotes/proactive | Advisor | Send proactive quote |
| GET | /quotes | Client/Advisor | List quotes |
| GET | /quotes/:id | Client/Advisor | Get quote detail |
| POST | /quotes/:id/submit | Advisor | Submit fee breakdown |
| POST | /quotes/:id/accept | Client | Accept quote |
| POST | /quotes/:id/cancel | Client/Advisor | Cancel quote |
| POST | /quotes/:id/view | Client | Mark quote viewed |
| GET | /quotes/unread-count | Advisor | Unread quote request count |
| GET | /quotes/connected-clients | Advisor | Clients who unlocked advisor |

### Service Tickets

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /tickets | Client/Advisor | List own tickets |
| GET | /tickets/:id | Client/Advisor | Get ticket detail |
| POST | /tickets/:id/stages | Advisor | Add work stage |
| PATCH | /tickets/:id/stages/:stageId | Advisor | Update stage status |
| POST | /tickets/:id/stages/:stageId/confirm | Client | Confirm stage completion |
| POST | /tickets/:id/comments | Client/Advisor | Add comment |
| POST | /tickets/:id/close | Client | Close ticket + release payment |
| POST | /tickets/:id/dispute | Client | Raise dispute |

### Subscriptions

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | /subscriptions/create-order | Advisor | Create Razorpay order |
| POST | /subscriptions/verify-payment | Advisor | Verify and activate |
| GET | /subscriptions/status | Advisor | Check subscription validity |

### Support

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | /support/tickets | Client/Advisor | Create support ticket |
| GET | /support/tickets | Client/Advisor | List own tickets |
| GET | /support/tickets/:id | Client/Advisor | View ticket detail |

### Admin

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /admin/dashboard | Super Admin | Platform KPIs |
| GET | /admin/advisors | Admin | List advisors (with filters) |
| GET | /admin/advisors/pending | Admin | Pending review queue |
| GET | /admin/advisors/my-queue | Sub Admin | Assigned advisor queue |
| POST | /admin/advisors/:id/verify | Admin | Approve/Reject/Suspend advisor |
| POST | /admin/advisors/:id/dealer | Super Admin | Grant/Revoke dealer badge |
| POST | /admin/advisors/assign-bulk | Super Admin | Bulk assign to sub-admin |
| POST | /admin/advisors/:id/submit-for-approval | Sub Admin | Forward to super admin |
| PATCH | /admin/advisors/:id/documents/:docId | Admin | Toggle document verified |
| PATCH | /admin/advisors/:id/categories | Admin | Fix advisor categories |
| PATCH | /admin/advisors/:id/edit | Super Admin | Direct edit advisor fields |
| GET | /admin/users | Super Admin | List client users |
| GET | /admin/bookings | Super Admin | List all bookings |
| GET | /admin/subscriptions | Super Admin | List advisor subscriptions |
| GET | /admin/contact-unlocks | Super Admin | Contact unlock analytics |
| GET | /admin/contact-subscriptions | Super Admin | Credit pack purchases |
| GET | /admin/analytics/connections | Super Admin | Connection trend data |
| GET | /admin/funnel | Super Admin | Onboarding funnel analytics |
| GET | /admin/sub-admins | Super Admin | List sub-admins |
| POST | /admin/sub-admins | Super Admin | Create sub-admin |
| POST | /admin/sub-admins/bulk | Super Admin | Bulk create sub-admins |
| PATCH | /admin/sub-admins/:id/status | Super Admin | Activate/Deactivate |
| PATCH | /admin/sub-admins/:id/password | Super Admin | Reset password |
| DELETE | /admin/sub-admins/:id | Super Admin | Delete sub-admin |
| GET | /admin/tickets | Admin | List support tickets |
| PATCH | /admin/tickets/:id | Admin | Update ticket status/notes |
| POST | /admin/tickets/:id/assign | Super Admin | Assign ticket to sub-admin |
| GET | /admin/change-requests | Admin | List all change requests |
| PATCH | /admin/change-requests/:id | Admin | Approve/Reject change request |
| GET | /admin/export/:entity | Super Admin | Download XLSX export |

---

## Test Scenarios by Module

### Full End-to-End Test Flows

#### E2E-01: Client Registration → Book Consultation → Pay → Complete

```
1. Navigate to /auth
2. Enter valid phone number → Send OTP
3. Enter OTP → Verify
4. Enter name + email → Create Account
5. Navigate to /advisors → Search by category
6. Open advisor profile → View availability
7. Select slot → Choose mode → Add note
8. Pay via wallet (ensure balance > 0 first)
9. Verify booking status = ACCEPTED
10. Advisor marks COMPLETED
11. Verify advisor wallet credited
```

#### E2E-02: Quote Request → Fee Breakdown → Escrow Ticket → Work Stages → Close

```
1. Client logged in → Open approved advisor profile
2. Click "Request Fee Quote" → Submit with category + message
3. Advisor logs in → View quote request
4. Advisor submits fee breakdown (line items + validity)
5. Client views quote → Accept → Pay
6. Verify ServiceTicket created with status OPEN
7. Advisor adds 2 work stages
8. Advisor marks Stage 1 → AWAITING_CONFIRM
9. Client confirms Stage 1 → CONFIRMED
10. Advisor marks Stage 2 → AWAITING_CONFIRM
11. Client confirms Stage 2 → CONFIRMED
12. Client closes ticket with 5-star rating
13. Verify advisor wallet credited with 85% of quote total
14. Verify ticket status = CLOSED
```

#### E2E-03: Advisor Onboarding → Admin Verification → Catalog Appearance

```
1. Navigate to /advisors/onboarding
2. Complete all 8 steps with valid data
3. Submit → Status = PENDING
4. Super Admin logs in → Assign to Sub Admin
5. Sub Admin reviews KYC → Toggles all docs verified
6. Sub Admin submits for final approval → Status = SUBMITTED_FOR_APPROVAL
7. Super Admin approves → Status = APPROVED
8. Navigate to /advisors → Search by advisor name
9. Verify advisor appears in results with correct categories
```

#### E2E-04: Advisor Badge Subscription

```
1. Advisor logged in (type = AUTHORIZED)
2. Navigate to /advisor/badge
3. Click "Subscribe Now"
4. Complete Razorpay payment (₹2,358.82)
5. Verify subscription status = ACTIVE
6. Check expiry date = today + 365 days
7. Verify "Authorized Dealer" badge visible on public profile
```

---

## Validation Rules Reference

| Field | Rule |
|---|---|
| Phone Number | 10 digits, starts with 6–9 |
| OTP | 6 digits, valid for 5 minutes |
| Email | Standard format; TLDs: .com, .in, .co.in, .net, .org |
| Password | 8+ chars, 1 uppercase, 1 lowercase, 1 digit |
| Aadhaar Number | 12 digits, must not start with 0 or 1 |
| License Number | Unique per advisor (if provided) |
| GST Number | Standard GST format (if provided) |
| Experience Years | Integer, 0–99 |
| Consultation Fee | Non-negative decimal |
| Availability Slot End | Must be after Start |
| Quote Validity | 1–168 hours |
| Ticket Stage Title | 1–200 chars |
| Ticket Stage Description | Optional, max 1000 chars |
| Rating | Integer 1–5 |
| Rejection Reason | Min 5 characters |
| Support Subject | 3–200 chars |
| Support Description | 10–2000 chars |
| Sub Admin Name | 2+ chars |
| Change Request New Value | Validated per field type |

---

## Glossary

| Term | Definition |
|---|---|
| **Advisor** | KYC-verified professional providing advisory services on BrokerSaab |
| **Client** | End user seeking advisory services; registers via OTP |
| **Escrow Ticket** | Work order created after quote payment; funds held until work confirmed |
| **Contact Unlock** | Client uses 1 credit to reveal advisor's contact details |
| **Credit Pack** | Purchased bundle of contact unlock credits |
| **Authorized Dealer** | Premium advisor badge, purchasable via annual subscription |
| **KYC** | Know Your Customer — identity verification documents (Aadhaar, license, photo) |
| **Quote** | Fee breakdown submitted by advisor in response to client request |
| **Work Stage** | Milestone within a service ticket that must be confirmed by client |
| **Sub Admin** | Internal reviewer who handles advisor KYC review queue |
| **Super Admin** | Platform owner with full management authority |
| **Funnel** | 8-step advisor onboarding process; drop-off tracked per step |
| **Change Request** | Advisor's formal request to change sensitive profile fields (requires admin approval) |
| **Commission** | Platform's 15% fee deducted from all transactions |
| **Payout** | 85% of transaction amount released to advisor after service confirmed |
| **Wallet** | Internal balance system for clients (deposits, payments) and advisors (payouts) |
| **OTP** | One-Time Password, sent via SMS for phone-based authentication |
| **JWT** | JSON Web Token, used for session authentication |
| **Razorpay** | Primary payment gateway for INR transactions |
| **Socket.IO** | Real-time communication layer for live event updates |

---

*Document prepared from live BrokerSaab codebase analysis. All API routes, form fields, and business logic described above reflect the current implementation.*

*For questions or clarifications, contact the engineering team.*
