# Design Guidelines: School Assessment & Examination System

## Design Approach

**Selected Approach:** Design System-Based (Material Design principles)

**Justification:** This is a utility-focused, information-dense platform where trust, clarity, and efficiency are paramount. Students need to focus during exams without visual distractions, teachers need efficient workflows for grading and management, and administrators require clear data visualization. Material Design's structured approach provides the necessary hierarchy and familiarity for educational contexts.

**Key Principles:**
- Clarity over decoration - minimize visual noise during exam sessions
- Consistent patterns across all three portals for cognitive ease
- Generous whitespace in exam interface to reduce stress
- Strong visual hierarchy to guide users through complex workflows

---

## Typography

**Font Family:** Inter (Google Fonts) for UI, Roboto Mono for numeric data/scores

**Hierarchy:**
- H1 (Dashboard headers): text-3xl font-semibold (30px)
- H2 (Section titles): text-2xl font-semibold (24px)
- H3 (Card headers): text-xl font-medium (20px)
- H4 (Subsections): text-lg font-medium (18px)
- Body text: text-base (16px) font-normal
- Small text (metadata/timestamps): text-sm (14px)
- Micro text (hints/captions): text-xs (12px)
- Button text: text-sm font-medium (14px, 500 weight)
- Scores/numeric data: text-2xl font-mono font-bold

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16 consistently
- Tight spacing: p-2, gap-2 (compact lists, icons)
- Default spacing: p-4, gap-4 (cards, forms)
- Section spacing: p-6, gap-6 (dashboard sections)
- Large spacing: p-8, gap-8 (between major sections)
- Extra large: p-12, p-16 (page margins on desktop)

**Responsive Containers:**
- Dashboard layouts: max-w-7xl mx-auto px-4 md:px-6 lg:px-8
- Exam interface: max-w-screen-2xl mx-auto (wider for question palette)
- Form containers: max-w-2xl mx-auto
- Content cards: w-full with internal padding p-6

**Grid Patterns:**
- Dashboard cards: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Statistics grid: grid grid-cols-2 md:grid-cols-4 gap-4
- Question bank list: single column with dividers
- Analytics charts: grid grid-cols-1 lg:grid-cols-2 gap-8

---

## Component Library

### Navigation
**Top Navigation Bar:**
- Full-width with shadow-sm
- Height: h-16
- Logo left, user menu right
- Role indicator badge (Student/Teacher/Admin)
- Notification bell icon with count badge

**Sidebar (Teacher/Admin):**
- Fixed left sidebar w-64
- Collapsible on mobile
- Icon + label navigation items
- Active state with subtle left border accent

### Dashboard Cards
**Stat Cards:**
- Rounded corners: rounded-lg
- Padding: p-6
- Shadow: shadow-md
- Icon in top-left (w-12 h-12 rounded-full with background)
- Large number display below
- Label text underneath

**Upcoming Exam Cards:**
- Full-width on mobile, grid on desktop
- Padding: p-4
- Border: border-l-4 (status indicator)
- Title, date/time, duration, subject metadata
- Action button in bottom-right

### Exam Interface (Critical Component)
**Layout Structure:**
- Split layout: Question area (60%) | Question palette (40%) on desktop
- Stack vertically on mobile/tablet
- Sticky header with timer, student info, submit button
- Subject tabs at top (if multi-subject exam)

**Question Display Area:**
- Background: subtle panel background
- Padding: p-8 lg:p-12
- Question number and marks in header
- Generous line-height for readability (leading-relaxed)
- Options with full-width clickable areas
- Padding between options: space-y-4

**Question Palette:**
- Fixed/sticky on desktop
- Grid of question numbers: grid grid-cols-5 gap-2
- Each number as button: w-10 h-10 rounded
- States: not visited, visited, answered, marked for review
- Legend at top explaining states
- Subject-wise filtering tabs

**Navigation Controls:**
- Bottom action bar: sticky bottom
- Buttons: "Save & Next", "Clear Response", "Mark for Review"
- Full width on mobile, inline on desktop
- Spacing between buttons: gap-4

### Forms
**Input Fields:**
- Height: h-12 for text inputs
- Padding: px-4
- Border: border rounded-md
- Focus: ring-2 with offset
- Label above: text-sm font-medium mb-2

**Buttons:**
- Primary action: px-6 py-3 rounded-md font-medium
- Secondary: px-6 py-3 rounded-md border-2
- Icon buttons: w-10 h-10 rounded-md flex items-center justify-center
- Disabled state: opacity-50 cursor-not-allowed

### Data Tables
**Question Bank / Student Lists:**
- Full-width responsive tables
- Header: sticky top with font-medium
- Row padding: py-4 px-6
- Alternating row backgrounds for readability
- Action buttons (Edit/Delete) in last column
- Hover state on rows
- Pagination controls at bottom

### Charts & Analytics
**Chart Containers:**
- Background: card background
- Padding: p-6
- Rounded: rounded-lg
- Title above chart: text-lg font-semibold mb-4
- Minimum height: h-80 for visibility
- Use Recharts for all visualizations

**Dashboard Layout:**
- Performance over time: Line chart (full width)
- Subject-wise performance: Bar chart
- Topic strength: Horizontal bar chart
- Score distribution: Pie/Donut chart

### Modals & Overlays
**Modal Structure:**
- Max width: max-w-2xl
- Padding: p-6
- Header with title and close button
- Content area with proper spacing
- Footer with action buttons aligned right
- Backdrop: semi-transparent overlay

### Notifications
**Toast Notifications:**
- Position: top-right, fixed
- Width: max-w-sm
- Padding: p-4
- Border-left indicator for type (success/error/warning)
- Auto-dismiss after 5 seconds
- Slide-in animation

### Anti-Cheating UI Elements
**Warning Banners:**
- Full-width alert bar at top
- Padding: p-4
- Icon + message + count
- "You have switched tabs 3 times" type messages
- Persistent during exam

**Session Lock Screen:**
- Full-screen overlay
- Centered message
- Contact admin button
- No dismiss option

---

## Images

**Student Dashboard Hero:**
- Subtle abstract educational illustration (books, graduation cap motifs)
- Placement: Top of dashboard as banner (h-48 on desktop)
- Overlay with welcome message and student name
- Blurred background for text overlay

**Empty States:**
- Illustration for "No exams scheduled" - calendar with checkmark
- "Question bank empty" - folder with plus icon
- Dimensions: w-48 h-48 centered in empty section

**No large hero images** - this is a functional application where users come for specific tasks, not marketing content.

---

## Critical Exam Interface Specifications

The exam interface is the core of this system and requires special attention:

**Full-screen Enforcement:**
- Exam launches in maximized view
- Exit full-screen triggers warning modal
- Browser navigation hidden during exam

**Timer Display:**
- Prominent position: top-right corner
- Large, readable digits: text-2xl font-mono
- Changes visual treatment in last 5 minutes (no color change, just size: text-3xl)

**Auto-save Indicator:**
- Small badge showing "Saved" status
- Position: near question number
- Brief animation on save completion

**Accessibility:**
- High contrast throughout
- Font size controls (A-/A+) in exam header
- Keyboard navigation support (arrow keys for questions)
- Screen reader friendly question markup

---

This design system prioritizes cognitive ease during high-stakes exam situations while maintaining professional polish throughout the teacher and admin workflows. The consistent patterns reduce learning curves across portals, and the generous spacing prevents interface anxiety during testing.