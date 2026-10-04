# Academic Portal — Design System Specification

**Version:** 2.0.0 (Pure Academic ERP / EE-VDT Department Operating System)  
**Status:** Institutional Design System Specification  

---

## 1. Brand Principles

1. **Academic Institution First**: The portal is a serious, production-grade Department Operating System for Electronics Engineering (VLSI Design and Technology). It is built strictly for institutional operations.
2. **Clarity & Structural Calm**: High information density presented with strict visual hierarchy. Neutral surfaces (`#f8fafc`, `#ffffff`) dominate; primary Indigo (`#4f46e5`) is reserved for active navigation, key action triggers, and primary interactive indicators.
3. **Role Uniformity**: Student, Faculty, HOD, and Administrator portals share the exact same visual language, layout container, header structure, table styling, and design tokens. Only domain-specific content and role-aware navigation differ.
4. **Resilient & Responsive**: Every view seamlessly adapts between desktop widescreen, tablet, and mobile displays without layout breakage or unhandled horizontal scrollbars.

---

## 2. Color Tokens

### Light Mode Palette
```css
--bg-app:          #f8fafc;  /* Slate 50  - Main application background */
--bg-surface:      #ffffff;  /* White     - Card and container surfaces */
--bg-surface-sub:  #f1f5f9;  /* Slate 100 - Sub-panels, hover states, muted areas */
--bg-surface-elev: #ffffff;  /* White     - Elevated dropdowns, modals */

--border-subtle:   #f1f5f9;  /* Slate 100 - Divider lines inside cards */
--border-default:  #e2e8f0;  /* Slate 200 - Standard container borders */
--border-strong:   #cbd5e1;  /* Slate 300 - Input borders, active states */

--text-main:       #0f172a;  /* Slate 900 - Headings & primary body text */
--text-muted:      #475569;  /* Slate 600 - Secondary text, subtitles */
--text-faint:      #94a3b8;  /* Slate 400 - Captions, disabled text, placeholders */

--primary:         #4f46e5;  /* Indigo 600 - Primary brand / active highlight */
--primary-hover:   #4338ca;  /* Indigo 700 - Primary button hover state */
--primary-subtle:  #eef2ff;  /* Indigo 50  - Active navigation pill background */
--primary-border:  #c7d2fe;  /* Indigo 200 - Active card highlight border */

--success:         #059669;  /* Emerald 600 - Graded, Present, Completed */
--success-subtle:  #ecfdf5;  /* Emerald 50  - Success badge background */
--warning:         #d97706;  /* Amber 600   - Pending, Late, Caution */
--warning-subtle:  #fffbeb;  /* Amber 50    - Warning badge background */
--danger:          #dc2626;  /* Red 600     - Absent, High Priority, Overdue */
--danger-subtle:   #fef2f2;  /* Red 50      - Danger badge background */
```

### Dark Mode Palette
```css
--bg-app-dark:          #020617;  /* Slate 950 - Main dark background */
--bg-surface-dark:      #0f172a;  /* Slate 900 - Dark card & panel surfaces */
--bg-surface-sub-dark:  #1e293b;  /* Slate 800 - Sub-panels, hover states */

--border-default-dark:  #1e293b;  /* Slate 800 - Dark mode default border */
--border-strong-dark:   #334155;  /* Slate 700 - Dark input focus border */

--text-main-dark:       #f8fafc;  /* Slate 50  - Dark mode primary text */
--text-muted-dark:      #94a3b8;  /* Slate 400 - Dark mode secondary text */

--primary-dark:         #6366f1;  /* Indigo 500 - Primary highlight in dark mode */
--primary-subtle-dark:  #1e1b4b;  /* Indigo 950 - Active tab background dark */
```

---

## 3. Typography Scale

Font Family: `Inter`, system-ui, sans-serif

| Style Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `text-display` | `1.875rem` (30px) | `2.25rem` (36px) | Bold (700) | Major portal headers, welcome banners |
| `text-h1` | `1.5rem` (24px) | `2.0rem` (32px) | Bold (700) | Page titles, workspace titles |
| `text-h2` | `1.25rem` (20px) | `1.75rem` (28px) | SemiBold (600) | Section titles, card headers |
| `text-h3` | `1.0rem` (16px) | `1.5rem` (24px) | SemiBold (600) | Sub-section headers, widget titles |
| `text-body` | `0.875rem` (14px) | `1.25rem` (20px) | Regular (400) | Primary table data, modal text, descriptions |
| `text-sub` | `0.75rem` (12px) | `1.0rem` (16px) | Medium (500) | Secondary metadata, tags, form labels |
| `text-caption` | `0.6875rem` (11px) | `0.875rem` (14px) | Bold (700) | Uppercase category labels, badges, table TH |

---

## 4. Spacing Scale

- `space-xs`: `0.25rem` (4px)
- `space-sm`: `0.5rem` (8px)
- `space-md`: `0.75rem` (12px)
- `space-lg`: `1.0rem` (16px)
- `space-xl`: `1.5rem` (24px)
- `space-2xl`: `2.0rem` (32px)

---

## 5. Border & Radius System

- `radius-sm`: `0.375rem` (6px) - Badges, status dots, small inline tags
- `radius-md`: `0.5rem` (8px) - Table headers, inner list items, buttons
- `radius-lg`: `0.75rem` (12px) - Inputs, dropdowns, primary buttons
- `radius-xl`: `1.0rem` (16px) - Cards, sub-panels, modal containers
- `radius-2xl`: `1.25rem` (20px) - Main page banners

---

## 6. Elevation & Shadow System

- `shadow-none`: `none` (Default for flat surface containers)
- `shadow-sm`: `0 1px 2px 0 rgba(15, 23, 42, 0.05)` (Standard card shadow)
- `shadow-md`: `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)` (Hover states & elevated panels)
- `shadow-overlay`: `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1)` (Modals & dropdowns)

---

## 7. Button Variants

1. **Primary (`btn-primary`)**:
   - Background: Indigo 600 (`#4f46e5`), text: `#ffffff`.
   - Hover: Indigo 700 (`#4338ca`), active press scaling.
   - Usage: Main call to action ("Submit Solution", "Mark Attendance", "Create Assignment", "Sign In").
2. **Secondary (`btn-secondary`)**:
   - Background: Surface White (`#ffffff`), border: Slate 200 (`#e2e8f0`), text: Slate 700 (`#334155`).
   - Hover: Background Slate 100 (`#f1f5f9`).
   - Usage: Filters, cancel actions, secondary options.
3. **Ghost (`btn-ghost`)**:
   - Background: Transparent, text: Slate 600 (`#475569`).
   - Hover: Background Slate 100 (`#f1f5f9`), text Slate 900 (`#0f172a`).
   - Usage: Navigation tabs, header menu items, inline table actions.
4. **Danger (`btn-danger`)**:
   - Background: Red 600 (`#dc2626`), text: `#ffffff`.
   - Hover: Red 700 (`#b91c1c`).
   - Usage: Destructive actions ("Delete Slot", "Unenroll Student", "Archive Department").

---

## 8. Card System

- **Standard Card**: Background `#ffffff`, border `1px solid #e2e8f0`, radius `16px`, padding `20px` (`p-5`).
- **Interactive Card**: Standard card + `hover:border-indigo-200 hover:shadow-md cursor-pointer transition-all`.
- **Hero/Header Banner**: Gradient `#312e81` -> `#4338ca`, radius `20px`, padding `24px` (`p-6`), crisp contrast text.

---

## 9. Data Table System

- **Container**: Border `1px solid #e2e8f0`, radius `16px`, background `#ffffff`, `overflow-hidden`.
- **Header (`<th>`)**: Background `#f8fafc`, text Slate 500 (`#64748B`), font-size `11px`, weight `700`, uppercase, padding `12px 16px`, border-bottom `1px solid #e2e8f0`.
- **Row (`<tr>`)**: Padding `14px 16px`, text Slate 900 (`#0f172a`), hover background `#f8fafc`.
- **Mobile Responsive Behavior**: On mobile screens (`< 640px`), data tables convert to clean stacked card lists to prevent ugly horizontal clipping.

---

## 10. Form Control System

- **Input / Select / Textarea**:
  - Background `#ffffff`, border `1px solid #cbd5e1`, radius `12px`, padding `10px 14px`, text `13px` (`text-sm`).
  - Focus state: `border-indigo-600 ring-2 ring-indigo-500/20 outline-none`.
- **Form Label**: Font size `11px`, font weight `700`, uppercase, letter spacing `wider`, color Slate 500 (`#64748b`), margin-bottom `6px`.

---

## 11. Status Badges

- **Present / Graded / Ready**: `bg-emerald-50 text-emerald-700 border-emerald-200`
- **Submitted / Enrolled / Active**: `bg-indigo-50 text-indigo-700 border-indigo-200`
- **Pending / Late / Caution**: `bg-amber-50 text-amber-700 border-amber-200`
- **Absent / Overdue / High Priority**: `bg-red-50 text-red-700 border-red-200`

---

## 12. Empty / Loading / Error States

- **Empty State**: Centered container with clean academic icon (`📚`, `📝`, `📅`), Slate 700 title, Slate 500 subtitle, and an optional action button.
- **Loading State**: Smooth Indigo spinner ring (`w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin`) with a calm loading text string.
- **Error State**: Styled Red 50 box with clear root cause explanation and a "Retry" button.

---

## 13. Shell & Navigation System

- **Top Bar**: Fixed 56px height (`h-14`), white surface (`#ffffff`), bottom border (`#e2e8f0`), department brand logo (`EE-VDT`), sidebar toggle, global search modal trigger (`⌘K`), notification bell, user profile avatar.
- **Sidebar**: Fixed 220px desktop width (collapsible to 60px), background `#ffffff`, role-aware navigation links grouped under section labels (`Academics`, `Management`, `System`).

---

## 14. Dashboard Layout Rules

Every dashboard follows a 4-tier structured priority:
1. **Header Banner**: Contextual greeting, active semester details, primary quick action.
2. **Priority Action Row**: Today's schedule / pending tasks requiring immediate user attention.
3. **Academic Data Grid**: Main content split 2:1 between primary data (Subjects, Courses, Roster) and secondary feeds (Announcements, Notifications).
4. **Summary Stats**: Clean KPI metrics displaying totals and status counts.

---

## 15. Dark Mode Tokens

Consolidated dark theme using Slate 950 (`#020617`), Slate 900 (`#0f172a`), and Slate 800 (`#1e293b`) with smooth 150ms transitions.
