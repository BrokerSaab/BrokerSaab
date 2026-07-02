# UI/UX Specification Document
# BrokerSaab — Web Application

---

**Document Version:** 1.0
**Prepared By:** BrokerSaab Engineering Team
**Date:** June 26, 2026
**Purpose:** Product owner reference — layouts, wireframes, color system, interactions

---

## Table of Contents

1. [Design System](#1-design-system)
2. [Layout Architecture](#2-layout-architecture)
3. [Public Pages](#3-public-pages)
   - Home Page
   - Advisor Catalog
   - Advisor Profile Detail
4. [Client Flows](#4-client-flows)
   - Auth (OTP Login / Registration)
   - Bookings Dashboard
   - Service Ticket Detail
   - Buy Credit Pack
5. [Advisor Flows](#5-advisor-flows)
   - Onboarding Funnel (8 Steps)
   - Advisor Dashboard
   - Profile Edit
   - Authorized Badge Page
6. [Admin Panel](#6-admin-panel)
   - Admin Login
   - Super Admin Dashboard
   - Advisor Review Queue
   - Sub-Admin Management
7. [Shared Components](#7-shared-components)

---

## 1. Design System

### 1.1 Color Palette

```
PRIMARY COLORS
──────────────────────────────────────────────────────────────────────
  ████  Navy-800     #0B1F3A   — Primary backgrounds, dark sections
  ████  Navy-900     #071527   — Deepest dark, hero overlays
  ████  Slate-950    #0a0f1d   — Body background (dark pages)
  ████  Gold-500     #D4AF37   — Primary accent, CTAs, highlights
  ████  Gold-400     #E8C84C   — Lighter gold, hover states

SECONDARY COLORS
──────────────────────────────────────────────────────────────────────
  ████  Indigo-600   #4F46E5   — Auth pages, secondary buttons
  ████  Indigo-500   #6366F1   — Lighter indigo, badges
  ████  Purple-600   #9333EA   — Ticket / work stage accents
  ████  Emerald-500  #10B981   — Success states, verified badges
  ████  Amber-400    #FBBF24   — Authorized dealer badge, warnings

NEUTRAL COLORS
──────────────────────────────────────────────────────────────────────
  ████  White        #FFFFFF   — Cards, light backgrounds
  ████  Gray-50      #F9FAFB   — Input backgrounds, subtle panels
  ████  Gray-100     #F3F4F6   — Card borders, dividers
  ████  Gray-400     #9CA3AF   — Secondary text, placeholders
  ████  Gray-600     #4B5563   — Body text (light backgrounds)
  ████  Gray-900     #111827   — Headings on light backgrounds

STATUS COLORS
──────────────────────────────────────────────────────────────────────
  ████  Red-700      #B91C1C   — Errors, destructive actions
  ████  Emerald-600  #059669   — Success, APPROVED status
  ████  Amber-500    #F59E0B   — Pending, warning states
  ████  Blue-600     #2563EB   — Info states, links
```

### 1.2 Typography

```
FONT FAMILY: Inter (Google Fonts)
Weights: 300 · 400 · 500 · 600 · 700 · 800 · 900

SCALE
──────────────────────────────────────────────────────────────────────
  text-xs      12px    Secondary labels, badges, captions
  text-sm      14px    Body text, form labels, table content
  text-base    16px    Default body text
  text-lg      18px    Card titles, section headings
  text-xl      20px    Page section headings
  text-2xl     24px    Page titles (mobile)
  text-3xl     30px    Page titles (tablet)
  text-4xl     36px    Hero headings (desktop)
  text-7xl     72px    Hero heading (large desktop)

SPECIAL TREATMENTS
──────────────────────────────────────────────────────────────────────
  Gold Gradient Text — linear-gradient(135deg, #FFE082, #D4AF37, #B48C22)
  Selection color    — Gold on Navy background
  Letter spacing     — tracking-widest on uppercase badges/labels
```

### 1.3 Border Radius

```
rounded-lg     8px    — Small buttons, badges
rounded-xl     12px   — Inputs, small cards
rounded-2xl    16px   — Main cards, panels
rounded-3xl    24px   — Auth card, modals
rounded-full         — Avatar, pills, dot indicators
```

### 1.4 Shadows

```
shadow-sm          — Subtle card lift
shadow-lg          — Elevated cards, dropdowns
shadow-xl          — Modals, sticky elements
shadow-2xl         — Hero images, major overlays
shadow-black/40    — Dark backgrounds
```

### 1.5 Animation Reference

```
ANIMATION          DURATION   EASING              EFFECT
──────────────────────────────────────────────────────────────────────
slideDown          300ms      ease-out            opacity + translateY(-10px→0)
fadeInUp           500ms      ease-out            opacity + translateY(20px→0)
slideUp            300ms      cubic-bezier        card entrance from bottom
expandPanel        350ms      ease-out            scale + translateY expansion
subCardIn          300ms      ease-out            translateY staggered
popIn              450ms      cubic-bezier        scale(0.95→1) + translateY
shimmer            2s         linear loop         loading placeholder gradient
offerTicker        22s        linear loop         horizontal scroll, seamless
```

### 1.6 Responsive Breakpoints

```
Mobile         < 640px    sm:  — Single column, compact padding
Tablet         640-1024px lg:  — 2-column grids, wider cards
Desktop        ≥ 1024px   xl:  — 3-column grids, full sidebars
Extra Large    ≥ 1280px        — Max-width containers, mega menus
```

---

## 2. Layout Architecture

### 2.1 Root Layout (All Pages)

```
┌──────────────────────────────────────────────────────────────────────┐
│  NAVBAR  [sticky top-0, z-9999, bg=#050e1b/95, backdrop-blur-md]    │
│  border-b: gold-500/10, shadow-xl shadow-black/40, py-3.5           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   PAGE CONTENT (varies per route)                                    │
│                                                                      │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  FOOTER  [bg=#071222, dark]                                          │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Navigation Bar (Desktop)

```
┌──────────────────────────────────────────────────────────────────────┐
│ bg=#050e1b/95  border-b:gold-500/10  shadow-xl  sticky top-0 z-9999 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ [icon] Broker Saab          Home  About  Services▾  HowItWorks  │
│  │        TRUSTED ADVISORY     Contact        [Register] [Sign In]  │
│  │        PLATFORM                                                   │
│  └──────────────────────────────────────────────────────────────┘   │
│   Logo: "Broker" white + "Saab" gold-500                             │
│   Tagline: 9px · blue-300 · tracking-[0.18em] · uppercase           │
│   Nav links: text-sm · font-medium · tracking-wide                  │
│   Active link: text-gold-400 · bg-gold-500/10 · border · gold pill  │
│   CTA buttons: white/20 border · hover:gold gradient                │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.3 Services Mega-Menu (Dropdown from "Services" nav item)

```
┌────────────────────────────────────────────────────── 1060px wide ──┐
│ bg: gradient(#f2fbf6 → #e6f7ec)  border:emerald-500/25  rounded-3xl │
│ Top accent: 3px gradient bar (emerald → teal → emerald)             │
│                                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  5-column grid      │
│  │ m1   │ │ m2   │ │ m3   │ │ m4   │ │ m5   │                      │
│  │[icon]│ │[icon]│ │[icon]│ │[icon]│ │[icon]│                      │
│  │ Life │ │Health│ │Motor │ │Prop. │ │Travel│  hover: scale(1.11)  │
│  │ Ins. │ │ Ins. │ │ Ins. │ │ Ins. │ │ Ins. │  shadow + border     │
│  │  EN  │ │  EN  │ │  EN  │ │  EN  │ │  EN  │  color shift        │
│  │  HI  │ │  HI  │ │  HI  │ │  HI  │ │  HI  │  #1   #2   #3       │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                      │
│  [... continues for all 28 modules ...]                              │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.4 Navbar (Mobile)

```
┌──────────────────────────────────────┐
│ [≡ Hamburger]  BrokerSaab  [Sign In] │
└──────────────────────────────────────┘
Hamburger opens slide-in drawer (right side)
with all nav links stacked vertically
```

---

## 3. Public Pages

### 3.1 Home Page (`/`)

#### Section A — Offer Ticker (Full-Width, 46px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ bg: purple-gradient(#1e0a3c → #2d0a6e → #4c1d95)                    │
│ border-top/bottom: gold rgba(250,204,21,0.25)  1px                  │
│                                                                      │
│  ← [🚀 LAUNCHING OFFER] ~~₹999~~ ₹99/yr [90% OFF] ··· ~~₹4,999~~  │
│     ₹499/yr [90% OFF for Advisors] · Click to Grab →                │
│                                   [22s seamless scroll animation]   │
└──────────────────────────────────────────────────────────────────────┘
```

#### Section B — Location Bar (Below Ticker)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [📍 Set your location ▾]              Showing advisors in All India │
│   pulsing gold ring if not set         [District ▾] [Clear ×]       │
└──────────────────────────────────────────────────────────────────────┘
```

#### Section C — Hero Section

```
┌──────────────────────────────────────────────────────────────────────┐
│  bg: navy-gradient-bg (radial: #0F2D54 → #050E1B)                   │
│                                                                      │
│  Desktop: 12-column grid (7 left + 5 right)                         │
│  Mobile: Single column, stacked                                      │
│                                                                      │
│  LEFT COLUMN (col-span-7)              RIGHT COLUMN (col-span-5)    │
│  ─────────────────────────────         ─────────────────────────    │
│                                                                      │
│  Find your                              ┌──────────────────────┐    │
│  Agents           ← text-7xl            │   [Image Carousel]   │    │
│  (Agents = gold gradient)               │   aspect: 1:1        │    │
│                                         │   rounded-2xl        │    │
│  [subtitle text in gold gradient]       │   border:gold-500/20 │    │
│                                         │                      │    │
│  ┌────────────────────────────────┐     │   [Slide Info Card   │    │
│  │ 🔍 Search advisors...      [→] │     │    bottom-left        │    │
│  └────────────────────────────────┘     │    navy-900/90 bg    │    │
│     border:gold-500/40                  │    gold border ]     │    │
│     search icon: gold 15px             │                      │    │
│     submit button: bg-[#0C4EAA]        │  ● ○ ○ ○  [dots]     │    │
│                                         │  [🔵🟢🌹🟡 avatar]  │    │
│  ┌─────────────────────────────────┐    └──────────────────────┘    │
│  │ Popular: [Registry] [Bainama]   │                                 │
│  │ [Sale Deed] [GST Filing]        │                                 │
│  │ [DL Renewal] [Aadhaar] [ITR]    │                                 │
│  └─────────────────────────────────┘                                 │
│   pills: border-white/5, bg-[#112240]/55, text-slate-300            │
└──────────────────────────────────────────────────────────────────────┘
```

#### Section D — Services Grid (Light bg-white)

```
┌──────────────────────────────────────────────────────────────────────┐
│  bg-white                                                            │
│                        ┌───────────┐                                 │
│                        │ SERVICES  │  ← gold-600 badge, 11px        │
│                        └───────────┘                                 │
│           Professional Service Categories                            │
│           [subtitle in gray-500]                                     │
│                                                                      │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │
│  │ [icon]  #1│ │ [icon]  #2│ │ [icon]  #3│ │ [icon]  #4│  4-col   │
│  │ Life Ins. │ │ Health    │ │ Motor Ins.│ │ Property  │  on lg    │
│  │ ─────────│ │ Insurance │ │           │ │ Insurance │           │
│  │ desc text │ │           │ │           │ │           │           │
│  │ Explore → │ │ Explore → │ │ Explore → │ │ Explore → │           │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘           │
│  border: 2px (per category color)                                    │
│  hover: shadow + translate-y[-1.5px] + scale[1.01]                  │
│  selected: ring-2 ring-gold-500/30                                   │
│                                                                      │
│  [When tile expanded ▼ — full-width panel below the tile row]       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Top 3px gradient bar (category accent color)                  │   │
│  │ [🔒 icon] Category Name                Count [✕ Close]       │   │
│  │                                                               │   │
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐  3-col submodule grid   │   │
│  │ │[icon] #1│ │[icon] #2│ │[icon] #3│                          │   │
│  │ │ Title   │ │ Title   │ │ Title   │                          │   │
│  │ │ Hindi   │ │ Hindi   │ │ Hindi   │                          │   │
│  │ │[keyword]│ │[keyword]│ │[keyword]│                          │   │
│  │ │Find →   │ │Find →   │ │Find →   │                          │   │
│  │ └─────────┘ └─────────┘ └─────────┘                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

#### Section E — Advisor Cards (White bg)

```
┌──────────────────────────────────────────────────────────────────────┐
│  "Verified Professionals (42)"     [✓ Escrow Protected]             │
│  Filters: [Life Insurance ×] [Clear all]                            │
│                                                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │
│  │ ★ AUTHORIZED    │ │                 │ │                 │  3-col │
│  │ DEALER   amber  │ │ [Life Ins.]badge│ │ [Life Ins.]badge│  grid  │
│  │─────────────────│ │─────────────────│ │─────────────────│       │
│  │ [avatar 48px]   │ │ [avatar 48px]   │ │ [avatar 48px]   │       │
│  │ Ravi Kumar ✓    │ │ Priya Sharma ✓  │ │ Amit Verma ✓    │       │
│  │ Kumar Advisors  │ │                 │ │ AV Consulting   │       │
│  │                 │ │                 │ │                 │       │
│  │ ★ 4.8 (23)      │ │ ★ 4.5 (11)      │ │ ★ 4.2 (5)       │       │
│  │ 12yr · Lucknow  │ │ 8yr · Delhi     │ │ 5yr · Mumbai    │       │
│  │ EN · HI · TA    │ │ EN · HI         │ │ EN              │       │
│  │─────────────────│ │─────────────────│ │─────────────────│       │
│  │ Fee  ₹500/sess  │ │ Fee  ₹300/sess  │ │ Fee  ₹400/sess  │       │
│  │ [View Profile→] │ │ [View Profile→] │ │ [View Profile→] │       │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘       │
│  Card border: gray-200 (normal) · amber-300 (authorized dealer)     │
│  Button: gradient gold bg, navy-800 text, ArrowRight icon           │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Advisor Catalog Page (`/advisors`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  STICKY HEADER  [white, border-b gray-200, shadow-sm, top-0 z-30]   │
│  ← Back    [🔍] Advisors (42 found)                                 │
├──────────────────────────────────────────────────────────────────────┤
│  bg-gray-50  max-w-7xl mx-auto  px-4  py-6                          │
│                                                                      │
│  SEARCH + FILTER BAR                                                 │
│  ┌──────────────────────────────────────────┐ ┌──────────────────┐  │
│  │ 🔍 Search by name, location...      [✕] │ │ All States    ▾  │  │
│  └──────────────────────────────────────────┘ └──────────────────┘  │
│  focus: border-yellow-400, ring-2 ring-yellow-400/20                │
│                                                                      │
│  ADVISOR GRID (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)           │
│                                                                      │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌───────────────┐ │
│  │ ★ AUTHORIZED DEALER │ │                     │ │               │ │
│  │ amber bg, border-b  │ │  [Life Ins.] badge  │ │               │ │
│  │─────────────────────│ │                     │ │               │ │
│  │[avatar]  Name ✓     │ │ [avatar]  Name ✓    │ │               │ │
│  │          Business   │ │                     │ │               │ │
│  │                     │ │                     │ │               │ │
│  │ ★ 4.8   Exp: 12yr   │ │ ★ 4.2   Exp: 8yr   │ │               │ │
│  │ 📍 Lucknow, UP      │ │ 📍 Delhi            │ │               │ │
│  │ Languages: EN, HI   │ │                     │ │               │ │
│  │─────────────────────│ │─────────────────────│ │               │ │
│  │ Fee  ₹500/session   │ │ Fee  ₹300/session   │ │               │ │
│  │      [View Profile→]│ │      [View Profile→]│ │               │ │
│  └─────────────────────┘ └─────────────────────┘ └───────────────┘ │
│                                                                      │
│  EMPTY STATE:                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         [👤 UserCheck icon, gray-300, 48px]                  │   │
│  │         No advisors found for your search                    │   │
│  │         [Reset Filters]                                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  LOADING STATE: 6 skeleton cards (animate-pulse, gray-200 bg)       │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Advisor Profile Detail (`/advisors/[id]`)

#### Hero Header

```
┌──────────────────────────────────────────────────────────────────────┐
│  DARK HERO HEADER                                                    │
│  bg: cover-image + overlay gradient(black/60 → black/50 → black/80) │
│  OR: dark gradient fallback                                          │
│                                                                      │
│  ← Back                                                              │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ ★ AUTHORIZED DEALER — BadgeCheck amber · Verified since date │    │
│  │ amber-500/10 bg · amber-500/30 border · rounded-2xl         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  [avatar 80-96px]  Ravi Kumar                   ┌───────────────┐  │
│  rounded-2xl        ✓ ShieldCheck                │Consultation   │  │
│                     ★ AUTHORIZED DEALER badge    │Fee            │  │
│                     Kumar Advisory Services      │               │  │
│                                                  │   ₹500        │  │
│                     ★ 4.8 (23 reviews)           │   /session    │  │
│                     🏆 12 years exp              └───────────────┘  │
│                     📍 Lucknow                    (desktop only)    │
│                     [Life Ins.] [Health] [Motor] [Property] badges  │
│                     indigo-500/20 bg · indigo-200 text              │
│                                                                      │
│          ╭────────────────────────── curved transition ─────────╮   │
└──────────────────────────────────────────────────────────────────────┘
```

#### Main Content Grid (lg: 2/3 left + 1/3 right sidebar)

```
┌─────────────────────────────────────┬────────────────────────────┐
│  LEFT COLUMN (lg:col-span-2)        │  RIGHT SIDEBAR             │
│                                     │  (sticky top-24)           │
│  ┌─────────────────────────────┐    │  ┌──────────────────────┐  │
│  │ [🔵icon] ABOUT              │    │  │ CONSULTATION FEE     │  │
│  │─────────────────────────────│    │  │ bg:indigo→purple grad│  │
│  │ Bio text (sm gray-600)      │    │  │ px-5 py-4  rounded-t │  │
│  │                             │    │  │──────────────────────│  │
│  │ Experience  Languages  Lic. │    │  │ [white body p-5]     │  │
│  │ 3-col meta grid             │    │  │                      │  │
│  └─────────────────────────────┘    │  │ Contact Advisor:     │  │
│                                     │  │ ┌──────────────────┐ │  │
│  ┌─────────────────────────────┐    │  │ │ [Not revealed]   │ │  │
│  │ [🔵icon] SERVICES           │    │  │ │ [Eye] Connect    │ │  │
│  │─────────────────────────────│    │  │ │ gradient indigo  │ │  │
│  │ [Life Ins.] [Health] ...    │    │  │ │ or FREE 🎁       │ │  │
│  │ pills: blue-50, blue-700    │    │  │ └──────────────────┘ │  │
│  │                             │    │  │ ──────────────────── │  │
│  │ Specializations:            │    │  │                      │  │
│  │ [text cards gray-50 bg]     │    │  │ Request Fee Quote:   │  │
│  └─────────────────────────────┘    │  │ [📄 Request Quote]   │  │
│                                     │  │ indigo-50, FileText  │  │
│  ┌─────────────────────────────┐    │  │ ──────────────────── │  │
│  │ [🗓icon] AVAILABILITY       │    │  │                      │  │
│  │─────────────────────────────│    │  │ Book Consultation:   │  │
│  │ 2–3 col slot grid           │    │  │ Slot picker          │  │
│  │ ┌────────┐ ┌────────┐       │    │  │ Payment method       │  │
│  │ │ MON    │ │ WED    │       │    │  │ [Book Now] button    │  │
│  │ │[green] │ │[green] │       │    │  │ gold gradient        │  │
│  │ │10–11am │ │ 2–4pm  │       │    │  └──────────────────────┘  │
│  │ └────────┘ └────────┘       │    │                            │
│  └─────────────────────────────┘    └────────────────────────────┘
│                                                                      │
│  ┌─────────────────────────────┐                                    │
│  │ [★ icon] REVIEWS            │                                    │
│  │─────────────────────────────│                                    │
│  │ ┌────────────────────────┐  │                                    │
│  │ │ Ankit M.    Jun 2026   │  │                                    │
│  │ │ ★★★★★                  │  │                                    │
│  │ │ "Great advisor, very   │  │                                    │
│  │ │  knowledgeable..."     │  │                                    │
│  │ └────────────────────────┘  │                                    │
│  └─────────────────────────────┘                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. Client Flows

### 4.1 Auth Page (`/auth`)

#### Container

```
┌──────────────────────────────────────────────────────────────────────┐
│  FULL SCREEN                                                         │
│  bg: gradient(navy-900 → indigo-950 → navy-900)                     │
│  Ambient glows: gold radial (opacity-[0.08]) + indigo radial        │
│                                                                      │
│         ┌─────────────────────────────────────────┐                 │
│         │ CARD  max-w-md  rounded-3xl  95dvh       │                 │
│         │ border: 1px rgba(212,175,55,0.25)        │                 │
│         │ shadow: 0 25px 60px rgba(0,0,0,0.4)      │                 │
│         │ overflow: flex flex-col                  │                 │
│         │                                          │                 │
│         │ ┌──────────────────────────────────────┐ │                 │
│         │ │ HEADER  px-6 py-5  shrink-0          │ │                 │
│         │ │ bg: linear-gradient(navy→indigo)      │ │                 │
│         │ │                          [← Back]    │ │                 │
│         │ │ [■] Broker Saab                       │ │                 │
│         │ │ Title (lg white bold)                 │ │                 │
│         │ │ Subtitle (xs white/50)                │ │                 │
│         │ └──────────────────────────────────────┘ │                 │
│         │                                          │                 │
│         │ ┌──────────────────────────────────────┐ │                 │
│         │ │ BODY  p-6 sm:p-7  flex-1  min-h-0   │ │                 │
│         │ │ overflow-y-auto  [step content here] │ │                 │
│         │ └──────────────────────────────────────┘ │                 │
│         │                                          │                 │
│         │ ┌──────────────────────────────────────┐ │                 │
│         │ │ FOOTER  shrink-0                     │ │                 │
│         │ │ bg: gradient(navy→indigo)             │ │                 │
│         │ │ border-top: gold-500/12               │ │                 │
│         │ │ T&C text (10px white/30) · link       │ │                 │
│         │ └──────────────────────────────────────┘ │                 │
│         └─────────────────────────────────────────┘                 │
│                                                                      │
│   [🔒 256-bit encrypted]  [🛡 Escrow protected]  (11px white/30)    │
└──────────────────────────────────────────────────────────────────────┘
```

#### Step 1 — Phone Number

```
┌─────────────────────────────────────────────────────────────────────┐
│  Phone Number                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ +91  │  Enter 10-digit mobile number              [📞]     │    │
│  └────────────────────────────────────────────────────────────┘    │
│  border-2 gray-200 · focus-within: border-gold-500 + ring-gold/20  │
│  +91 prefix: gray-50 bg · gray-500 text · border-r                  │
│  icon: Phone 18px gray-400                                          │
│                                                                      │
│  ☐  I agree to the Terms & Conditions                              │
│     (custom checkbox, gold on checked)                              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Send OTP                                      │    │
│  └────────────────────────────────────────────────────────────┘    │
│  disabled until: 10-digit + T&C checked                             │
│                                                                      │
│  ─────────────────── or ────────────────────                        │
│                                                                      │
│  [Login as Admin / Advisor]  (secondary text button)               │
└─────────────────────────────────────────────────────────────────────┘
```

#### Step 2 — OTP Verification

```
┌─────────────────────────────────────────────────────────────────────┐
│  [DEV: OTP is 123456]  (gold bg · 11px mono font · dev only)       │
│                                                                      │
│  Enter 6-digit OTP                                                  │
│                                                                      │
│  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐                         │
│  │ 1 │  │ 2 │  │ 3 │  │ 4 │  │ 5 │  │ 6 │   6 individual inputs  │
│  └───┘  └───┘  └───┘  └───┘  └───┘  └───┘                         │
│  border-2 gray-200 · focus: border-gold-500 + ring                 │
│  text-lg bold gray-900 · rounded-xl                                 │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Verify OTP                                    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ← Change Phone Number                                              │
│  Resend OTP in 0:45  (countdown, then becomes Resend link)          │
└─────────────────────────────────────────────────────────────────────┘
```

#### Step 3a — New User Registration

```
┌─────────────────────────────────────────────────────────────────────┐
│  Full Name *                                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ [👤]  Enter your full name                                 │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Email Address (optional)                                           │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ [✉]  Enter your email                                      │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Complete Registration                         │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

#### Step 4 (Optional) — Set Password

```
┌─────────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 🔒 Set a password to login faster next time               │    │
│  │    (blue-50 bg · blue-200 border)                         │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  New Password *                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ [🔒]  ••••••••••                              [👁 show]   │    │
│  └────────────────────────────────────────────────────────────┘    │
│  ✓ 8+ characters   ✓ Uppercase   ✓ Lowercase   ✓ Number           │
│  (green badges when requirement met)                                │
│                                                                      │
│  Confirm Password *                                                 │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ [🔒]  ••••••••••                              [👁 show]   │    │
│  └────────────────────────────────────────────────────────────┘    │
│  ✓ Passwords match (green) / ✗ Passwords don't match (red)         │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         Set Password  (gradient navy → indigo, gold text) │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Skip for now →                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Step 5 — Success

```
┌─────────────────────────────────────────────────────────────────────┐
│                   ┌────────────────────┐                           │
│                   │ [✓ emerald circle] │                           │
│                   └────────────────────┘                           │
│                                                                      │
│              Welcome to BrokerSaab!                                │
│              Your account has been created                          │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         Browse Advisors  (gradient gold)                   │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 4.2 Bookings Dashboard (`/bookings`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  STICKY HEADER  [white, border-b, shadow-sm]                        │
│  ← [🏠] My Dashboard                      [Find Advisors] [Support] │
│         Ravi Kumar                                      [↺ Refresh] │
├──────────────────────────────────────────────────────────────────────┤
│  bg-[#F4F6FB]  max-w-5xl  mx-auto  px-4  py-5                      │
│                                                                      │
│  Hello, Ravi                                                        │
│  Thursday, June 26, 2026                                            │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ [💳] 8 Credits Remaining · Pack expires Aug 2026  [Top Up →]│   │
│  │  gold/orange styling based on remaining count               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 🔔 You have 3 new Fee Quotes — Review Now →               │    │
│  │ bg: indigo gradient · animated bell icon                   │    │
│  └────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 🎫 2 Work Tickets need your confirmation →                 │    │
│  │ bg: purple gradient · animated ticket icon                 │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  SUMMARY TILES  (grid-cols-1 sm:grid-cols-2)                       │
│  ┌───────────────────────┐  ┌───────────────────────┐              │
│  │  border-l-4:indigo    │  │  [💬] Fee Quotes       │              │
│  │  [📅] Bookings        │  │  ──────────────────    │              │
│  │  ───────────────────  │  │  5 total               │              │
│  │  2 total              │  │  [3 NEW] badge         │              │
│  │  [⚠ 1 PENDING] badge  │  │                        │              │
│  │                       │  │  [Review Quotes →]     │              │
│  │  Latest: Ravi Sharma  │  └───────────────────────┘              │
│  │  Jun 28 · Video       │  ┌───────────────────────┐              │
│  └───────────────────────┘  │  [🎫] Service Tickets  │              │
│  ┌───────────────────────┐  │  ──────────────────    │              │
│  │  [👥] Connected       │  │  3 active              │              │
│  │  Advisors             │  │  [2 ACTION] purple     │              │
│  │  ───────────────────  │  │                        │              │
│  │  12 unlocked          │  │  [View Tickets →]      │              │
│  │                       │  └───────────────────────┘              │
│  │  [View All →]         │                                          │
│  └───────────────────────┘                                          │
│                                                                      │
│  BOOKING CARDS  (grid 1 md:2 lg:3)                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │ Priya Sharma         │  │ Amit Verma            │                │
│  │ 📍 Delhi             │  │ 📍 Mumbai             │                │
│  │                      │  │                       │                │
│  │ Jun 28, 2026 · 10am  │  │ Jun 30, 2026 · 2pm   │                │
│  │ 🎥 VIDEO             │  │ 📞 PHONE              │                │
│  │ [PENDING] amber badge│  │ [ACCEPTED] green badge│                │
│  │                      │  │                       │                │
│  │ ₹300                 │  │ ₹400                  │                │
│  │ [Accept] [Reject]    │  │ [Cancel] [Details]    │                │
│  └──────────────────────┘  └──────────────────────┘                │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 4.3 Service Ticket Detail (`/tickets/[id]`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  HEADER (white, sticky)                                              │
│  ← Back    [🎫] Ticket #TKT-001                   [OPEN] badge      │
│            Ravi Kumar · ₹5,000 escrowed                             │
├──────────────────────────────────────────────────────────────────────┤
│  bg-gray-50  max-w-4xl  mx-auto  px-4  py-6                        │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ WORK STAGES                                                    │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │                                                               │  │
│  │  Stage 1  [CONFIRMED ✓]  emerald bg/border                   │  │
│  │  ┌───────────────────────────────────────────────────────┐   │  │
│  │  │ 📋 KYC Document Review                               │   │  │
│  │  │ Review all submitted KYC documents and verify...     │   │  │
│  │  │                              ✓ Confirmed by you       │   │  │
│  │  └───────────────────────────────────────────────────────┘   │  │
│  │                                                               │  │
│  │  Stage 2  [AWAITING_CONFIRM]  amber bg/border                │  │
│  │  ┌───────────────────────────────────────────────────────┐   │  │
│  │  │ 📋 Application Filing                                 │   │  │
│  │  │ File the insurance application with all documents...  │   │  │
│  │  │                                                        │   │  │
│  │  │  ┌────────────────────────────────────────────────┐   │   │  │
│  │  │  │  ✓ Confirm Stage Completion  (emerald button)  │   │   │  │
│  │  │  └────────────────────────────────────────────────┘   │   │  │
│  │  └───────────────────────────────────────────────────────┘   │  │
│  │                                                               │  │
│  │  Stage 3  [PENDING]  gray bg/border                          │  │
│  │  ┌───────────────────────────────────────────────────────┐   │  │
│  │  │ 📋 Policy Issuance Verification                      │   │  │
│  │  │ Not started yet                                       │   │  │
│  │  └───────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ COMMENTS                                                       │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │  [avatar] Ravi Kumar (Advisor)         Jun 25 · 10:30am      │  │
│  │           Documents received. Starting stage 1.              │  │
│  │                                                               │  │
│  │  [avatar] You (Client)                 Jun 25 · 11:00am      │  │
│  │           Great, please proceed.                             │  │
│  │                                                               │  │
│  │  ┌────────────────────────────────────────────┐ [Send →]     │  │
│  │  │ Add a comment...                           │              │  │
│  │  └────────────────────────────────────────────┘              │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ACTION BAR (bottom, sticky on mobile)                              │
│  ┌──────────────────────┐  ┌────────────────────────────────────┐  │
│  │ ⚠ Dispute Ticket    │  │ ✓ Close Ticket & Release Payment → │  │
│  │ red-50, red border   │  │   gold gradient, navy-800 text     │  │
│  └──────────────────────┘  └────────────────────────────────────┘  │
│                                                                      │
│  CLOSE TICKET MODAL (overlay)                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Rate your experience with Ravi Kumar                          │  │
│  │                                                               │  │
│  │  ★ ★ ★ ★ ★  (1–5 star selector)                             │  │
│  │                                                               │  │
│  │  ┌───────────────────────────────────────────────────────┐   │  │
│  │  │ Write a review (optional)...                          │   │  │
│  │  └───────────────────────────────────────────────────────┘   │  │
│  │                                                               │  │
│  │  ₹5,000 will be released to advisor (₹4,250 net after fee)  │  │
│  │                                                               │  │
│  │  ┌───────────────────────────────────────────────────────┐   │  │
│  │  │      Confirm & Release Payment  (emerald gradient)    │   │  │
│  │  └───────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 4.4 Buy Credit Pack (`/buy-pack`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Back    [💳] Buy Contact Credits                                 │
├──────────────────────────────────────────────────────────────────────┤
│  bg-gray-50  max-w-3xl  mx-auto  px-4  py-8                        │
│                                                                      │
│  Unlock advisor contacts and grow your network                      │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │  STARTER PACK   │  │ POPULAR PACK ★  │  │  PREMIUM PACK   │    │
│  │  5 Credits      │  │  20 Credits     │  │  50 Credits     │    │
│  │  ─────────────  │  │  ─────────────  │  │  ─────────────  │    │
│  │  ₹99            │  │  ₹299           │  │  ₹599           │    │
│  │  Valid: 1 year  │  │  Valid: 1 year  │  │  Valid: 1 year  │    │
│  │                 │  │  ring-2 gold    │  │                 │    │
│  │  [Buy Now]      │  │  [Buy Now] ←   │  │  [Buy Now]      │    │
│  │  gray outline   │  │  gold gradient │  │  gray outline   │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                      │
│  What are credits?                                                  │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ ✓ 1 credit = unlock 1 advisor's contact details            │    │
│  │ ✓ Credits valid for 1 year from purchase                   │    │
│  │ ✓ Unused credits carry forward within validity             │    │
│  └────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. Advisor Flows

### 5.1 Advisor Onboarding (`/advisors/onboarding`)

#### Container

```
┌──────────────────────────────────────────────────────────────────────┐
│  bg: gradient(navy-800 → indigo-950)  min-h-screen                  │
│  max-w-3xl  mx-auto  px-4  py-8                                     │
│                                                                      │
│  PROGRESS BAR                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ●━━━●━━━●━━━○━━━○━━━○━━━○━━━○                                │   │
│  │ Verify Type  Acct  Prof  KYC  Svc  Avail Review              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  active step: gold circle · completed: emerald · upcoming: gray/40  │
│                                                                      │
│  FORM CARD (white, rounded-2xl, shadow-lg, p-6 sm:p-7)             │
│  border: 1px rgba(212,175,55,0.15)                                  │
│                                                                      │
│    [Step content — see below]                                        │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         Continue  (gradient gold button)                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

#### Step 1 — Phone OTP (same UI as Client Auth, see Section 4.1)

#### Step 2 — Advisor Type

```
┌─────────────────────────────────────────────────────────────────────┐
│  Choose Your Advisor Type                                           │
│                                                                      │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐    │
│  │  REGULAR ADVISOR         │  │  AUTHORIZED ADVISOR          │    │
│  │  [👤 User icon]          │  │  [✓ BadgeCheck icon]         │    │
│  │                          │  │                              │    │
│  │  Standard verified       │  │  Premium tier with           │    │
│  │  professional profile    │  │  Authorized Dealer badge     │    │
│  │                          │  │                              │    │
│  │  Free registration       │  │  ₹1,999/year badge fee       │    │
│  │                          │  │  (paid in final step)        │    │
│  │  [Select Regular]        │  │  [Select Authorized]         │    │
│  │  white/gold outline btn  │  │  gold gradient button        │    │
│  └──────────────────────────┘  └──────────────────────────────┘    │
│  selected card: ring-2 ring-gold-500 bg-gold-500/5                 │
└─────────────────────────────────────────────────────────────────────┘
```

#### Step 3 — Account Details

```
┌─────────────────────────────────────────────────────────────────────┐
│  Account Details                                                    │
│                                                                      │
│  Email Address *              Password *                            │
│  ┌────────────────────────┐  ┌─────────────────────────────────┐   │
│  │ [✉] email@example.com  │  │ [🔒] ••••••••••     [👁 show]   │   │
│  └────────────────────────┘  └─────────────────────────────────┘   │
│                               ✓ 8+ chars  ✓ Upper  ✓ Lower  ✓ No.  │
│                                                                      │
│  Confirm Password *                                                 │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ [🔒] ••••••••••                              [👁 show]     │    │
│  └────────────────────────────────────────────────────────────┘    │
│  ✓ Passwords match                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

#### Step 4 — Profile Information

```
┌─────────────────────────────────────────────────────────────────────┐
│  Profile Information                                                │
│                                                                      │
│  Full Name *                  Business Name (optional)              │
│  ┌────────────────────────┐  ┌────────────────────────────────┐    │
│  │ [👤] Full name          │  │ [🏢] Business name             │    │
│  └────────────────────────┘  └────────────────────────────────┘    │
│                                                                      │
│  Experience (years) *         Consultation Fee (₹) *                │
│  ┌────────────────────────┐  ┌────────────────────────────────┐    │
│  │ [🏆] Years             │  │ [₹] Amount per session         │    │
│  └────────────────────────┘  └────────────────────────────────┘    │
│                                                                      │
│  State *                      City / Location *                     │
│  ┌────────────────────────┐  ┌────────────────────────────────┐    │
│  │ Select State       ▾   │  │ [📍] Your city                 │    │
│  └────────────────────────┘  └────────────────────────────────┘    │
│                                                                      │
│  Languages  (multi-select with add button)                          │
│  [English ×] [Hindi ×] [Add Language ▾]                            │
│                                                                      │
│  Bio (50–500 characters)                                            │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Describe your expertise and experience...                  │    │
│  │                                                            │    │
│  │                                                   127/500 │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  GST Number (optional)                                              │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ [📄] GST registration number                               │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

#### Step 5 — KYC Documents

```
┌─────────────────────────────────────────────────────────────────────┐
│  KYC Documents                                                      │
│                                                                      │
│  Identity Proof Type *                                              │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Aadhaar Card                                           ▾   │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Aadhaar Number *                                                   │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ XXXX XXXX XXXX  (12 digits, •••• displayed after entry)   │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐   │
│  │ IDENTITY DOCUMENT *          │  │ PASSPORT PHOTO *          │   │
│  │ ┌──────────────────────────┐ │  │ ┌──────────────────────┐ │   │
│  │ │ Drag & drop or           │ │  │ │ Drag & drop or       │ │   │
│  │ │ [Browse Files]           │ │  │ │ [Browse Files]       │ │   │
│  │ │ JPG, PNG, PDF < 5MB      │ │  │ │ JPG, PNG < 2MB       │ │   │
│  │ └──────────────────────────┘ │  │ └──────────────────────┘ │   │
│  │ ✓ aadhaar_front.jpg  [✕]    │  │ ✓ photo.jpg  [✕]         │   │
│  └──────────────────────────────┘  └──────────────────────────┘   │
│                                                                      │
│  License Copy (if applicable)          GST Certificate (optional)   │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐   │
│  │ [Upload license copy]        │  │ [Upload GST cert]        │   │
│  └──────────────────────────────┘  └──────────────────────────┘   │
│                                                                      │
│  ☑ I consent to Aadhaar verification as per UIDAI guidelines       │
└─────────────────────────────────────────────────────────────────────┘
```

#### Step 6 — Service Categories

```
┌─────────────────────────────────────────────────────────────────────┐
│  Select Your Service Categories  (min. 1 required)                 │
│                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐  │
│  │ ☑ [icon]    │ │ ☐ [icon]    │ │ ☑ [icon]    │ │ ☐ [icon] │  │
│  │ Life Ins.   │ │ Health Ins. │ │ Motor Ins.  │ │ Property │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘  │
│  [... continues 28 total tiles ...]                                 │
│  selected: ring-2 ring-gold-500 bg-gold-500/5 ✓ badge             │
│  unselected: border-gray-200 hover:border-gray-300                  │
│                                                                      │
│  2 categories selected                                              │
└─────────────────────────────────────────────────────────────────────┘
```

#### Step 7 — Availability Slots

```
┌─────────────────────────────────────────────────────────────────────┐
│  Configure Your Weekly Availability                                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Day          Start Time       End Time        [Remove ×]    │  │
│  │  ┌─────────┐  ┌────────────┐  ┌────────────┐               │  │
│  │  │ Monday▾ │  │ 10:00      │  │ 12:00      │               │  │
│  │  └─────────┘  └────────────┘  └────────────┘               │  │
│  │                                                              │  │
│  │  ┌─────────┐  ┌────────────┐  ┌────────────┐               │  │
│  │  │Wednes.▾ │  │ 14:00      │  │ 17:00      │               │  │
│  │  └─────────┘  └────────────┘  └────────────┘               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  [+ Add Another Slot]  (dashed border, gold text)                  │
│                                                                      │
│  Error: Slots on the same day must not overlap.                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Step 8 — Review & Submit

```
┌─────────────────────────────────────────────────────────────────────┐
│  Review Your Information                                            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Personal Details                                             │  │
│  │ Name: Ravi Kumar · Email: ravi@example.com                  │  │
│  │ Phone: 98XXXXXXXX · Type: AUTHORIZED                        │  │
│  │                                               [Edit Step 3] │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ Profile                                                      │  │
│  │ Experience: 12 years · Fee: ₹500 · State: UP · City: Lucknow│  │
│  │ Languages: EN, HI                                            │  │
│  │                                               [Edit Step 4] │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ KYC Documents                                               │  │
│  │ ✓ Aadhaar · ✓ Passport Photo · ✓ License                  │  │
│  │                                               [Edit Step 5] │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ Categories: Life Insurance, Motor Insurance, Tax Planning   │  │
│  │                                               [Edit Step 6] │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ Availability: Mon 10–12, Wed 14–17                          │  │
│  │                                               [Edit Step 7] │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ☑ I agree to the Terms & Conditions and Privacy Policy            │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         Submit Application  (gold gradient)                │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

#### Step 9 (AUTHORIZED only) — Payment

```
┌─────────────────────────────────────────────────────────────────────┐
│  Activate Your Authorized Dealer Badge                              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ✓ BadgeCheck  Authorized Advisor Badge          1 year sub   │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ Base Price                                   ₹1,999.00      │  │
│  │ CGST (9%)                                      ₹179.91      │  │
│  │ SGST (9%)                                      ₹179.91      │  │
│  │ ────────────────────────────────────────────────────────── │  │
│  │ TOTAL                                        ₹2,358.82      │  │
│  │                                              (gold, bold)   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Pay ₹2,358.82 via Razorpay  (gold gradient, shadow)       │    │
│  └────────────────────────────────────────────────────────────┘    │
│  [🔒 Secured by Razorpay]  [UPI]  [Cards]  (trust logos)          │
│                                                                      │
│  [Test Payment — Dev Only]  (small gray button)                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 5.2 Advisor Dashboard (`/advisor/dashboard`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  STICKY HEADER  [white, border-b]                                   │
│  ← [🏠] Dashboard                      [Find Advisors] [Support]   │
│         Ravi Kumar (Advisor)                            [↺ Refresh] │
├──────────────────────────────────────────────────────────────────────┤
│  bg-[#F4F6FB]  max-w-5xl  mx-auto  px-4  py-5                      │
│                                                                      │
│  Hello, Ravi                                                        │
│  Thursday, June 26, 2026                                            │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 🔔 3 new Fee Quote Requests — Review Now →  (indigo grad) │    │
│  └────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 🎫 2 Work Stages awaiting client confirmation (purple)    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  SUMMARY TILES (grid-cols-1 sm:grid-cols-2)                        │
│  ┌────────────────────────┐  ┌────────────────────────────────┐    │
│  │  border-l-4:indigo-500 │  │  [💬] Fee Quotes               │    │
│  │  [📅] Bookings         │  │  ─────────────────────────     │    │
│  │  ──────────────────    │  │  8 total · [3 NEW] urgent      │    │
│  │  5 total               │  │                                │    │
│  │  [⚠ 1 PENDING]         │  │  [Review Quote Requests →]    │    │
│  │                        │  └────────────────────────────────┘    │
│  │  Latest: Priya S.      │  ┌────────────────────────────────┐    │
│  │  Jun 28 · Video ₹300   │  │  [🎫] Service Tickets          │    │
│  └────────────────────────┘  │  ─────────────────────────     │    │
│  ┌────────────────────────┐  │  4 active                      │    │
│  │  [👥] Connected Clients│  │  [2 AWAITING] purple badge     │    │
│  │  ──────────────────    │  │                                │    │
│  │  18 clients unlocked   │  │  [View Tickets →]              │    │
│  │                        │  └────────────────────────────────┘    │
│  │  [View Connected →]    │                                        │
│  └────────────────────────┘                                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 5.3 Advisor Profile Edit (`/advisor/profile`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  bg: gradient(navy → indigo)  min-h-screen                          │
│  max-w-2xl  mx-auto  px-4  py-8                                     │
│                                                                      │
│  ← Back (white/40)                                                  │
│  Edit Profile  (white, font-black)                                  │
│  Manage your advisor profile                                        │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ COVER + AVATAR CARD  (white, rounded-2xl, overflow-hidden)   │   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │  COVER (h-44)                                          │   │   │
│  │ │  [gradient bg or uploaded image]                       │   │   │
│  │ │  hover: dark overlay + [📷 Change Cover]               │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  │                                                               │   │
│  │  [avatar 80px, absolute -top-10 left-5]                      │   │
│  │  rounded-2xl, border-2 white                                 │   │
│  │  hover: [📷] overlay badge bottom-right                      │   │
│  │  Name (lg, black)  · Business name (gray-400)               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ PROFILE DETAILS  (white, rounded-2xl, p-4)                   │   │
│  │ [✏ Edit3]  Profile Information              [✏ Edit]         │   │
│  │ ─────────────────────────────────────────────────────────── │   │
│  │                                                               │   │
│  │  Full Name *                  Bio                            │   │
│  │  ┌────────────────────────┐  ┌────────────────────────────┐  │   │
│  │  │ Ravi Kumar             │  │ 12 years experience...     │  │   │
│  │  └────────────────────────┘  └────────────────────────────┘  │   │
│  │                               450/500                        │   │
│  │  Experience    Fee (₹)        State           City           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │ 12       │  │ 500      │  │ UP     ▾ │  │ Lucknow  │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │   │
│  │                                                               │   │
│  │  Languages: [EN ×] [HI ×] [+ Add]                           │   │
│  │                                                               │   │
│  │  ┌──────────────────┐  ┌──────────────────────────────────┐ │   │
│  │  │ Save Changes     │  │ Cancel                           │ │   │
│  │  │ (gold gradient)  │  │ (gray outline)                   │ │   │
│  │  └──────────────────┘  └──────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ SENSITIVE FIELDS (Change Requests)                           │   │
│  │ [⚠] Changes to these fields require admin approval           │   │
│  │                                                               │   │
│  │  Phone Number      [PENDING] · requested Jun 20             │   │
│  │  Full Name         [APPROVED] · applied Jun 15              │   │
│  │                                                               │   │
│  │  [+ Request New Change]  (gold outline button)              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ KYC DOCUMENTS                                                │   │
│  │ ┌─────────────────────┐  ┌─────────────────────┐            │   │
│  │ │ Aadhaar Card        │  │ Passport Photo       │            │   │
│  │ │ [✓ Uploaded]        │  │ [✓ Verified] emerald │            │   │
│  │ │ [Update →]          │  │ [Update →]           │            │   │
│  │ └─────────────────────┘  └─────────────────────┘            │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 5.4 Authorized Badge Page (`/advisor/badge`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  STICKY HEADER [dark, gold border-b]                                │
│  ← Back  [✓ BadgeCheck]  Authorized Advisor Badge                   │
├──────────────────────────────────────────────────────────────────────┤
│  bg: gradient(navy → indigo)  min-h-screen                          │
│  max-w-2xl  mx-auto  px-4  py-8                                     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ MAIN CARD  (rounded-3xl, gold border)                        │   │
│  │                                                               │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │ GOLD HEADER  (gradient gold bg)  py-8                  │  │   │
│  │  │              ┌──────────────┐                          │  │   │
│  │  │              │  ✓ BadgeCheck│  (gold glow icon)        │  │   │
│  │  │              └──────────────┘                          │  │   │
│  │  │         AUTHORIZED DEALER BADGE                        │  │   │
│  │  │              ₹1,999 / year                             │  │   │
│  │  │         +18% GST  ·  Auto-renew optional               │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  │                                                               │   │
│  │  BENEFITS  (dark bg, px-6 py-5)                             │   │
│  │  ┌──────────────────────────┐  ┌──────────────────────────┐ │   │
│  │  │ ✓ Authorized Badge       │  │ ✓ Priority Listing       │ │   │
│  │  │ ✓ More Client Trust      │  │ ✓ Verified Profile       │ │   │
│  │  │ ✓ Exclusive Features     │  │ ✓ Better Conversions     │ │   │
│  │  └──────────────────────────┘  └──────────────────────────┘ │   │
│  │                                                               │   │
│  │  PRICE BREAKDOWN TABLE                                       │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │ Base Price                             ₹1,999.00       │ │   │
│  │  │ CGST (9%)                                ₹179.91       │ │   │
│  │  │ SGST (9%)                                ₹179.91       │ │   │
│  │  │ ─────────────────────────────────────────────────────  │ │   │
│  │  │ TOTAL                                  ₹2,358.82       │ │   │
│  │  │                                        (gold, bold)    │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  │                                                               │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │     Pay ₹2,358.82 via Razorpay  (gold gradient)        │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  │  [🔒 Secured by Razorpay]  [Visa] [Mastercard] [UPI]       │ │   │
│  │                                                               │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │ ✅ 100% Refund Guarantee                               │ │   │
│  │  │ Full refund within 48 hours if not satisfied           │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ACTIVE STATE (when badge is live):                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ✓ BadgeCheck (amber-400)                                     │   │
│  │ Badge Active — 285 days remaining                            │   │
│  │ Expires: June 26, 2027                    [↺ Check Status]  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 6. Admin Panel

### 6.1 Admin Login (`/auth/admin`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Same card structure as Client Auth — max-w-md, navy/indigo bg]    │
│                                                                      │
│  SCREEN 1 — Role Selection:                                         │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐    │
│  │  ADMIN LOGIN             │  │  ADVISOR LOGIN               │    │
│  │  [🛡 ShieldCheck]        │  │  [👤 User icon]              │    │
│  │  navy bg, gold border    │  │  gold gradient bg            │    │
│  │  "Platform Administration│  │  "Advisor Dashboard"         │    │
│  └──────────────────────────┘  └──────────────────────────────┘    │
│                                                                      │
│  SCREEN 2 — Admin Login Form:                                       │
│  Email Address *                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ [✉] admin@brokersaab.com                                   │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Password *                                                         │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ [🔒] ••••••••••                              [👁 show]     │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │        Sign In  (navy gradient + gold text)                │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ DEV HINT: admin@brokersaab.com / admin123                  │    │
│  │ (navy-50 bg, small text)                                   │    │
│  └────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 6.2 Super Admin Dashboard (`/admin/dashboard`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  STICKY HEADER  [white, border-b]                                   │
│  [🛡] BrokerSaab Admin          Super Admin · Last login: Jun 26   │
│       Platform Control Panel                        [↺] [Sign Out] │
│                                                                      │
│  LEFT SIDEBAR (hidden mobile, lg:block, w-60)                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Dashboard          [active: indigo bg, indigo-700 text]      │  │
│  │ Advisors           [inactive: gray-600, hover:bg-gray-100]   │  │
│  │ Pending Review                                               │  │
│  │ Users                                                        │  │
│  │ Sub-Admins                                                   │  │
│  │ Bookings                                                     │  │
│  │ Subscriptions                                                │  │
│  │ Contact Unlocks                                              │  │
│  │ Funnel Analytics                                             │  │
│  │ Change Requests                                              │  │
│  │ ─────────────────                                           │  │
│  │ Export Data  ▾                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  MAIN CONTENT (ml-60 on desktop)                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ KPI CARDS  (grid-cols-2 lg:grid-cols-4)                      │  │
│  │                                                               │  │
│  │ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │  │
│  │ │ [👤]       │ │ [✓]        │ │ [⏳]       │ │ [₹]        │ │  │
│  │ │ Total Users│ │ Approved   │ │ Pending    │ │ Revenue    │ │  │
│  │ │ 1,284      │ │ Advisors   │ │ Review     │ │ ₹4,82,500  │ │  │
│  │ │ ↑ 12% week │ │ 347        │ │ 23         │ │ ↑ 8% month │ │  │
│  │ └────────────┘ └────────────┘ └────────────┘ └────────────┘ │  │
│  │ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │  │
│  │ │ [🎫]       │ │ [🏅]       │ │ [📋]       │ │ [🔗]       │ │  │
│  │ │ Total Book.│ │ Active Sub.│ │ Sup Tickets│ │ Connections│ │  │
│  │ │ 842        │ │ 89         │ │ 14 open    │ │ 3,219      │ │  │
│  │ └────────────┘ └────────────┘ └────────────┘ └────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────┐  ┌────────────────────────────┐ │
│  │  ONBOARDING FUNNEL            │  │  RECENT AUDIT LOGS         │ │
│  │  ─────────────────────────── │  │  ────────────────────────  │ │
│  │  Step 1  ████████████  100%   │  │  Admin  APPROVE  Ravi K.   │ │
│  │  Step 2  ████████████   94%   │  │  Jun 26 · 10:32am          │ │
│  │  Step 3  ████████       78%   │  │                            │ │
│  │  Step 4  ██████         62%   │  │  SubAdmin1  SUBMIT  Priya  │ │
│  │  Step 5  █████          48%   │  │  Jun 26 · 09:15am          │ │
│  │  Step 6  ████           41%   │  │                            │ │
│  │  Step 7  ███            35%   │  │  SubAdmin2  REJECT  Amit   │ │
│  │  Step 8  ██             29%   │  │  Jun 25 · 04:44pm          │ │
│  └───────────────────────────────┘  └────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 6.3 Advisor Review Queue (`/admin/advisors` + detail panel)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [🛡 sidebar]  Advisors                                              │
│                                                                      │
│  FILTER BAR                                                          │
│  ┌────────────────────┐ ┌──────────────┐ ┌────────────┐ ┌────────┐ │
│  │ 🔍 Search advisors │ │ All Status ▾ │ │ All Type ▾ │ │ State▾ │ │
│  └────────────────────┘ └──────────────┘ └────────────┘ └────────┘ │
│  ┌──────────────┐ ┌──────────────────────────────────────────────┐  │
│  │ Join Period▾ │ │             [Export XLSX]                    │  │
│  └──────────────┘ └──────────────────────────────────────────────┘  │
│                                                                      │
│  ADVISOR TABLE                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ☐  Avatar  Name / Phone       Status          Type    Actions  │ │
│  │ ─────────────────────────────────────────────────────────────  │ │
│  │ ☐  [img]   Ravi Kumar         [APPROVED] grn  AUTH    [⋯ More] │ │
│  │             9876543210        Joined Jun 1     RGLR            │ │
│  │ ─────────────────────────────────────────────────────────────  │ │
│  │ ☐  [img]   Priya Sharma       [PENDING] amber  RGLR   [⋯ More] │ │
│  │             9876540001        Joined Jun 20                    │ │
│  │ ─────────────────────────────────────────────────────────────  │ │
│  │ ☐  [img]   Amit Verma         [UNDER_REVIEW]   AUTH   [⋯ More] │ │
│  │             9876540002        Assigned to: Raj                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  Bulk actions when rows selected:                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  3 selected  [Assign to Sub-Admin ▾]  [Assign]                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ADVISOR DETAIL DRAWER (slide-in right panel, ~40% width)          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ [✕ Close]  Ravi Kumar                       [⋯ More]        │   │
│  │ ───────────────────────────────────────────────────────── │   │
│  │ [avatar 64px]  Ravi Kumar                                   │   │
│  │                 ravi@example.com · 9876543210               │   │
│  │                 Lucknow, Uttar Pradesh                      │   │
│  │                 AUTHORIZED · PENDING                        │   │
│  │                                                             │   │
│  │ KYC DOCUMENTS                                               │   │
│  │ ┌────────────────────────────────────────────────────────┐ │   │
│  │ │ Aadhaar Card      [View ↗] [☑ Verified]               │ │   │
│  │ │ Passport Photo    [View ↗] [☑ Verified]               │ │   │
│  │ │ License Copy      [View ↗] [☐ Not Verified]           │ │   │
│  │ └────────────────────────────────────────────────────────┘ │   │
│  │                                                             │   │
│  │ VERIFICATION ACTIONS                                        │   │
│  │ ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐  │   │
│  │ │ ✓ Approve   │  │ ✗ Reject    │  │ ⊘ Suspend         │  │   │
│  │ │ emerald btn │  │ red btn     │  │ amber btn         │  │   │
│  │ └─────────────┘  └─────────────┘  └───────────────────┘  │   │
│  │                                                             │   │
│  │ [Rejection Reason required — min 5 chars]                   │   │
│  │ ┌────────────────────────────────────────────────────────┐ │   │
│  │ │ Reason for rejection...                                │ │   │
│  │ └────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 6.4 Sub-Admin Management (`/admin/sub-admins`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [🛡 sidebar]  Sub-Admins                    [+ Create Sub-Admin]   │
│                                                                      │
│  SUB-ADMIN TABLE                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Name / Email    Status    Assigned  Reviewing  Submitted  Done │ │
│  │ ────────────────────────────────────────────────────────────── │ │
│  │ Raj Verma       [ACTIVE]  12        5          3          28   │ │
│  │ raj@co.com      green                                           │ │
│  │                           [Reset Pwd] [Deactivate] [Delete]   │ │
│  │ ────────────────────────────────────────────────────────────── │ │
│  │ Sunita M.       [INACTIVE] 0        0          0          14   │ │
│  │ sunita@co.com   gray                                            │ │
│  │                           [Reset Pwd] [Activate] [Delete]     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  CREATE SUB-ADMIN MODAL                                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Create New Sub-Admin                                   [✕]    │ │
│  │ ────────────────────────────────────────────────────────────── │ │
│  │  Full Name *          Email *                                  │ │
│  │  ┌──────────────────┐ ┌──────────────────────────────────────┐ │ │
│  │  │ Full name        │ │ email@brokersaab.com                 │ │ │
│  │  └──────────────────┘ └──────────────────────────────────────┘ │ │
│  │  Password *                                                    │ │
│  │  ┌────────────────────────────────────────────────────────┐   │ │
│  │  │ ••••••••••                                 [👁 show]   │   │ │
│  │  └────────────────────────────────────────────────────────┘   │ │
│  │                                                                │ │
│  │  ┌────────────────────────────────────────────────────────┐   │ │
│  │  │              Create Sub-Admin  (gold gradient)          │   │ │
│  │  └────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

#### Sub-Admin View (Restricted Dashboard)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [🛡] BrokerSaab Admin         Raj Verma · Sub Admin                │
│       Review Queue                                    [Sign Out]    │
│                                                                      │
│  MY WORK STATS  (grid-cols-2 sm:grid-cols-4)                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ Assigned   │  │ Reviewing  │  │ Submitted  │  │ Processed  │   │
│  │ 12         │  │ 5          │  │ 3          │  │ 28         │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
│                                                                      │
│  MY REVIEW QUEUE  (advisors with status UNDER_REVIEW assigned to me)│
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Avatar  Name           Status          Docs Verified  Actions  │ │
│  │ ─────────────────────────────────────────────────────────────  │ │
│  │ [img]   Priya Sharma   UNDER_REVIEW    2/3           [Review] │ │
│  │ [img]   Amit Verma     UNDER_REVIEW    1/3           [Review] │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  [Review] opens same Advisor Detail Drawer as super admin           │
│  But with only:                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ✓ Toggle document verified checkboxes                          │ │
│  │ [Submit for Final Approval] (indigo button)                    │ │
│  │ [Reject] (red button, requires reason)                         │ │
│  │ (No "Approve" button — can only submit to super admin)         │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  MY SUPPORT TICKETS  (assigned to this sub-admin)                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ #ST-001  Billing Issue  [OPEN]     Priya K.   Jun 24  [Update]│ │
│  │ #ST-002  Login Problem  [IN_PROG]  Rahul M.   Jun 23  [Update]│ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 7. Shared Components

### 7.1 Status Badge Reference

```
STATUS BADGES (rounded-full, px-2.5 py-0.5, text-xs font-semibold)
─────────────────────────────────────────────────────────────────────
[PENDING]                 bg-amber-100    text-amber-800
[UNDER_REVIEW]            bg-blue-100     text-blue-800
[SUBMITTED_FOR_APPROVAL]  bg-purple-100   text-purple-800
[APPROVED]                bg-emerald-100  text-emerald-800
[REJECTED]                bg-red-100      text-red-800
[SUSPENDED]               bg-gray-100     text-gray-800
[ACTIVE]                  bg-emerald-100  text-emerald-800
[INACTIVE]                bg-gray-100     text-gray-600
[OPEN]                    bg-blue-100     text-blue-700
[IN_PROGRESS]             bg-indigo-100   text-indigo-700
[AWAITING_CONFIRM]        bg-amber-100    text-amber-700
[CONFIRMED]               bg-emerald-100  text-emerald-700
[CLOSED]                  bg-gray-100     text-gray-700
[DISPUTED]                bg-red-100      text-red-700
```

### 7.2 Button Styles

```
PRIMARY (Gold CTA)
  bg: linear-gradient(gold-400 → gold-600)
  text: navy-900
  font: semibold
  rounded-xl
  shadow: shadow-md shadow-gold-500/30
  hover: brightness-110
  active: scale-0.98
  disabled: opacity-50 cursor-not-allowed

SECONDARY (Indigo)
  bg: linear-gradient(indigo-600 → purple-600)
  text: white
  same sizing as gold

OUTLINE (Gold Border)
  bg: transparent
  border: 1px gold-500
  text: gold-500
  hover: bg-gold-500/10

DANGER (Red)
  bg: red-50
  border: red-200
  text: red-700
  hover: bg-red-100

GHOST (Subtle)
  bg: gray-100
  text: gray-600
  hover: bg-gray-200
```

### 7.3 Form Input Styles

```
INPUT WRAPPER
  display: flex
  border: 2px solid gray-200
  border-radius: rounded-xl
  overflow: hidden
  transition: border-color 200ms

FOCUS STATE (focus-within):
  border-color: gold-500
  ring: 2px ring-gold-500/20
  box-shadow: 0 0 0 4px rgba(212,175,55,0.15)

ERROR STATE:
  border-color: red-500
  ring: 2px ring-red-500/20
  icon: red-500

ICON PREFIX:
  position: absolute left-3
  color: gray-400
  size: 16–18px

LABEL:
  font-size: text-sm
  font-weight: font-semibold
  color: gray-700
  margin-bottom: mb-1.5

HELPER TEXT:
  font-size: text-xs
  color: gray-500
  margin-top: mt-1

ERROR MESSAGE:
  font-size: text-xs
  color: red-600
  margin-top: mt-1
```

### 7.4 Card Variants

```
LIGHT CARD (default on white pages)
  bg: white
  border: 1px solid gray-100
  border-radius: rounded-2xl
  padding: p-5 sm:p-6
  shadow: shadow-sm
  hover: shadow-md, translate-y(-1px)

GLASS CARD (on dark navy backgrounds)
  bg: rgba(navy-900, 0.85)
  border: 1px solid rgba(gold-500, 0.15)
  border-radius: rounded-2xl
  backdrop-filter: blur-md

ELEVATED CARD (modals, sidebars)
  bg: white
  border-radius: rounded-2xl or rounded-3xl
  shadow: shadow-xl shadow-black/20
  border: 1px solid gray-200
```

### 7.5 Loading / Empty States

```
LOADING SKELETON:
  bg: animate-pulse
  Elements: gray-200 rounded blocks
  shimmer: gradient slide animation 2s loop

EMPTY STATE:
  ┌─────────────────────────────────────┐
  │          [Icon 48px, gray-300]      │
  │      No [entity] found              │
  │  Try adjusting your search filters  │
  │        [Reset Filters]              │
  └─────────────────────────────────────┘
  icon: gray-300
  title: gray-500, text-sm font-medium
  action: gold outline button

ERROR STATE:
  ┌─────────────────────────────────────┐
  │    ⚠ Something went wrong           │
  │    [Error message text]             │
  │       [Try Again]                   │
  └─────────────────────────────────────┘
  bg: red-50
  border: red-200
  icon: AlertCircle red-500
```

### 7.6 Modal / Drawer Pattern

```
MODAL (centered overlay)
  Overlay: bg-black/50, backdrop-blur-sm
  Card: white, max-w-md sm:max-w-lg, rounded-3xl
  Header: gradient bg (navy or gold) with icon + title + [✕]
  Body: p-6, scrollable
  Footer: sticky, border-top, action buttons

SLIDE-IN DRAWER (from right)
  Width: ~40% on desktop, full-width on mobile
  Overlay: bg-black/30 on left
  Panel: white, shadow-2xl, h-screen
  Header: fixed top, border-b
  Body: overflow-y-auto, p-5
  Transition: translate-x animation, 300ms ease-out
```

---

*Document prepared from live BrokerSaab frontend code analysis.*
*Colors, labels, spacing values, and component descriptions reflect the actual implementation.*
*All ASCII wireframes represent the desktop layout unless labeled as mobile.*
