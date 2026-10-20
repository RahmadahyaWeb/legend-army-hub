# Legend Army Hub — UI/UX Guidelines & Design System

> **Single Source of Truth** for all UI/UX design, layout, components, and content across the Legend Army Hub platform. All future UI additions and refactors must strictly comply with this document.

---

## 1. Design Principles & Visual Identity

Legend Army Hub employs a **Tactile Retro-Comic Light Theme** inspired by classic RPGs and graphic novels:
1. **Physical & Tactile**: Elements feel like printed cards, badges, and tangible tokens. Solid dark ink borders (`border-2 border-zinc-950`) and hard-edge drop shadows (`shadow-[2.5px_2.5px_0px_#18181b]`) replace soft blur shadows.
2. **Interactive Feedback**: Interactive elements physically depress on active click (`translate(1.5px, 1.5px)` with shadow reset) giving instantaneous, satisfying user feedback.
3. **High Contrast & Clarity**: Clean light parchment/warm paper background (`#faf9f6`) paired with deep ink typography (`#18181b` / `#09090b`) ensures optimal legibility in all lighting conditions.
4. **Minimalist & Purposeful**: Visual effects and icons must directly support task completion. No decorative animations or redundant icons that clutter the screen.
5. **Universal Responsiveness**: Every single page, modal, and drawer must function without horizontal scroll or truncated critical data from 320px mobile up to 4K ultra-wide screens.

---

## 2. Color Palette & Theme Tokens

All color tokens are configured in `src/index.css` under the `@theme` block:

### Primary Brand (Legend Army Crimson)
| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `brand-50` | `#fef2f2` | Subtle tint backgrounds & badge fills |
| `brand-100` | `#fee2e2` | Hover tints, soft alert banners |
| `brand-500` | `#ef4444` | High-attention accents, danger indicators |
| `brand-600` | `#dc2626` | Primary action buttons & active indicators |
| `brand-700` | `#b91c1c` | Brand accent text, focused borders, hero headers |
| `brand-900` | `#7f1d1d` | Deep crimson headings & dark badges |
| `brand-950` | `#450a0a` | Deepest brand ink |

### Surfaces & Backgrounds
| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| **Canvas** | `#faf9f6` | Application body background (warm off-white) |
| **Surface Pure** | `#ffffff` | Card containers, modal bodies, table rows, inputs |
| **Surface Warm** | `#fcfbf9` | Subtle panel backgrounds, table header rows |
| **Surface Muted** | `#f4f4f5` | Secondary card fills, inactive tab buttons |

### Ink & Content Colors
| Token | Tailwind Class | Usage |
| :--- | :--- | :--- |
| **Ink Strong** | `text-zinc-950` / `#09090b` | Headings, titles, high-emphasis text, primary icons |
| **Ink Default** | `text-zinc-900` / `#18181b` | Body text, labels, table cells, form values |
| **Ink Muted** | `text-zinc-600` / `#52525b` | Secondary descriptions, subheadings, meta info |
| **Ink Subtle** | `text-zinc-400` / `#a1a1aa` | Placeholders, disabled states, timestamps |

### Functional Status Colors
| Status | Accent Color | Badge / Pill Style |
| :--- | :--- | :--- |
| **Success / Approved / Active** | Emerald (`#059669` / `#10b981`) | `bg-emerald-50 text-emerald-800 border-emerald-950` |
| **Warning / Pending / Auction** | Amber (`#d97706` / `#f59e0b`) | `bg-amber-50 text-amber-900 border-amber-950` |
| **Danger / Rejected / Live** | Crimson (`#dc2626` / `#b91c1c`) | `bg-red-50 text-red-800 border-red-950` |
| **Neutral / Inactive / Draft** | Zinc (`#71717a` / `#52525b`) | `bg-zinc-100 text-zinc-700 border-zinc-950` |
| **Intel / Strategy** | Sky (`#0284c7` / `#38bdf8`) | `bg-sky-50 text-sky-800 border-sky-950` |

---

## 3. Typography & Text Hierarchy

Typography is loaded via Google Fonts in `src/index.css`:
- **Default Sans**: `font-sans` (`Inter`, system-ui). Used for 95% of the UI (all body text, forms, tables, modals, and readable headings).
- **Monospace**: `font-mono` (`JetBrains Mono`). Reserved for numerical stats, timestamps, gear scores, serial IDs, and code snippets.
- **Retro Pixel**: `font-pixel` (`Pixelify Sans`). **Strictly reserved** for small retro branding labels (e.g. `LEGEND ARMY`, `ARENA BID`, `VALKYRIE CUP`), hero badges, and slot ranks (`#1`). Never use for multi-line copy or general UI controls.

### Hierarchy Scale
| Level | Font & Weight | Size & Tracking | Leading |
| :--- | :--- | :--- | :--- |
| **Page Display** | `font-sans font-extrabold` | `text-2xl sm:text-3xl lg:text-4xl tracking-tight` | `leading-tight` |
| **Section Title** | `font-sans font-bold` | `text-xl sm:text-2xl tracking-tight` | `leading-snug` |
| **Card Header** | `font-sans font-bold` | `text-lg sm:text-xl` | `leading-normal` |
| **Subheading** | `font-sans font-semibold` | `text-sm sm:text-base` | `leading-normal` |
| **Body Text** | `font-sans font-medium` | `text-sm sm:text-base` | `leading-relaxed` |
| **Caption / Meta** | `font-sans font-medium` | `text-xs text-zinc-500` | `leading-normal` |
| **Mono Stats** | `font-mono font-bold` | `text-xs sm:text-sm tracking-wide` | `leading-none` |

---

## 4. Spacing, Sizing & Layout

- **Base Spacing**: Follows Tailwind's 4px unit (`p-2` = 8px, `p-4` = 16px, `p-6` = 24px, `p-8` = 32px).
- **Page Containers**:
  - Global pages: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
  - Focused forms/details: `max-w-4xl mx-auto px-4 sm:px-6`.
  - Auth/single action: `max-w-md mx-auto px-4`.
- **Vertical Rhythm**:
  - Between page header and content: `mb-6 sm:mb-8`.
  - Between content cards/sections: `space-y-6` or `gap-6`.
  - Card internal padding: `p-4 sm:p-6`.
- **Minimum Touch Targets**: All interactive buttons, chips, and links must have a minimum clickable area of 40x40px (`min-h-[40px]`).

---

## 5. Responsive Breakpoints & Mobile Rules

| Breakpoint | Width | Guidelines |
| :--- | :--- | :--- |
| **Mobile (`< 640px`)** | 320px – 639px | Single column grids (`grid-cols-1`). Bottom drawers or full-width modals. Horizontal filter bars use scrollable chips (`no-scrollbar overflow-x-auto flex-nowrap`). |
| **Tablet (`sm / md`)** | 640px – 1023px | 2-column grids (`sm:grid-cols-2`). Sidebar navigation collapses to slide-over drawer triggered by hamburger button. |
| **Desktop (`lg+`)** | 1024px+ | Persistent sidebar in admin layout. Multi-column grids (3–4 columns). Tables display full columns. |

### Critical Mobile Requirements:
1. **No Horizontal Page Overflow**: Never allow fixed pixel widths on parent containers (`w-[800px]`). Always use `w-full max-w-...`.
2. **Responsive Tables**: Every `<Table>` must be wrapped in `<div className="overflow-x-auto -mx-4 sm:mx-0">` with `min-w-[600px]` on the table element so mobile users can swipe cleanly.
3. **Stacked Actions on Mobile**: Action bars with multiple buttons must use `flex-col sm:flex-row` so buttons expand full-width on mobile rather than shrinking to illegible sizes.

---

## 6. Buttons & Form Components

All inputs and buttons must share the signature tactile styling:

### Button Variants (`src/components/ui/Button.jsx`)
- **Primary**: `bg-red-600 hover:bg-red-700 text-white border-2 border-zinc-950 shadow-[2px_2px_0px_#18181b] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none`.
- **Secondary**: `bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-2 border-zinc-950 shadow-[2px_2px_0px_#18181b]`.
- **Outline**: `bg-white hover:bg-zinc-50 text-zinc-900 border-2 border-zinc-950 shadow-[2px_2px_0px_#18181b]`.
- **Danger**: `bg-red-700 hover:bg-red-800 text-white border-2 border-zinc-950 shadow-[2px_2px_0px_#18181b]`.
- **Ghost**: `bg-transparent hover:bg-zinc-100 text-zinc-700 border-transparent shadow-none`.

### Form Fields (`Input`, `Select`, `Textarea`)
- **Appearance**: `bg-white border-2 border-zinc-950 rounded-lg shadow-[2px_2px_0px_#18181b] text-zinc-900 placeholder:text-zinc-400 font-medium px-3.5 py-2.5 text-sm`.
- **Focus State**: `focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-zinc-950`.
- **Error State**: `border-red-600 focus:ring-red-500` with an error message in `text-xs text-red-600 font-semibold mt-1`.
- **Labels**: Always uppercase, bold, compact: `text-xs font-bold text-zinc-800 uppercase tracking-wider block mb-1.5`.

---

## 7. Cards, Tables, Modals & Navigation

### Cards (`src/components/ui/Card.jsx`)
- **Container**: `bg-white border-2 border-zinc-950 rounded-xl shadow-[2.5px_2.5px_0px_#18181b] p-4 sm:p-6 overflow-hidden`.
- **Hoverable Cards**: When a card is a clickable item (e.g., auction item cards, team cards), add `transition-transform hover:-translate-y-0.5 hover:shadow-[3.5px_3.5px_0px_#18181b] cursor-pointer`.

### Tables (`src/components/ui/Table.jsx`)
- **Header**: `bg-zinc-50 text-zinc-900 font-bold uppercase text-xs tracking-wider border-b-2 border-zinc-950 py-3 px-4`.
- **Rows**: Alternating subtle striping or clean white rows with `border-b border-zinc-200 hover:bg-zinc-50/80 transition-colors`.
- **Cells**: `py-3 px-4 text-sm font-medium text-zinc-800 align-middle`.

### Modals (`src/components/ui/Modal.jsx`)
- **Backdrop**: `fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto`.
- **Dialog Box**: `bg-white border-2 border-zinc-950 rounded-2xl shadow-[4px_4px_0px_#18181b] w-full max-h-[90vh] flex flex-col`.
- **Header**: Clear title, short description, and dedicated close `X` button with `aria-label="Close dialog"`.
- **Scrollable Body**: `p-4 sm:p-6 overflow-y-auto`.
- **Footer**: `p-4 sm:p-6 border-t-2 border-zinc-950 bg-zinc-50 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5`.

### Navigation
- **Public Header**: Clean top banner with brand logo, nav links (`Dashboard`, `Guild League`, `Valkyrie Cup`, `Auction Arena`), and an action button (`Sign In` or `Admin Portal`).
- **Admin Shell**: Desktop persistent left sidebar (260px width) with grouped navigation; mobile top bar with a hamburger toggle opening a tactile slide-out drawer.

---

## 8. Icon Usage Rules

1. **Functional Only**: Use icons exclusively when they speed up cognitive recognition (e.g. search magnifying glass in search input, trash icon on delete actions, checkmark on approval).
2. **No Decorative Clutter**: Do not place icons next to every plain label or card header where the text is already completely self-explanatory.
3. **Consistent Library**: Use `lucide-react` across all files.
4. **Standard Sizing**:
   - Inline with text / buttons: `h-4 w-4` (16px).
   - Card headers / navigation items: `h-5 w-5` (20px).
   - Hero / empty states: `h-8 w-8` to `h-10 w-10`.
5. **Standard Stroke**: Keep default Lucide `strokeWidth={2}` for crisp comic alignment.
6. **Accessibility**: Every icon button without visible text must have an `aria-label` or `title` describing the action (e.g. `aria-label="Close modal"`).

---

## 9. Loading, Empty, Error & Success States

### Loading States
- **Page Transitions**: Render `<Loading fullScreen message="Loading..." />` or skeletal placeholders with pulse animation.
- **Button Loading**: Disable button and show an inline spinner `animate-spin h-4 w-4` alongside concise text (e.g., `Saving...`, `Submitting...`).

### Empty States (`src/components/ui/EmptyState.jsx`)
- Every table, search filter, and queue must provide a friendly empty state when 0 records match.
- Must include:
  1. A minimal functional icon or retro illustration.
  2. A clear title: e.g. "No items found".
  3. A helpful description explaining why it's empty and how to proceed.
  4. An optional primary action button (e.g. "Clear Filters", "Register New Item").

### Toast Notifications (`src/components/ui/ToastProvider.jsx`)
- **Success**: Emerald pill with checkmark icon and affirmative message (e.g. "Bid submitted successfully").
- **Error**: Crimson pill with alert icon and actionable error reason.
- **Info**: Amber/Sky pill for status alerts.
- **Duration**: Auto-dismiss after 4000ms with manual close option.

---

## 10. English Language & Content Guidelines

**100% of all user-facing copy must be in clear, natural, professional English.**

### Standard Terminology Dictionary
| Concept | Approved English Term | Disallowed / Legacy Terms |
| :--- | :--- | :--- |
| Lelang / Bidding | **Auction / Arena Bid** | Lelang, Pelelangan |
| Antrian Bidding | **Bidding Queue** | Antrian, Daftar Antri |
| Daftar Antrian | **Join Queue / Register Bid** | Daftar Bid, Ikut Lelang |
| Pemenang Lelang | **Auction Winners** | Pemenang, Juara |
| Peraturan | **Rules & Guidelines** | Peraturan, Ketentuan |
| Tambah / Simpan | **Add / Save / Submit** | Tambah, Simpan, Kirim |
| Batal | **Cancel** | Batal, Tutup |
| Hapus | **Delete / Remove** | Hapus, Buang |
| Status: Menunggu | **Pending Review** | Menunggu, Pending |
| Status: Disetujui | **Approved / Active** | Disetujui, Diterima |
| Status: Ditolak | **Rejected** | Ditolak |
| Kehadiran | **Attendance** | Kehadiran, Absensi |
| Strategi | **Strategy / Tactical Plan** | Strategi, Rencana |
| Pengguna / Anggota | **Members / Users** | Pengguna, Anggota |

### Capitalization & Voice
- **Buttons & Navigation Links**: Use **Title Case** (e.g. `Join Queue`, `Add Member`, `Export Roster`, `Save Changes`).
- **Form Field Labels**: Use **Title Case** or **UPPERCASE** for compact badges (e.g. `CHARACTER NAME (IGN)`, `DISCORD TAG`, `ITEM CATEGORY`).
- **Descriptions & Hints**: Use standard sentence case (e.g. `Enter your exact in-game character name to receive queue notifications.`).
- **Tone**: Direct, concise, confident, and professional. Avoid robotic or machine-translated phrasing.

---

## 11. Accessibility Standards (WCAG 2.1 AA)

1. **Color Contrast**: All text must achieve at least 4.5:1 contrast against its background. Deep zinc `#18181b` on white/off-white achieves ~15:1.
2. **Keyboard Navigation**:
   - All interactive controls (`<button>`, `<a>`, `<input>`, `<select>`) must be focusable via `Tab`.
   - Modals must trap focus while open and close on `Escape`.
   - Focus rings: visible 2px outline on `:focus-visible`.
3. **Form Accessibility**:
   - Every input has an associated `<label>` using `htmlFor` or direct wrapping.
   - Required fields are clearly indicated with an asterisk `*` and `aria-required="true"`.
4. **Semantics**:
   - Exactly one `<h1>` per page.
   - Use semantic `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<table>`, `<article>`.

---

## 12. Reusable Component Conventions

All shared components reside in `src/components/ui/`:

| Component | File | Core Props |
| :--- | :--- | :--- |
| `<Button>` | `Button.jsx` | `variant` (`primary`\|`secondary`\|`outline`\|`danger`\|`ghost`), `size` (`sm`\|`md`\|`lg`), `loading`, `disabled`, `children` |
| `<Card>` | `Card.jsx` | `title`, `description`, `headerAction`, `children`, `footer`, `className` |
| `<Modal>` | `Modal.jsx` | `open` / `isOpen`, `onClose`, `title`, `description`, `children`, `footer`, `size` (`sm`\|`md`\|`lg`\|`xl`\|`full`) |
| `<Badge>` | `Badge.jsx` | `variant` (`brand`\|`success`\|`warning`\|`danger`\|`neutral`\|`sky`), `size` (`sm`\|`md`), `children` |
| `<Input>` | `Input.jsx` | `label`, `error`, `helperText`, `icon`, `disabled`, ...native input props |
| `<Select>` | `Select.jsx` | `label`, `error`, `options`, `value`, `onChange`, ...native select props |
| `<Table>` | `Table.jsx` | Structured table wrapper with responsive overflow |
| `<Tabs>` | `Tabs.jsx` | Tab list with tactile active indicator |
| `<EmptyState>` | `EmptyState.jsx` | `icon`, `title`, `description`, `action` |
| `<Loading>` | `Loading.jsx` | `fullScreen`, `message`, `size` |

*When creating or updating pages, ALWAYS import from `@/components/ui/` instead of writing custom one-off inline buttons, modals, or inputs.*
