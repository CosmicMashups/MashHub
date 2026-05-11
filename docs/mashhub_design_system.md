# MashHub — Front-End Design System Documentation

## 1. Project Overview

*   **Description:** Intelligent music library management tool for discovering harmonically compatible songs, section-based matching, and project organization.
*   **Primary Purpose:** Empower DJs, producers, and mashup creators to build seamless mixes using advanced harmonic logic and fuzzy search.
*   **Platform:** Web Application (React / Vite) with PWA support.
*   **Target Users:** DJs, music producers, mashup artists, and audiophiles.

---

## 2. Design Philosophy

*   **Overall Design Intent:** Data-dense but vibrant. It balances professional utility (complex filtering, Kanban organization) with the energetic aesthetic of the music industry.
*   **Emotional Tone:** Energetic, creative, futuristic, yet structured and clinical when handling detailed song metadata.
*   **UX Priorities:** High-speed interaction (fuzzy search, quick match), clarity of complex data (BPM, key matching), workflow fluidity (drag-and-drop Kanban, timelines), and visual feedback for harmonic compatibility.

---

## 3. Color System

### Primary Colors (Dark Theme Focus)

*   **Background Primary:** `#000b26` (Deep Navy/Black)
*   **Background Secondary:** `#0a1633`
*   **Surface Base:** `#121a3a`
*   **Surface Elevated:** `#18244a`
*   **Primary Accent:** `#4da6ff` (Bright Blue)
*   **Secondary Accent:** `rgba(77, 166, 255, 0.2)`

### Functional Colors

*   **Success:** `#4cc88f`
*   **Warning:** `#f4be5c`
*   **Error / Danger:** `#f48787`
*   **Info:** `#8bc8ff`

### Music-Specific Colors (Vibrant Palette)

*   **Electric:** `#8b5cf6` (Purple)
*   **Neon:** `#06ffa5` (Bright Green)
*   **Cosmic:** `#6366f1` (Indigo)
*   **Sonic:** `#f59e0b` (Amber)
*   **Pulse:** `#ef4444` (Red)
*   **Wave:** `#06b6d4` (Cyan)
*   **Beat:** `#84cc16` (Lime)
*   **Rhythm:** `#f97316` (Orange)

### Text Colors

*   **Primary Text:** `#e6f0ff`
*   **Secondary Text:** `#a8beda`
*   **Muted Text:** `#7d91b0`
*   **Inverse Text:** `#05101f`

### Color Adaptation Strategy

*   **Portfolio Integration:** The primary deep navy background (`#000b26`) should blend smoothly into the global portfolio dark theme (`#0A0F1E`).
*   **Accent Usage:** The vibrant "Music-Specific" palette should be preserved as accents, replacing the global portfolio's default green (`#22C55E`) specifically within the MashHub showcase to maintain its energetic, musical identity. Gradients (e.g., Electric to Cosmic) should be used for primary calls to action.

---

## 4. Typography

*   **Font Style:** Modern, clean, and highly legible for data-heavy interfaces.
*   **Primary Font (Sans-serif):** `Inter`, system-ui, sans-serif
*   **Monospace Font (Data/Code):** `JetBrains Mono`, Fira Code, monospace
*   **Heading Hierarchy:** Strong, bold weights (600-800) for section titles, dropping to standard weights for nested data.
*   **Body Text Style:** Clean and legible (400-500) with careful attention to line height for dense tables and lists.
*   **Emphasis Usage:** Text gradients (`bg-gradient-to-r from-primary-600 to-accent-purple-600`) are used for key branding and emphasis, alongside subtle text shadows for readability over gradient backgrounds.

---

## 5. Layout System

*   **Page Structure:** Dashboard-style application with a multi-panel layout. Features a persistent top/side navigation, a main workspace area (Kanban or Timeline), and contextual sidebars/drawers (Advanced Filters, Search Suggestions).
*   **Grid System:** Standard Tailwind 12-column grid, heavily utilizing Flexbox and CSS Grid for complex card layouts and Kanban boards.
*   **Spacing Philosophy:** Generous padding within cards (`p-4` to `p-6`) to separate dense data, with tighter spacing (`gap-2` to `gap-4`) between related metadata items (tags, badges).
*   **Section Hierarchy:** High use of elevated surfaces and modal overlays (`z-50` to `z-70`) to manage focus during complex tasks like filtering or matching.

---

## 6. Core UI Components

*   **Cards (Song & Project):**
    *   *Purpose:* Display song metadata, album art, and harmonic data.
    *   *Visual Style:* Elevated surface (`var(--theme-surface-base)`), border, and subtle shadow (`shadow-card`). "Song card readability" applies text shadows for text overlaid on gradients.
    *   *Interaction:* `card-interactive` features a hover lift (`scale-[1.015]`, `-translate-y-0.5`) and cursor pointer.
*   **Gradient Buttons (`btn-music-*`):**
    *   *Purpose:* High-emphasis actions (e.g., Quick Match, Add to Project).
    *   *Visual Style:* Vibrant gradients (e.g., `from-music-electric to-music-cosmic`), bold text, rounded-xl.
    *   *Interaction:* Scale on hover (`scale-105`), scale down on active (`scale-95`), and dynamic glow shadows (`hover:shadow-glow-purple`).
*   **Advanced Filter Panels & Drawers:**
    *   *Purpose:* Complex query building (BPM ranges, Key distances, Part-specific rules).
    *   *Visual Style:* Glassmorphism overlays (`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm`), layered above the main content.
*   **Kanban Board (Project Workspace):**
    *   *Purpose:* Organize songs into sets or sections.
    *   *Visual Style:* Segmented columns with clear headers and drag-and-drop targets.
*   **Badges & Tags:**
    *   *Purpose:* Indicate BPM, Key, Year, and Status (Vocal, Instrumental).
    *   *Visual Style:* Pill-shaped, tinted backgrounds (10-30% opacity of the accent color) with solid text. Status indicators use specific borders and text colors (e.g., `status-vocal` uses `music-beat`).
*   **Adaptation Strategy:** MashHub's glass panels and interactive cards will translate well to the portfolio's standard card components, but the unique music-glow shadows and vibrant button gradients must be ported over to maintain the identity.

---

## 7. Data Visualization

*   **Types of Charts Used:** Recharts for BPM flow graphs (`BpmFlowGraph.tsx`) and Key harmonic mapping (`KeyGraph.tsx`).
*   **Visual Encoding:**
    *   *Color:* Represents harmonic compatibility (Green = Perfect Match, Yellow = Close, Red = Clashing).
    *   *Position:* Y-axis for BPM, X-axis for Time/Sequence in a mix.
*   **Interaction Patterns:** Hover tooltips showing exact BPM/Key details, drill-down to specific song sections.

---

## 8. Interaction Design

*   **Hover States:** "Hover Lift" is heavily utilized (`hover:-translate-y-1 hover:scale-[1.015]`) on interactive elements to make the interface feel alive and responsive. Elements glow on hover using custom shadow variables (`music-glow`, `music-glow-neon`).
*   **Click Behavior:** "Active Shrink" (`active:scale-[0.985]`) on buttons to provide tactile feedback.
*   **Feedback Systems:** Loading states use professional, branded animations (pulsing dots, gradient shimmers `loading-shimmer`).
*   **Transitions:** Smooth, standard 200ms-300ms transitions for colors, transforms, and opacities (`transition-all duration-300`).

---

## 9. Motion & Animation

*   **Animation Style:** Dynamic, fluid, and music-inspired.
*   **Use of Transitions:** Elements enter the screen with `fade-in-up`, `slide-up`, or `slide-down`.
*   **Microinteractions:**
    *   `animate-spin-slow` (for record/disc visuals).
    *   `animate-pulse-soft` and `animate-bounce-gentle` for active matching states or live audio playback cues.
    *   Gradient shimmers across loading skeletons.

---

## 10. Theming Strategy for Portfolio Integration

To integrate MashHub into the global portfolio theme while preserving its identity:

### Must Preserve
*   **Vibrant Music Accents:** The custom gradients (Electric, Neon, Cosmic) and the `music-glow` shadows are essential to the project's identity.
*   **Hover Lift & Active Shrink Interactions:** The specific `scale-[1.015]` and tactile button presses define the energetic feel.
*   **Status Indicators:** The specific logic for Vocal/Instrumental/Both badges must remain visually distinct.

### Can Adapt
*   **Background Colors:** The base dark blue (`#000b26`) can be shifted to the portfolio's global dark background (`#0A0F1E`) seamlessly.
*   **Typography:** While `Inter` and `JetBrains Mono` are specified, they can adapt to the portfolio's modern sans-serif and monospace stack without breaking the layout.

### Must Conform
*   **Spacing and Grid:** Standardize the 12-column layout and padding tokens to match the portfolio's internal grid system.
*   **Modal Overlay Behavior:** The z-index and blur radius of the backdrop should conform to global modal standards.

---

## 11. Component Mapping to Portfolio System

*   `SongCard` → Portfolio Interactive Card Variant (with injected glowing hover state)
*   `btn-music-*` → Portfolio Primary Button (with custom gradient and shadow props)
*   `KanbanBoard` / `ProjectSection` → Portfolio Drag-and-Drop List Component
*   `FilterPanel` → Shared Sidebar / Drawer Component
*   `BpmFlowGraph` → Portfolio Data Visualization Wrapper (Recharts integration)
*   `badge-*` → Portfolio Pill/Tag Component (with custom color mapped tokens)

---

## 12. Visual Identity Summary

MashHub stands out visually due to its **"Neon Professionalism."** It takes a highly complex, data-heavy domain (harmonic music data, BPM mapping, multi-parameter filtering) and presents it through the lens of a modern DJ software interface. 

Its key traits are the use of deep, dark backgrounds pierced by **vibrant, energetic gradients**, and highly tactile micro-interactions (hover lifts, active scales, soft glows). In the context of a broader portfolio, MashHub contributes a dynamic, application-focused energy that contrasts well against more clinical or minimal projects, demonstrating an ability to balance dense UX requirements with a highly stylized, themed UI.
