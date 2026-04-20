# Chapter 4: Implementation

## 4.1 Introduction

This chapter presents the technical implementation of the **Outbreak Disaster Management System**, detailing the system architecture, technologies employed, database design, core modules, and the key implementation decisions made throughout the development process. The system is built as a modern full-stack web application consisting of two primary components: an **Online Mode** (a Next.js-based web application) and an **Offline Edge Mode** (a standalone HTML application designed for use during network outages).

---

## 4.2 Technology Stack

The following technologies and frameworks were selected to build the Outbreak system, each chosen for its suitability to the requirements of a real-time disaster management platform.

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | Next.js | 16.1.6 | Server-side rendering, routing, server actions |
| **UI Library** | React | 19.2.3 | Component-based user interface development |
| **Language** | TypeScript | 5.x | Type-safe JavaScript for robust development |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework for rapid UI development |
| **Animation** | Framer Motion | 12.34.3 | Declarative animations and page transitions |
| **Icons** | Lucide React | 0.575.0 | Scalable vector icon library |
| **Backend-as-a-Service** | Supabase | 2.99.0 | Authentication, PostgreSQL database, and real-time APIs |
| **SSR Authentication** | @supabase/ssr | 0.9.0 | Server-side rendering integration for Supabase Auth |
| **Offline Mode** | Vanilla HTML/CSS/JS | — | Zero-dependency offline operation |

### 4.2.1 Justification of Technology Choices

**Next.js 16** was selected as the primary framework due to its support for server-side rendering (SSR), server actions, and file-based routing, which are critical for a disaster management application requiring fast initial page loads and SEO capabilities. The App Router architecture enables a clean separation of route groups for different user roles.

**Supabase** was chosen as the Backend-as-a-Service (BaaS) provider because it offers a managed PostgreSQL database with built-in authentication, Row Level Security (RLS), and real-time capabilities without requiring a dedicated backend server. This significantly reduced development time while maintaining enterprise-grade security.

**Tailwind CSS 4** was used for styling to ensure rapid, consistent, and responsive UI development across all pages and components. A custom theme was defined in `globals.css` using Tailwind's `@theme` directive to maintain a cohesive design language throughout the application.

**Framer Motion** was integrated for smooth UI animations and transitions, enhancing the user experience with visual feedback for modal openings, toast notifications, page transitions, and interactive elements.

---

## 4.3 System Architecture

The Outbreak system follows a **client-server architecture** with a clear separation between the frontend, backend services, and the database layer. The architecture is designed around three distinct user interfaces served by a shared backend.

### 4.3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │   Citizen     │ │  Authority   │ │   AI Dashboard   │ │
│  │  Dashboard    │ │  Dashboard   │ │   (Analysis)     │ │
│  │  (Public)     │ │ (Protected)  │ │  (Protected)     │ │
│  └──────┬───────┘ └──────┬───────┘ └───────┬──────────┘ │
│         │                │                  │            │
│         ▼                ▼                  ▼            │
│  ┌─────────────────────────────────────────────────┐     │
│  │         Next.js App Router (SSR + CSR)           │     │
│  │     Server Actions  |  Middleware (RBAC)         │     │
│  └──────────────────────┬──────────────────────────┘     │
└─────────────────────────┼───────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │     Supabase BaaS     │
              │  ┌─────────────────┐  │
              │  │  Auth Service   │  │
              │  │  (JWT Tokens)   │  │
              │  └────────┬────────┘  │
              │  ┌────────▼────────┐  │
              │  │   PostgreSQL    │  │
              │  │   Database     │  │
              │  │ (RLS Enabled)  │  │
              │  └────────────────┘  │
              └───────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                 OFFLINE EDGE MODE                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Standalone HTML/CSS/JS Application               │  │
│  │  • Mesh Network Communication (Simulated)         │  │
│  │  • SOS Broadcast with GPS Location                │  │
│  │  • JSON Sync Bundle Generation                    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 4.3.2 Application Routing Structure

The application uses Next.js **Route Groups** (denoted by parentheses in folder names) to organize the codebase by user role without affecting the URL structure. The routing is structured as follows:

| Route Group | URL Path | Access Level | Description |
|---|---|---|---|
| `(citizen)` | `/` | Public | Citizen-facing dashboard and features |
| `(citizen)` | `/map/situation` | Public | Interactive situation map |
| `(citizen)` | `/incidents` | Public | Incident reports listing |
| `(citizen)` | `/news` | Public | News and hazard feed |
| `(citizen)` | `/briefing` | Public | Downloadable situation briefing |
| `(citizen)` | `/people-needs` | Public | Community needs and help requests |
| `(citizen)` | `/updates` | Public | Official government updates |
| `(authority)` | `/authority/dashboard` | Protected | Authority command center |
| `(authority)` | `/authority/incidents` | Protected | Incident management |
| `(authority)` | `/authority/hazards` | Protected | Hazard zone management |
| `(authority)` | `/authority/resources` | Protected | Resource and logistics management |
| `(authority)` | `/authority/map` | Protected | Strategic operations map |
| `(authority)` | `/authority/analysis` | Protected | Data analysis and reporting |
| `(ai)` | `/ai` | Protected | AI-powered analytics dashboard |
| `(ai)` | `/ai/briefing` | Protected | AI-generated intelligence briefing |
| `(ai)` | `/ai/report` | Protected | AI prediction reports |
| — | `/login` | Public | Authentication page |
| — | `/signup` | Public | Registration page |

---

## 4.4 Database Implementation

### 4.4.1 Database Management System

The system uses **PostgreSQL** hosted on Supabase as the relational database management system. PostgreSQL was selected for its support for custom ENUM types, UUID primary keys, Row Level Security policies, stored functions, and triggers — all of which are essential for a multi-role disaster management system.

### 4.4.2 Schema Design

The database schema consists of **seven core tables** designed in **Third Normal Form (3NF)** to ensure data integrity and minimize redundancy. The schema uses twelve custom PostgreSQL ENUM types to enforce data consistency.

#### Enumerated Types

The following custom ENUM types are defined to enforce valid data values:

```sql
-- User Roles
CREATE TYPE user_role AS ENUM ('citizen', 'community_supporter', 'authority');

-- Incident Classification
CREATE TYPE incident_type AS ENUM ('Flooding', 'Landslide', 'Structural Damage', 'Road Block');
CREATE TYPE incident_status AS ENUM ('pending', 'verified', 'resolved', 'rejected');

-- SOS Classification
CREATE TYPE sos_type AS ENUM ('medical', 'rescue', 'supplies', 'fire');
CREATE TYPE sos_status AS ENUM ('active', 'dispatched', 'resolved');

-- Hazard Classification
CREATE TYPE hazard_severity AS ENUM ('low', 'medium', 'high');
CREATE TYPE hazard_status AS ENUM ('active', 'cleared');

-- Updates and Logistics
CREATE TYPE update_severity AS ENUM ('info', 'warning', 'urgent');
CREATE TYPE region_severity AS ENUM ('Low', 'Mod', 'High', 'Critical');
CREATE TYPE resource_type AS ENUM ('medical', 'food', 'personnel', 'vehicle');
CREATE TYPE resource_status AS ENUM ('available', 'low', 'critical');
```

#### Table Structure

**Table 4.1 — Profiles Table**

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, FK → auth.users(id) | Linked to Supabase Auth |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| `full_name` | VARCHAR(255) | NOT NULL | Full name |
| `role` | user_role | NOT NULL, DEFAULT 'citizen' | RBAC role assignment |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Account creation time |
| `last_login` | TIMESTAMPTZ | — | Last login timestamp |
| `last_location_lat` | DECIMAL(10,8) | — | Last known latitude |
| `last_location_lng` | DECIMAL(11,8) | — | Last known longitude |

**Table 4.2 — Incidents Table**

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique incident identifier |
| `reporter_id` | UUID | FK → profiles(id) | Reporter reference |
| `itype` | incident_type | NOT NULL | Type of incident |
| `latitude` | DECIMAL(10,8) | NOT NULL | GPS latitude |
| `longitude` | DECIMAL(11,8) | NOT NULL | GPS longitude |
| `gps_accuracy` | DECIMAL(5,2) | — | GPS accuracy in meters |
| `evidence_photo_url` | TEXT | — | Photo evidence URL |
| `description` | TEXT | — | Incident description |
| `status` | incident_status | DEFAULT 'pending' | Current status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Report timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Table 4.3 — SOS Requests Table**

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique SOS identifier |
| `user_id` | UUID | FK → profiles(id) | Requesting user |
| `stype` | sos_type | NOT NULL | Type of emergency |
| `latitude` | DECIMAL(10,8) | NOT NULL | GPS latitude |
| `longitude` | DECIMAL(11,8) | NOT NULL | GPS longitude |
| `additional_info` | TEXT | — | Additional details |
| `status` | sos_status | DEFAULT 'active' | Current status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Request timestamp |

**Table 4.4 — Hazards Table**

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique hazard identifier |
| `severity` | hazard_severity | NOT NULL | Severity level |
| `title` | VARCHAR(255) | NOT NULL | Hazard title |
| `description` | TEXT | — | Hazard description |
| `latitude` | DECIMAL(10,8) | NOT NULL | GPS latitude |
| `longitude` | DECIMAL(11,8) | NOT NULL | GPS longitude |
| `status` | hazard_status | DEFAULT 'active' | Active or cleared |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Report timestamp |

**Table 4.5 — Official Updates Table**

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique update identifier |
| `authority_id` | UUID | FK → profiles(id) | Publishing authority |
| `title` | VARCHAR(255) | NOT NULL | Update title |
| `content` | TEXT | NOT NULL | Update content body |
| `severity` | update_severity | DEFAULT 'info' | Urgency level |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Publication timestamp |

**Table 4.6 — Regions Table**

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique region identifier |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Region name |
| `severity_level` | region_severity | DEFAULT 'Low' | Impact severity |
| `impact_percentage` | INTEGER | CHECK (0–100) | Impact percentage |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Table 4.7 — Resources Table**

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique resource identifier |
| `name` | VARCHAR(255) | NOT NULL | Resource name |
| `rtype` | resource_type | NOT NULL | Resource category |
| `region_id` | UUID | FK → regions(id) | Assigned region |
| `quantity` | DECIMAL(12,2) | NOT NULL | Available quantity |
| `unit` | VARCHAR(50) | NOT NULL | Measurement unit |
| `status` | resource_status | DEFAULT 'available' | Stock status |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update |

### 4.4.3 Row Level Security (RLS)

Row Level Security is enabled on the `profiles` table to enforce data access policies at the database level:

```sql
-- All profiles are publicly readable (required for display purposes)
CREATE POLICY "Public profiles are viewable by everyone."
    ON public.profiles FOR SELECT USING (true);

-- Users can only insert their own profile record
CREATE POLICY "Users can insert their own profile."
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile."
    ON public.profiles FOR UPDATE USING (auth.uid() = id);
```

### 4.4.4 Performance Optimization

Geospatial indexes are created on latitude and longitude columns for the three location-critical tables to ensure fast spatial queries:

```sql
CREATE INDEX idx_incidents_location ON public.incidents(latitude, longitude);
CREATE INDEX idx_sos_location ON public.sos_requests(latitude, longitude);
CREATE INDEX idx_hazards_location ON public.hazards(latitude, longitude);
CREATE INDEX idx_profiles_email ON public.profiles(email);
```

### 4.4.5 Database Triggers and Stored Functions

An `updated_at` trigger function is implemented to automatically maintain timestamp accuracy when records are modified:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';
```

This trigger is applied to the `incidents`, `regions`, and `resources` tables. Additionally, a stored function `get_hourly_stats()` is defined as an RPC endpoint that aggregates SOS requests and incidents by hour for the past 24 hours, used to render activity charts on the authority dashboard.

### 4.4.6 Normalization Analysis

The database schema adheres to **Third Normal Form (3NF)**:

- **1NF**: All columns contain atomic values with no repeating groups. Every table has a unique primary key (UUID).
- **2NF**: All non-key attributes are fully functionally dependent on the primary key. Single-column UUID primary keys naturally prevent partial dependencies.
- **3NF**: No transitive dependencies exist. Non-key fields depend directly on their respective primary keys.

---

## 4.5 Authentication and Authorization

### 4.5.1 Authentication Flow

The authentication system is built on **Supabase Auth** and supports three user roles: **Citizen**, **Community Supporter**, and **Authority**. The implementation uses Next.js Server Actions for secure, server-side authentication handling.

**Registration Process:**
1. The user provides email, password, full name, and selects a clearance level (role).
2. A Server Action (`signup`) calls `supabase.auth.signUp()` with the role stored in `user_metadata`.
3. A corresponding record is inserted into the `profiles` table linking the Auth UID to the selected role.
4. The user is redirected to the login page with a confirmation message.

**Login Process:**
1. The user enters credentials and selects their clearance level.
2. A Server Action (`login`) authenticates via `supabase.auth.signInWithPassword()`.
3. The system performs a multi-layered role resolution:
   - **Primary**: Reads the role from the `profiles` table.
   - **Fallback 1**: Uses `user_metadata.role` if the profile record is missing.
   - **Fallback 2**: Uses the form-submitted role for authority/community_supporter users.
4. If the profile record is missing, a **recovery mechanism** automatically creates a new profile entry from available metadata.
5. Role metadata is synchronized to ensure consistency between the database and auth tokens.
6. The user is redirected to their role-appropriate dashboard.

### 4.5.2 Supabase SSR Integration

The Supabase client is instantiated differently depending on the execution context:

**Client-Side (Browser):**
```typescript
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(supabaseUrl!, supabaseKey!);
```

**Server-Side (Server Components & Actions):**
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });
};
```

### 4.5.3 Middleware-Based Route Protection

A Next.js middleware function intercepts all requests to enforce role-based access control:

```typescript
export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes
  if (!user && !isAuthPage && (isAuthorityRoute || isAIRoute)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from login/signup pages
  if (user && isAuthPage) {
    // Redirect based on role (authority → dashboard, citizen → home)
  }

  return supabaseResponse;
}
```

The middleware matcher excludes static assets and image optimization routes to avoid unnecessary authentication checks:

```typescript
matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
```

---

## 4.6 Frontend Implementation

### 4.6.1 Application Layout and Providers

The root layout (`app/layout.tsx`) establishes the application shell with three global providers:

1. **LanguageProvider**: Wraps the entire application to provide internationalization support.
2. **ToastProvider**: Provides a global notification system accessible from any component.
3. **LocationTracker**: A background component that tracks the user's GPS position.

```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <ToastProvider>
            <LocationTracker />
            {children}
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
```

### 4.6.2 Design System

A custom design system is defined in `globals.css` using Tailwind CSS 4's `@theme` directive to ensure visual consistency:

```css
@theme {
  --color-brand-red: #d32f2f;
  --color-brand-orange: #ef6c00;
  --color-brand-yellow: #fbc02d;
  --color-brand-dark: #0f172a;
  --color-brand-bg: #f1f5f9;

  /* Authority Dark Theme */
  --color-auth-sidebar: #1e293b;
  --color-auth-sidebar-active: #334155;
  --color-auth-accent-red: #ef4444;

  /* Authority Light Theme */
  --color-auth-bg: #f8fafc;
  --color-auth-card: #ffffff;
}
```

Custom utility classes are defined for reusable visual patterns:

- **`.glass-morphism`**: Glassmorphism effect using `backdrop-filter: blur(20px) saturate(180%)` for the login and modal panels.
- **`.emergency-gradient`**: A red-to-pink gradient (`#ff4b2b → #ff416c`) used on primary action buttons throughout the application.
- **`.auth-panel-dark`**: A dark gradient panel style for the authority sidebar.

Typography is set using the **Geist** and **Geist Mono** font families from Google Fonts, integrated via Next.js's built-in font optimization.

### 4.6.3 Citizen Dashboard Module

The Citizen Dashboard (`app/(citizen)/page.tsx`) serves as the primary interface for the general public. It is implemented as a client-side component that fetches live data on mount using dynamic imports of server actions.

**Key Features Implemented:**

- **Urgent Alert Banner**: Automatically displays the most recent active hazard fetched from the database. Renders a green "no hazards" status when the system is clear.
- **Quick Action Cards**: Three primary actions — *Request Help* (SOS), *Report Damage* (Incident), and *View Nearby Alerts* (Hazards) — each triggering dedicated modals.
- **Situation Map Preview**: An embedded Mapbox static map showing the user's approximate location with overlay markers indicating hazard zones.
- **Network Status Widget**: Displays the current online/offline status and emergency hotline numbers.
- **Official Updates Feed**: Renders a list of recent government updates from the `official_updates` table.

### 4.6.4 Modal System

The application implements a comprehensive modal system (`components/ModalSystem.tsx`) built with Framer Motion's `AnimatePresence` for smooth entry/exit animations. Three primary modals are implemented:

**Hazards Modal**: Fetches all active hazards from the database and displays them sorted by distance from the user's current location. Each hazard card shows severity level, distance calculation, and links to detailed map views.

**Report Incident Modal**: A multi-field form allowing citizens to:
- Select the incident type (Flooding, Landslide, Structural Damage, Road Block).
- Provide a text description.
- Attach photo evidence (converted to Base64 for inline preview).
- Automatically capture GPS coordinates.
- Submit via the `submitIncident` server action.

**SOS Modal**: An emergency request form with:
- Emergency type selection (Medical, Rescue, Supplies, Fire).
- Urgency level selector.
- Number of people affected.
- Detailed description field.
- Automatic GPS location capture.
- Submission via the `submitSOS` server action.

### 4.6.5 Authority Dashboard Module

The Authority Dashboard (`app/(authority)/authority/dashboard/page.tsx`) provides a comprehensive command center for disaster management authorities. It features a dedicated layout with a dark-themed sidebar navigation (`AuthoritySidebar.tsx`) and a light-themed content area.

**Key Components:**

- **StatCards**: Display key metrics — active incidents, pending SOS requests, resource status, and regional severity — fetched from the database via server actions.
- **AI Insights Panel**: Analyzes current incidents and resource data to provide automated operational recommendations.
- **Message Volume Chart**: Visualizes hourly SOS and incident activity using data from the `get_hourly_stats()` RPC function, rendered as a bar chart.
- **Regional Severity Card**: Fetches and displays per-region severity levels and impact percentages.
- **Live Operations Map**: Renders a map overlay showing incident and SOS locations.
- **Recent Activity Card**: Lists recent SOS requests with one-click resolve functionality.

**Authority Sub-Pages:**
- **Incidents Management** (`/authority/incidents`): CRUD operations for incident reports with status updates.
- **Hazards Management** (`/authority/hazards`): Add, resolve, and delete hazard zones.
- **Resources Management** (`/authority/resources`): Track and manage logistics across regions.
- **Analysis** (`/authority/analysis`): Data analysis and export functionality.

### 4.6.6 AI Analytics Dashboard

The AI Dashboard (`app/(ai)/ai/page.tsx`) presents an analytics interface designed for disaster management decision-makers. Key sections include:

- **Statistical Overview**: Displays total processed reports, active anomalies, critical SOS alerts, and AI confidence scores.
- **Kelani River Water Levels (Hydro-Analysis)**: A simulated hydrological monitoring panel showing water level trends against flood thresholds for key monitoring stations along the Kelani River.
- **Seismic Activity Monitor**: A simulated seismic monitoring panel displaying activity data from seismic stations.
- **NLP Message Summary**: AI-aggregated categorization of citizen messages by panic level (HIGH PANIC, WARNING, RECOVERING), with topic clustering and message counts.
- **Priority SOS Feed**: A prioritized listing of critical SOS alerts with location data and dispatch status.

The AI dashboard also includes an **Intelligence Briefing** sub-page (`/ai/briefing`) and a **Detailed Prediction Report** page (`/ai/report`), both featuring PDF export and clipboard copy functionality.

### 4.6.7 Internationalization (i18n)

The application supports three languages — **English**, **Sinhala (සිංහල)**, and **Tamil (தமிழ்)** — implemented through a custom React Context (`context/LanguageContext.tsx`).

**Implementation Details:**
- A `LanguageProvider` component wraps the entire application and exposes a `t()` translation function.
- Translations are stored as in-memory key-value maps for each supported language.
- The selected language is persisted in `localStorage` under the key `outbreak_lang`.
- Components access translations via the `useLanguage()` custom hook.

```typescript
export type Language = "en" | "si" | "ta";

const translations: Record<Language, Record<string, string>> = {
  en: { dashboard: "Citizen Dashboard", sos: "SOS", ... },
  si: { dashboard: "පුරවැසි උපකරණ පුවරුව", sos: "හදිසි සහය", ... },
  ta: { dashboard: "குடிமக்கள் டாஷ்போர்டு", sos: "அவசரகால உதவி", ... },
};
```

### 4.6.8 Toast Notification System

A global toast notification system (`context/ToastContext.tsx`) is implemented using Framer Motion for animated notifications. The system supports four toast types: **success**, **error**, **warning**, and **info**, each with distinct color coding and iconography.

Key features:
- Auto-dismissal after 4 seconds with an animated progress bar.
- Smooth entry/exit animations using `AnimatePresence`.
- Manual dismissal via close button.
- Accessible from any component via the `useToast()` hook.

### 4.6.9 Geospatial Features

**Reverse Geocoding**: The `lib/geocoding.ts` module implements reverse geocoding using the **OpenStreetMap Nominatim API** to convert GPS coordinates into human-readable city and district names. Results are cached in `sessionStorage` to minimize API calls.

```typescript
export async function getCityFromCoords(lat: number, lng: number): Promise<string> {
  const cacheKey = `geo_${lat}_${lng}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
    { headers: { 'User-Agent': 'OutbreakDisasterManagementApp/1.0' } }
  );
  // Fallback hierarchy: city → town → municipality → district → county → state
}
```

**Location Tracking**: The `LocationTracker` component uses the browser's `navigator.geolocation` API to periodically update the authenticated user's location in the database via the `updateUserLocation` server action.

**Distance Calculations**: The Haversine formula is implemented in the `calculateDistance` function within server actions to compute distances between two geographic coordinates for proximity-based features such as sorting nearby hazards.

---

## 4.7 Server-Side Logic (Server Actions)

All backend logic is implemented as **Next.js Server Actions** (`app/actions/data.ts`), marked with the `'use server'` directive. These functions execute securely on the server with direct access to the Supabase client and are organized into two categories:

### 4.7.1 Data Fetching Functions

| Function | Purpose | Database Table |
|---|---|---|
| `getActiveHazards()` | Fetch active hazards within 50 km of user's location | `hazards`, `profiles` |
| `getAllHazards()` | Fetch all hazards for management | `hazards` |
| `getOfficialUpdates()` | Fetch latest 20 official updates | `official_updates`, `profiles` |
| `getStats()` | Aggregate dashboard statistics | `incidents`, `sos_requests`, `hazards` |
| `getRegions()` | Fetch all regions with severity data | `regions` |
| `getRecentSos()` | Fetch 20 most recent SOS requests | `sos_requests`, `profiles` |
| `getAllIncidents()` | Fetch all incidents with reporter names | `incidents`, `profiles` |
| `getResources()` | Fetch all resources with region names | `resources`, `regions` |
| `getHourlyActivityStats()` | Call `get_hourly_stats()` RPC | RPC Function |

### 4.7.2 Data Mutation Functions

| Function | Purpose | Operation |
|---|---|---|
| `submitIncident(formData)` | Submit a new damage report | INSERT → `incidents` |
| `updateIncidentStatus(id, status)` | Update incident status | UPDATE → `incidents` |
| `deleteIncident(id)` | Remove an incident | DELETE → `incidents` |
| `submitSOS(formData)` | Submit an emergency request | INSERT → `sos_requests` |
| `resolveSOS(id)` | Mark SOS as resolved | UPDATE → `sos_requests` |
| `deleteSOS(id)` | Remove an SOS request | DELETE → `sos_requests` |
| `addResource(formData)` | Add a new resource | INSERT → `resources` |
| `updateResourceStock(id, qty, status)` | Update resource availability | UPDATE → `resources` |
| `deleteResource(id)` | Remove a resource | DELETE → `resources` |
| `addHazard(formData)` | Add a new hazard zone | INSERT → `hazards` |
| `resolveHazard(id)` | Clear a hazard zone | UPDATE → `hazards` |
| `deleteHazard(id)` | Remove a hazard | DELETE → `hazards` |
| `addOfficialUpdate(formData)` | Publish an official update | INSERT → `official_updates` |
| `updateUserLocation(lat, lng)` | Update user's GPS position | UPDATE → `profiles` |

All mutation functions call `revalidatePath()` after execution to ensure the Next.js cache is invalidated and updated data is reflected across the application.

---

## 4.8 Offline Edge Mode

### 4.8.1 Purpose and Design

The Offline Edge Mode (`offlineMode/index.html`) is a **standalone, zero-dependency HTML application** designed to function when internet connectivity is unavailable during active disaster situations. It simulates a **mesh network communication node** that enables local device-to-device messaging within a limited range.

### 4.8.2 Implementation

The offline mode is implemented as a single HTML file containing embedded CSS and JavaScript, ensuring it can operate without any external dependencies, CDN resources, or build tools.

**Key Features:**

- **Mesh Network Simulation**: Displays a sidebar with signal strength, broadcast range (~100 meters), and peer count metrics simulating a LoRa mesh network.
- **Local Message Feed**: A chat-like interface for sending and receiving messages between nearby devices. Messages are timestamped using Sri Lanka Time (UTC+5:30).
- **SOS Broadcast**: A high-priority emergency broadcast system that:
  - Captures real GPS coordinates via `navigator.geolocation`.
  - Falls back to default Colombo coordinates if GPS is unavailable.
  - Generates a Google Maps search link for the SOS location.
  - Queues the SOS data for synchronization.
- **Sync Manager**: Generates a downloadable JSON bundle containing all queued messages and SOS broadcasts with metadata including:
  - Sri Lanka timestamps (ISO format and localized).
  - GPS location data.
  - Priority levels and delivery priority flags.
  - Node identification.
- **Power Saver Mode**: Applies a high-contrast monochrome theme (green-on-black) to minimize battery consumption on mobile devices during extended offline operation.
- **Dark Theme Support**: CSS custom properties enable dynamic theme switching.

**Sri Lanka Time Calculation:**
```javascript
function getSLTime() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 5.5)); // UTC+5:30
}
```

**JSON Sync Payload Structure:**
```json
{
  "package_id": "SYNC-xxxxxxxxx",
  "timestamp_iso": "2026-03-11T10:00:00.000Z",
  "timestamp_sl": "Wednesday, 11 March 2026 at 15:30:00 IST",
  "node_id": "8392-A",
  "data_points": [
    {
      "id": "SOS-1741234567890",
      "type": "SOS_BROADCAST",
      "priority": "CRITICAL",
      "location_coordinates": "6.9271,79.8612",
      "maps_search_link": "https://www.google.com/maps/search/?api=1&query=6.9271,79.8612",
      "metadata": {
        "node_id": "8392-A",
        "is_prio_critical": true,
        "delivery_priority": "CRITICAL"
      }
    }
  ],
  "status": "EDGE_READY",
  "is_emergency_relay": true
}
```

---

## 4.9 Component Architecture

The application uses **21 reusable React components** organized in the `components/` directory. The key components and their responsibilities are summarized below:

| Component | File | Responsibility |
|---|---|---|
| Navbar | `Navbar.tsx` | Navigation bar with language selector and auth controls |
| Footer | `Footer.tsx` | Application footer with emergency hotlines |
| AuthorityLayout | `AuthorityLayout.tsx` | Authority page wrapper with sidebar |
| AuthoritySidebar | `AuthoritySidebar.tsx` | Dark-themed sidebar navigation for authority pages |
| AlertCard | `AlertCard.tsx` | Reusable alert banner with severity variants |
| QuickActionCard | `QuickActionCard.tsx` | Interactive action cards with icons and badges |
| DashboardWidgets | `DashboardWidgets.tsx` | Network status and official updates widgets |
| DataCard | `DataCard.tsx` | Reusable data display card for the authority dashboard |
| ModalSystem | `ModalSystem.tsx` | Hazards, Report, and SOS modal implementations |
| AIModals | `AIModals.tsx` | AI-specific modal components (briefing, predictions) |
| SituationalOverview | `SituationalOverview.tsx` | Situational awareness summary panel |
| PageHeader | `PageHeader.tsx` | Consistent page header component |
| SideActions | `SideActions.tsx` | Floating side action buttons |
| LocationTracker | `LocationTracker.tsx` | Background GPS location tracking |
| Skeleton | `Skeleton.tsx` | Loading skeleton placeholder component |
| CreateIncidentModal | `CreateIncidentModal.tsx` | Authority incident creation form |
| AddHazardModal | `AddHazardModal.tsx` | Authority hazard zone creation form |
| BroadcastAlertModal | `BroadcastAlertModal.tsx` | Official alert broadcasting form |
| ExportReportModal | `ExportReportModal.tsx` | Data export and report generation |
| NewShipmentModal | `NewShipmentModal.tsx` | Resource shipment management |
| EvacuationInstructions | `EvacuationInstructions.tsx` | Evacuation procedure display |

---

## 4.10 Project Directory Structure

```
outbreak/
├── databaseIntializeQuery.sql       # Complete database schema
├── database_architecture_explanation.md
├── database_er_diagram.png
├── sample_data.sql
│
├── onlineMode/                      # Next.js Application
│   ├── app/
│   │   ├── layout.tsx               # Root layout with providers
│   │   ├── globals.css              # Design system and theme
│   │   ├── (citizen)/               # Public citizen routes
│   │   │   ├── page.tsx             # Citizen dashboard (home)
│   │   │   ├── map/                 # Situation map pages
│   │   │   ├── incidents/           # Incident listing
│   │   │   ├── news/                # News feed
│   │   │   ├── briefing/            # Situation briefing
│   │   │   ├── people-needs/        # Community needs
│   │   │   └── updates/             # Official updates
│   │   ├── (authority)/authority/    # Protected authority routes
│   │   │   ├── dashboard/           # Command center
│   │   │   ├── incidents/           # Incident management
│   │   │   ├── hazards/             # Hazard management
│   │   │   ├── resources/           # Resource management
│   │   │   ├── map/                 # Operations map
│   │   │   └── analysis/            # Data analysis
│   │   ├── (ai)/ai/                 # Protected AI routes
│   │   │   ├── page.tsx             # AI analytics dashboard
│   │   │   ├── briefing/            # AI-generated briefing
│   │   │   └── report/              # Prediction reports
│   │   ├── auth/actions.ts          # Auth server actions
│   │   ├── actions/data.ts          # Data server actions
│   │   ├── login/                   # Login page
│   │   └── signup/                  # Registration page
│   ├── components/                  # 21 reusable components
│   ├── context/
│   │   ├── LanguageContext.tsx       # i18n provider (EN/SI/TA)
│   │   └── ToastContext.tsx          # Toast notification provider
│   ├── lib/
│   │   ├── geocoding.ts             # Reverse geocoding (Nominatim)
│   │   └── utils.ts                 # Utility functions (cn)
│   ├── utils/supabase/
│   │   ├── client.ts                # Browser Supabase client
│   │   ├── server.ts                # Server Supabase client
│   │   └── middleware.ts            # Middleware Supabase client
│   ├── middleware.ts                # Route protection middleware
│   ├── package.json
│   └── tsconfig.json
│
└── offlineMode/
    └── index.html                   # Standalone offline edge node
```

---

## 4.11 Summary

This chapter detailed the complete implementation of the Outbreak Disaster Management System. The system was built using a modern technology stack centered around Next.js 16, React 19, TypeScript, Tailwind CSS 4, and Supabase. The PostgreSQL database schema was designed in Third Normal Form with seven core tables, custom ENUM types, Row Level Security, and performance indexes. The frontend was implemented with 21 reusable components across three role-based route groups (Citizen, Authority, and AI), supported by a custom internationalization system (English, Sinhala, Tamil), animated toast notifications, and geospatial features including reverse geocoding and location tracking. Server-side logic was implemented entirely using Next.js Server Actions for secure, type-safe data operations. A standalone offline edge mode was developed for zero-dependency operation during network outages, featuring mesh network simulation, SOS broadcasting with GPS, and JSON-based data synchronization.
