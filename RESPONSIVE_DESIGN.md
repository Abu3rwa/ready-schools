# Responsive Design Guide for TeacherKit

This document outlines the strategy for improving the responsive design of the TeacherKit application, focusing on the `Dashboard.js` and `Header.jsx` components. The primary goal is to ensure a seamless experience on mobile devices and Chromebooks.

## Table of Contents
1.  [General Principles](#general-principles)
2.  [Header Component (`Header.jsx`)](#header-component-headerjsx)
3.  [Dashboard Component (`Dashboard.js`)](#dashboard-component-dashboardjs)
4.  [Implementation Plan](#implementation-plan)

## General Principles

*   **Mobile-First Approach:** Design for smaller screens first, then scale up.
*   **Material-UI Breakpoints:** Utilize MUI's breakpoint system (`xs`, `sm`, `md`, `lg`, `xl`) for consistent styling.
*   **Flexible Layouts:** Use `Grid` and `Box` components with flexible properties.
*   **Readability:** Ensure text is legible and touch targets are large enough on all devices.

## Header Component (`Header.jsx`)

The header should adapt to smaller screens by hiding less critical items and providing access to them through a menu.

### Current State
The header has several icons and buttons that may cause crowding on small screens.

### Proposed Changes
-   **Collapse Icons:** On smaller screens (`xs` and `sm`), collapse the `Notifications`, `Settings`, and `Help` icons into a single "more" menu.
-   **Functional Icons:** Ensure all icons in the header are functional.
    -   The `Settings` icon should navigate to the `/settings` page.
    -   The `Notifications` and `Help` icons should either be implemented or removed. For now, the plan is to implement placeholders.
-   **Language Selector:** The language selector buttons can be made smaller or moved into the user menu on very small screens.
-   **Typography:** Adjust the `AppName` typography to be slightly smaller on mobile.

## Dashboard Component (`Dashboard.js`)

The dashboard contains many data visualizations and cards that need to be stacked and resized appropriately on smaller screens.

### Current State
The dashboard already uses `Grid` and some responsive `sx` props, but it can be optimized further.

### Proposed Changes
-   **Quick Stats:** The quick stats cards should stack vertically on `xs` screens.
-   **Charts:**
    -   The chart containers should have a minimum height to prevent them from becoming too small.
    -   The font size for chart labels and legends should be reduced on smaller screens.
-   **Card Layout:** The main dashboard cards should stack vertically on `xs` and `sm` screens to ensure a clear, single-column layout.
-   **Typography:** Adjust header font sizes for better readability on smaller screens.
-   **Padding:** Use responsive padding on the main container to give more space on smaller devices.

## Implementation Plan

1.  **[ ] Analyze `Header.jsx` and identify components to collapse or make functional.**
2.  **[ ] Implement navigation for the `Settings` icon in `Header.jsx` to go to the `/settings` page.**
3.  **[ ] Add placeholder functionality for `Notifications` and `Help` icons.**
4.  **[ ] Implement a "more" menu in `Header.jsx` for smaller screens to house less-critical icons.**
5.  **[ ] Analyze `Dashboard.js` for layout and component stacking.**
6.  **[ ] Adjust `Grid` item props in `Dashboard.js` for better stacking on `xs` and `sm` screens.**
7.  **[ ] Implement responsive font sizes for charts and typography in `Dashboard.js`.**
8.  **[ ] Test the changes on various screen sizes using browser developer tools.**
9.  **[ ] Review and refine the responsive behavior.**