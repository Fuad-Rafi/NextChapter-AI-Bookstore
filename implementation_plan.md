# UI Redesign & Architecture Evolution Plan

This plan follows your requests to make the platform more dynamic, detach the RAG system into a focused Assistant page, implement a central carousel, redesign navigation for roles, and introduce Dark Mode.

## User Review Required

> [!WARNING]
> COMPONENT EXTRACTION: Taking the chat system completely out of the Customer home page (`/`) means the RAG logic (and Book Recommendations logic) will move to a distinct `/assistant` route. This will change the flow of how customers interact with the AI.

## Proposed Changes

### 1. Unified Navigation Bar & Dark Mode Support
Currently, navigation is embedded individually in pages. I will construct a global `Navbar` component (or implement it cleanly in the Next.js layouts) that checks the `useAuth` role.

#### Features
- **Dark Mode Switch**: A toggle on the right side of the navbar switching Tailwind CSS theme classes (`dark`), shifting backgrounds to deep charcoal/navy instead of white, with adapted glassmorphism borders.
- **Customer Nav**: 
  - Left: `Home`, `Smart Assistant`, `My Orders`, `About Us` (Placeholder)
  - Right: `Dark Mode Switch`, `Logout`
- **Admin Nav**: 
  - Left: `Home`, `Order Dashboard`, `Add Book`
  - Right: `Dark Mode Switch`, `Logout`

### 2. Chat System Extraction
#### [NEW] `frontend/src/app/assistant/page.jsx`
- I will move all the chat hooks, API logic, and message state from `CustomerHome` into this new, focused interface. It will contain the chat input, recommendation grid with likes/dislikes, and a nice fullscreen aesthetic.

### 3. Hero Section & Book Slideshow Redesign
#### [MODIFY] `frontend/src/app/page.jsx`
- Replace the current grid layout and right-sided chat bar with a full-width **Carousel / Slide Show**.
- A prominent Hero header matching your uploaded image template.
- The carousel will display book covers with snapping physics, keeping the middle book prominent.
- Expand the blob-animation colors in `layout.jsx` to be "more colorful" (injecting more vibrant cyans, purples, and amber).

## Open Questions

1. Do you want the "Slideshow of Books" to automatically scroll (autoplay) or just respond to manual clicking/swiping arrows?
2. Do you have a preferred third-party carousel library (like `swiper` or `react-slick`), or should I build a custom, lightweight CSS-driven carousel?

## Verification Plan
1. **Routing**: Verify `Smart Assistant` from Navbar accurately loads the RAG feature.
2. **Access**: Check that admins see the "Order Dashboard" Link, whereas Customers see "My Orders" link.
3. **Theming**: Toggle the Dark Mode switch and verify that Glassmorphism panels shift to translucent blacks (`bg-black/40`) properly without breaking readability.
