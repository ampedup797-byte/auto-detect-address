# Shopify COD Order Creator - Design Guidelines

## Design Approach

**Selected Approach:** Design System - Material Design  
**Justification:** This is a utility-focused business tool requiring efficiency, clarity, and trust. Material Design provides the structure, feedback patterns, and professional aesthetic needed for order creation workflows.

**Key Design Principles:**
1. Form-First Design: Prioritize clear, efficient data entry
2. Trust Through Clarity: Clean layouts that inspire confidence in order creation
3. Immediate Feedback: Clear success/error states for every action
4. Professional Utility: Business-focused without unnecessary decoration

---

## Core Design Elements

### A. Typography

**Font Family:** 
- Primary: 'Inter' or 'Roboto' (Google Fonts via CDN)
- Monospace: 'Roboto Mono' for order IDs and technical data

**Hierarchy:**
- H1 (Page Title): text-3xl font-semibold (36px)
- H2 (Section Headers): text-xl font-medium (24px)
- Body (Form Labels): text-sm font-medium (14px)
- Input Text: text-base (16px)
- Helper Text: text-sm text-gray-600 (14px)
- Order ID Display: text-lg font-mono (18px)

### B. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8
- Form field spacing: space-y-6
- Section padding: p-6 or p-8
- Input padding: p-3
- Button padding: px-6 py-3
- Card spacing: gap-4

**Container Structure:**
- Max width: max-w-2xl (672px) - optimal for form readability
- Centered layout: mx-auto
- Vertical padding: py-12
- Horizontal padding: px-4 (responsive)

---

## C. Component Library

### 1. Core Layout Components

**Header:**
- Clean, minimal top bar
- Application name with Shopify logo/icon (using Heroicons storefront icon)
- Subtitle: "Cash on Delivery Order Creator"
- Height: py-4 with bottom border

**Main Form Container:**
- White card with subtle shadow (shadow-lg)
- Rounded corners: rounded-xl
- Padding: p-8
- Background: white on light gray page (bg-gray-50)

**Footer:**
- Simple, minimal
- API status indicator
- Powered by badge/text
- Padding: py-6

### 2. Form Elements

**Input Fields (Standard Pattern for All):**
- Label: Block display, font-medium, mb-2
- Input: Full width, border (border-gray-300), rounded-md, p-3
- Focus state: ring-2 (using accent color)
- Error state: border-red-500 with error message below
- Placeholder text for format hints

**Required Fields (All form fields):**
- Name (Full Name)
- Phone (with country code hint: +91)
- Email
- Address (Street Address)
- City
- State (Dropdown with Indian states)
- Pincode (6 digits)

**Input Groups:**
- Group related fields visually with space-y-6
- City/State/Pincode in responsive grid (grid-cols-1 md:grid-cols-3 gap-4)

**State Dropdown:**
- Select element styled to match text inputs
- Includes all Indian states alphabetically
- Placeholder: "Select State"

### 3. Action Components

**Primary CTA Button:**
- Text: "Create COD Order"
- Full width on mobile, auto width on desktop
- Large touch target: px-8 py-4
- Icon: Heroicons shopping-bag icon
- Loading state: spinner icon + "Creating Order..."
- Positioned at bottom of form

**Success Display:**
- Green background card (bg-green-50 border-green-200)
- Success icon (Heroicons check-circle)
- Order ID prominently displayed in monospace font
- "View in Shopify" link button
- "Create Another Order" secondary button

**Error Display:**
- Red background alert (bg-red-50 border-red-200)
- Error icon (Heroicons exclamation-triangle)
- Clear error message
- Retry mechanism

### 4. Status & Feedback

**Form Validation:**
- Real-time validation on blur
- Clear error messages below each field
- Red border + error text for invalid fields
- Green checkmark icon for valid fields (optional)

**Loading State:**
- Disabled form during submission
- Loading spinner on submit button
- Overlay with semi-transparent background
- "Please wait..." message

**Empty State (Initial Load):**
- Centered form ready for input
- Brief instruction text above form: "Fill in customer details to create a COD order in Shopify"

---

## D. Animations

**Minimal, Purposeful Only:**
- Form submission: Gentle fade transition to success/error state
- Button loading: Smooth spinner rotation
- NO scroll animations, parallax, or decorative effects
- Focus: Smooth ring appearance (transition-all duration-200)

---

## Layout Specifications

### Page Structure

```
┌─────────────────────────────────┐
│         Header (Fixed)          │ py-4 border-b
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │   Form Title & Subtitle   │  │ mb-8
│  ├───────────────────────────┤  │
│  │                           │  │
│  │   Name Input              │  │
│  │   Phone Input             │  │
│  │   Email Input             │  │
│  │   Address Input           │  │
│  │   City | State | Pincode  │  │ 3-column grid
│  │                           │  │
│  │   [Create COD Order]      │  │ mt-8
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  (Success/Error State Here)     │ mt-6
│                                 │
└─────────────────────────────────┘
│           Footer                │ py-6
└─────────────────────────────────┘
```

### Responsive Behavior

**Mobile (< 768px):**
- Single column layout
- Full-width form
- Stacked city/state/pincode fields
- Padding: px-4

**Tablet/Desktop (≥ 768px):**
- Centered form container (max-w-2xl)
- 3-column grid for location fields
- Increased padding: px-6 to px-8

---

## Images

**No Hero Image Required** - This is a functional business tool, not a marketing page.

**Icon Usage:**
- Shopify icon/logo in header (via Heroicons: storefront)
- Form field icons: phone, envelope, map-pin, etc. (subtle, left-aligned in inputs or as labels)
- Status icons: check-circle (success), exclamation-triangle (error)
- Loading spinner during submission

All icons from **Heroicons** via CDN (outline style, 20px for inline, 24px for standalone).

---

## Color Guidance (For Later Implementation)

- Primary action color: Trust-building (Shopify green or professional blue)
- Background: Light, clean (white on subtle gray)
- Success: Green tones
- Error: Red tones
- Borders: Neutral grays
- Text: High contrast dark on light

---

## Final Notes

This design prioritizes **efficiency and trust** - users should feel confident creating orders quickly. The interface is clean, uncluttered, and focused entirely on the task at hand. Every element serves a functional purpose with no decorative distractions.