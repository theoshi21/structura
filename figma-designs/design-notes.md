# Structura Design Notes

## Brand

### Logo
- Hexagon outline icon + "Structura" wordmark side by side
- Dark navy or white depending on background

### Typography
- Headings: Yeseva One (serif)
- Body / UI: Open Sans (sans-serif)

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| off-white | #FDFDFC | Page backgrounds (light) |
| light-grey | #C4C8D3 | Borders, subtle UI |
| mid-grey | #BDC0C7 | Secondary text, dividers |
| near-black | #0F0F1A | Primary text |
| dark-navy | #16162A | Dark backgrounds, sidebar |
| primary | #4F46E | CTAs, active states, badges |
| accent | #818CF8 | Hover states, accents, highlight words |

---

## Landing Page

### Navbar
- Background: dark navy (#16162A), full width
- Left: logo + wordmark (white)
- Center: nav links — Features, About, Contact (white)
- Right: "Sign In" pill button — dark fill, white text, rounded border

### Hero Section
- Full dark navy background with subtle radial purple glow center
- Badge: "STUDENT ORGANIZATION PLATFORM" — #4F46E fill, white caps, rounded pill
- Heading: "Manage without the chaos." — Yeseva One, large, white; "chaos." in #818CF8
- Subtext: Open Sans, light grey, centered
- Two CTA buttons:
  - "Get Started →" — solid #4F46E, rounded pill
  - "See Features" — dark fill, white text, rounded pill, subtle border

### Features Section
- Section label: "WHAT STRUCTURA OFFERS" — small caps, #818CF8, centered
- Heading: "Everything your org needs" — Yeseva One, white, centered
- Grid: 4 cols top row, 3 cols bottom row
- Cards: dark bg (#16162A-ish), rounded corners, subtle border
  - Each card: emoji icon, bold white title, small grey description
  1. User Authentication — 🔒
  2. Role-Based Access — 🎭
  3. Event Management — 📅
  4. Document Management — 📁
  5. Checklist Management — ✅
  6. Budget Management — 💰
  7. Audit Trail — 📋

### About Section
- Left-aligned layout, generous padding
- Section label: "WHY STRUCTURA" — small white caps
- Heading: "Built for student orgs, not spreadsheets." — Yeseva One, large, white
- Two body paragraphs, Open Sans, light grey, left-aligned

### CTA / Pre-Footer Section
- Background: slightly lighter navy (#16162A)
- Centered layout
- Heading: "Ready to get organized?" — Yeseva One, large, white
- Subtext: Open Sans, light grey, centered
- Button: "Get Started Now" — solid #4F46E, rounded pill, wide

### Footer Bar
- Thin strip, darker background
- Left: logo + wordmark (smaller)
- Right: "© 2026 Structura. Built for student organizations." — small grey text

---

## Auth Screens

### Shared Layout (Register + Sign In)
- Dark navy background (#0F0F1A)
- Logo-only navbar (no nav links)
- Centered form content
- "← Back to home" link above heading
- Form section labels as small caps + horizontal rule divider (e.g. "PERSONAL INFORMATION")
- Input fields: dark fill (#16162A-ish), rounded, white label above
- Dropdowns have arrow indicator on right
- Two-column layout for side-by-side fields

### Register Page — Account Type Toggle
- Two buttons: "Student Organization" (🎓) and "Administrative Office" (🏛️)
- Active tab has highlighted background

### Register — Employee Fields
- Personal Info: First Name, Last Name, E-mail Address
- Office Details: School (dropdown), Office/Department Name, Position/Title + Employee #, Admin Access Code
- Password: Set Password, Confirm Password
- Checkbox: "I agree to the Terms of Use and Privacy Policy" (links in #818CF8)
- Button: "Create Account" — solid #4F46E, full width, rounded pill
- Footer: "Already have an account? Sign In" — "Sign In" in #818CF8

### Register — Student Fields
- Personal Info: First Name, Last Name, E-mail Address
- Organization Details: School (dropdown), Organization Name, Department/College + Your Role (dropdown), Student #
- Password: Set Password, Confirm Password
- Same checkbox, button, footer as employee

### Sign In Page
- Heading: "Welcome Back!" — Yeseva One, white
- Subtext: "Sign in to your account to continue."
- Fields: E-mail Address, Password
- "Forgot password?" link in #818CF8, right-aligned next to Password label
- Checkbox: "Remember me for 30 days"
- Button: "Sign In" — solid #4F46E, full width, rounded pill
- Divider line
- Footer: "Don't have an account? Sign Up" — "Sign Up" in #818CF8

## Student Portal

### Shared Sidebar (Student)
- Width: ~180px, dark navy (#16162A)
- Top: logo + wordmark
- Role badge: "Student" — #4F46E pill
- Nav: Dashboard (active = highlighted bg), My Events, Documents, Checklists, Budget
- Bottom: purple circle avatar with initial, name + org name (small), "← Log out"

### Student Dashboard
- Heading: "Welcome Back, User!" — Yeseva One
- 4 stat cards: 🏢 Organizations, ⏳ Pending Reviews, 💰 Total Fund, 📅 Active Events
- "MY SUBMISSIONS" table: Event, Date, Status (green Approved / red Declined)
- "BUDGET OVERVIEW" panel: Allocated / Spent / Remaining + progress bar (#4F46E) + "72% used"

### My Events
- Filter tabs: All (active), Pending, Approved, Returned, Completed
- Table: Event Name, Date, Venue, Budget Req., Status, Action
- Status badges: amber Pending, red Declined
- Action: "View" in #818CF8

### Documents
- "+ Upload" button top-right
- Filter tabs: All, Permits, Contracts, Receipts, Promotional
- Drag & drop zone: dashed border, paperclip icon, "PDF, DOCX, PNG, XLSX — max 10MB"
- Table: File Name, Type, Event, Size, Uploaded, Status, Action
- Status badge: green Submitted

### Checklists
- "+ New Checklist" button top-right
- 3-column card grid
- Each card: event name, "X/Y done" green badge, #4F46E progress bar, checklist items with checkboxes

### Student Budget
- "+ Add Expense" button top-right
- 3 stat cards: 💰 Allocated, 📤 Spent, 💚 Remaining
- Full-width progress bar + "72% of the budget used" right-aligned
- "EXPENDITURES" table: Description, Event, Date, Amount, Receipt (amber Pending badge)

---

## School Admin Portal

### Shared Sidebar (Admin)
- Same structure as student sidebar
- Role badge: "Office" — teal/cyan pill
- Nav: Dashboard, Submissions, Users, Budget, Audit Trail
- Bottom: teal "A" avatar, "Admin / Office of Student Life", "← Log out"

### Admin Dashboard
- Heading: "Admin Overview" — Yeseva One
- Same 4 stat cards as student dashboard
- "PENDING APPROVALS" table: Event, Org, Submitted, Action ("View" in #818CF8)
- "FUND ALLOCATION" panel: Total fund / Allocated / Remaining + progress bar + "67% allocated"

### User Management
- "+ Add User" button top-right
- Filter tabs: All, Organizer, Officer
- Table: Name (avatar circle + initials), Organization, Role, Status, Action
- Status badge: green ACTIVE
- Action: "Edit" in #818CF8

### Submissions
- Filter tabs: All, Pending, Approved, Returned, Rejected
- Table: Event Name, Organization, Date, Budget Req., Docs (green number badge), Status, Action
- Status badge: amber Pending
- Action: "Review" in #818CF8

### Admin Budget
- "+ Allocate Funds" button top-right
- 3 stat cards: 🏛️ Total Fund, 📤 Allocated, 💚 Remaining
- Progress bar + "67% of the budget used"
- "PER ORGANIZATION" table: Organization, Allocated, Spent, Remaining, Utilization (amber % badge)

### Audit Trail
- Filter tabs: All, Budget, Events, Documents
- Log rows: bold action description + "By Admin · [date] · [time]" in grey
- Category badge right-aligned: green Budget / green Event
