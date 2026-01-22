# Design System Guide - Front-end-prod2

This document outlines the design language, patterns, and best practices for maintaining visual and functional consistency across the application.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Component Patterns](#component-patterns)
6. [Accessibility](#accessibility)
7. [Animation & Transitions](#animation--transitions)
8. [Code Patterns](#code-patterns)
9. [Best Practices](#best-practices)

---

## Technology Stack

### Core Technologies
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 with CSS Variables
- **UI Components**: shadcn/ui (built on Radix UI)
- **Theme Management**: next-themes
- **Icons**: Lucide React
- **Typography**: Geist Sans & Geist Mono (Google Fonts)

### Key Libraries
- `clsx` + `tailwind-merge` for class merging
- `class-variance-authority` for component variants
- `zod` for type validation
- `react-hook-form` for form handling

---

## Color System

### Color Format
Uses **OKLCH** color space for better perceptual uniformity and wide gamut support.

### Light Mode Palette

```css
--background: oklch(0.98 0 0)        /* Near white */
--foreground: oklch(0.12 0 0)         /* Near black */
--primary: oklch(0.55 0.18 200)       /* Blue-cyan */
--secondary: oklch(0.95 0 0)          /* Light gray */
--muted: oklch(0.95 0.01 200)         /* Light gray-blue */
--accent: oklch(0.55 0.18 200)        /* Same as primary */
--destructive: oklch(0.55 0.22 25)    /* Red */
--border: oklch(0.9 0 0)              /* Light border */
--card: oklch(1 0 0)                  /* Pure white */
```

### Dark Mode Palette

```css
--background: oklch(0.12 0.01 240)    /* Dark blue-gray */
--foreground: oklch(0.95 0 0)         /* Near white */
--primary: oklch(0.7 0.15 180)         /* Brighter blue-cyan */
--secondary: oklch(0.22 0.01 240)     /* Dark gray */
--muted: oklch(0.22 0.01 240)         /* Dark gray-blue */
--accent: oklch(0.7 0.15 180)         /* Same as primary */
--destructive: oklch(0.55 0.22 25)     /* Red */
--border: oklch(0.28 0.01 240)         /* Dark border */
--card: oklch(0.16 0.01 240)          /* Dark card */
```

### Semantic Colors

#### Status Colors
```css
--live-indicator: oklch(0.65 0.2 145)    /* Green - Active/Recording */
--processing: oklch(0.7 0.15 80)          /* Yellow - Processing */
```

#### Confidence Levels
```css
--confidence-high: oklch(0.65 0.2 145)   /* Green - High confidence */
--confidence-medium: oklch(0.7 0.15 80)   /* Yellow - Medium confidence */
--confidence-low: oklch(0.6 0.2 25)       /* Red - Low confidence */
```

#### Speaker Colors
```css
--speaker-1: oklch(0.55 0.18 200)  /* Blue */
--speaker-2: oklch(0.6 0.2 300)    /* Magenta */
--speaker-3: oklch(0.65 0.15 160)  /* Cyan */
--speaker-4: oklch(0.65 0.22 25)   /* Orange */
```

### Usage in Components

```tsx
// Use CSS variables via Tailwind
<div className="bg-background text-foreground">
<div className="bg-primary text-primary-foreground">
<div className="border border-border">
<div className="text-muted-foreground">
```

---

## Typography

### Font Families

- **Primary**: Geist Sans (`font-sans`)
- **Monospace**: Geist Mono (`font-mono`)
- **Serif**: System serif (`font-serif`) - rarely used

### Font Sizes

Use Tailwind's type scale:

```tsx
text-xs    // 0.75rem (12px)
text-sm    // 0.875rem (14px)
text-base  // 1rem (16px)
text-lg    // 1.125rem (18px)
text-xl    // 1.25rem (20px)
text-2xl   // 1.5rem (24px)
text-3xl   // 1.875rem (30px)
text-4xl   // 2.25rem (36px)
```

### Font Weights

```tsx
font-light     // 300
font-normal    // 400
font-medium    // 500
font-semibold  // 600
font-bold      // 700
```

### Letter Spacing

```tsx
tracking-tight   // -0.025em
tracking-normal  // 0em
tracking-wide    // 0.025em
tracking-wider   // 0.05em
```

### Line Heights

```tsx
leading-none    // 1
leading-tight   // 1.25
leading-snug    // 1.375
leading-normal  // 1.5
leading-relaxed // 1.625
leading-loose   // 2
```

### Example Typography Patterns

```tsx
// Headings
<h1 className="text-lg font-semibold tracking-tight">
<h2 className="text-sm font-semibold">

// Body text
<p className="text-base leading-normal">
<p className="text-sm text-muted-foreground">

// Monospace (timestamps, code)
<span className="font-mono text-3xl font-light tracking-wider">
```

---

## Spacing & Layout

### Border Radius

```css
--radius: 0.75rem (12px)  /* Base radius */

/* Derived sizes */
radius-sm: 8px   (calc(var(--radius) - 4px))
radius-md: 10px  (calc(var(--radius) - 2px))
radius-lg: 12px  (var(--radius))
radius-xl: 16px  (calc(var(--radius) + 4px))
```

Usage:
```tsx
rounded-lg      // 12px
rounded-xl      // 16px
rounded-full    // 9999px (for circles)
```

### Container Widths

```tsx
max-w-5xl  // 1024px - Main content container
max-w-4xl  // 896px - Caption display
max-w-2xl  // 672px - Narrow content
```

### Spacing Scale

Use Tailwind's spacing scale (4px base unit):

```tsx
gap-2   // 0.5rem (8px)
gap-4   // 1rem (16px)
gap-6   // 1.5rem (24px)
p-4     // 1rem (16px)
p-6     // 1.5rem (24px)
px-4    // 1rem horizontal
py-3    // 0.75rem vertical
```

### Common Layout Patterns

```tsx
// Centered container
<div className="mx-auto w-full max-w-5xl">

// Flex column with gap
<div className="flex flex-col gap-6">

// Flex row with gap
<div className="flex items-center gap-4">

// Grid layout
<div className="grid gap-2 md:grid-cols-2">
```

---

## Component Patterns

### Buttons

#### Primary Button
```tsx
<Button
  size="lg"
  onClick={handleClick}
  className="h-16 w-16 rounded-full focus-visible-ring"
  aria-label="Action description"
>
  <Icon className="h-7 w-7" aria-hidden="true" />
</Button>
```

#### Button Variants
```tsx
variant="default"      // Primary action
variant="outline"      // Secondary action
variant="ghost"        // Tertiary action
variant="destructive"  // Destructive action
```

#### Button Sizes
```tsx
size="sm"   // Small
size="default"  // Default
size="lg"   // Large
size="icon" // Icon-only (square)
```

### Cards & Panels

```tsx
<div className="rounded-xl border border-border bg-card">
  <div className="border-b border-border px-4 py-3">
    {/* Header */}
  </div>
  <div className="p-6">
    {/* Content */}
  </div>
</div>
```

### Status Indicators

```tsx
// Status dot with pulse
<div className="flex items-center gap-2" role="status" aria-live="polite">
  <span className={cn(
    "h-2.5 w-2.5 rounded-full",
    "bg-live-indicator",
    "animate-pulse-live"
  )} />
  <span className="text-sm font-medium">Status text</span>
</div>
```

### Form Inputs

```tsx
<Input
  className="focus-visible-ring"
  aria-label="Input description"
/>

<Select>
  <SelectTrigger className="focus-visible-ring">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option">Option</SelectItem>
  </SelectContent>
</Select>
```

### Alerts

```tsx
<Alert variant="destructive" role="alert">
  <AlertCircle className="h-4 w-4" aria-hidden="true" />
  <AlertDescription>Error message</AlertDescription>
</Alert>
```

---

## Accessibility

### ARIA Labels

Always provide descriptive labels:

```tsx
<button
  aria-label="Start recording and transcription"
  aria-pressed={isRecording}
>
  <Mic className="h-7 w-7" aria-hidden="true" />
</button>
```

### ARIA Live Regions

```tsx
<div
  role="log"
  aria-live="polite"
  aria-label="Live transcript"
>
  {/* Dynamic content */}
</div>
```

### Focus Management

Use the `focus-visible-ring` utility class:

```tsx
<button className="focus-visible-ring">
  {/* Automatically applies:
     outline-none
     ring-2 ring-ring ring-offset-2 ring-offset-background
  */}
</button>
```

### Skip Links

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
>
  Skip to main content
</a>
```

### Keyboard Navigation

Document keyboard shortcuts:

```tsx
<kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
  Space
</kbd>
{" to start/pause"}
```

### High Contrast Support

The design system automatically adjusts for high contrast mode:

```css
@media (prefers-contrast: high) {
  :root {
    --border: oklch(0.3 0 0);
    --muted-foreground: oklch(0.3 0 0);
  }
}
```

### Reduced Motion

Respects user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-caption-in,
  .animate-pulse-live,
  .animate-waveform {
    animation: none;
  }
}
```

---

## Animation & Transitions

### Custom Animations

#### Caption Fade-In
```css
@keyframes caption-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-caption-in {
  animation: caption-fade-in 0.3s ease-out forwards;
}
```

Usage:
```tsx
<div className={cn(
  "transition-all",
  isLatest && "animate-caption-in"
)}>
```

#### Pulse Live
```css
@keyframes pulse-live {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse-live {
  animation: pulse-live 2s ease-in-out infinite;
}
```

#### Waveform
```css
@keyframes waveform {
  0%, 100% { height: 4px; }
  50% { height: 16px; }
}

.animate-waveform {
  animation: waveform 0.5s ease-in-out infinite;
  animation-delay: ${index * 0.1}s; /* Staggered */
}
```

### Transition Patterns

```tsx
// Smooth color transitions
className="transition-colors hover:bg-primary/90"

// Smooth opacity transitions
className="transition-opacity opacity-70"

// Combined transitions
className="transition-all hover:scale-105"
```

---

## Code Patterns

### Component Structure

```tsx
"use client"  // Next.js client component directive

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { ComponentProps } from "@/lib/types"

interface ComponentProps {
  // Props definition
  className?: string
}

export function ComponentName({
  // Destructured props
  className,
}: ComponentProps) {
  return (
    <div
      className={cn(
        "base-classes",
        "conditional-classes",
        className  // Allow override
      )}
      role="..."  // Accessibility
      aria-label="..."
    >
      {/* Content */}
    </div>
  )
}
```

### Class Merging Utility

Always use `cn()` for conditional classes:

```tsx
import { cn } from "@/lib/utils"

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "primary" && "primary-classes",
  className  // Allow prop override
)}>
```

### TypeScript Patterns

```tsx
// Use types from lib/types.ts
import type { TranscriptSegment, CaptionSettings } from "@/lib/types"

// Define component props interface
interface ComponentProps {
  segments: TranscriptSegment[]
  settings: CaptionSettings
  className?: string
}
```

### Theme Provider Usage

```tsx
import { ThemeProvider } from "@/components/theme-provider"

<ThemeProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem
  disableTransitionOnChange
>
  {/* App content */}
</ThemeProvider>
```

### Icon Usage

```tsx
import { Mic, Settings, Download } from "lucide-react"

<Mic className="h-5 w-5" aria-hidden="true" />
```

---

## Best Practices

### 1. Component Organization

```
components/
  ├── ui/              # shadcn/ui base components
  ├── transcription/   # Feature-specific components
  └── theme-provider.tsx
```

### 2. File Naming

- Components: `kebab-case.tsx` (e.g., `caption-display.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-transcription.ts`)
- Utilities: `kebab-case.ts` (e.g., `transcription-store.ts`)

### 3. Import Order

```tsx
// 1. React/Next.js
import { useState, useEffect } from "react"
import type { Metadata } from 'next'

// 2. Third-party libraries
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// 3. Icons
import { Mic, Settings } from "lucide-react"

// 4. Types
import type { ComponentProps } from "@/lib/types"

// 5. Local components
import { StatusIndicator } from "./status-indicator"
```

### 4. Accessibility Checklist

- [ ] All interactive elements have `aria-label` or visible text
- [ ] Form inputs have associated labels
- [ ] Status changes use `aria-live` regions
- [ ] Focus states are visible (`focus-visible-ring`)
- [ ] Keyboard navigation works for all features
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader text uses `sr-only` class

### 5. Responsive Design

```tsx
// Mobile-first approach
<div className="flex flex-col gap-4 md:flex-row md:gap-6">
<div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
<div className="text-sm md:text-base">
```

### 6. Performance

- Use `"use client"` only when necessary
- Lazy load heavy components
- Optimize images with Next.js Image component
- Use `useCallback` and `useMemo` for expensive operations

### 7. Error Handling

```tsx
{error && (
  <Alert variant="destructive" role="alert">
    <AlertCircle className="h-4 w-4" aria-hidden="true" />
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

### 8. Loading States

```tsx
{isLoading ? (
  <Skeleton className="h-4 w-full" />
) : (
  <Content />
)}
```

---

## Design Tokens Reference

### Quick Reference

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `bg-background` | Near white | Dark blue-gray | Page background |
| `text-foreground` | Near black | Near white | Primary text |
| `bg-primary` | Blue-cyan | Brighter blue-cyan | Primary actions |
| `bg-muted` | Light gray | Dark gray | Secondary backgrounds |
| `border-border` | Light border | Dark border | Borders |
| `text-muted-foreground` | Gray text | Light gray text | Secondary text |

### Status Colors

| Status | Color Variable | Usage |
|--------|---------------|-------|
| Live/Active | `bg-live-indicator` | Recording, active states |
| Processing | `bg-processing` | Loading, buffering |
| High Confidence | `bg-confidence-high` | Accurate transcriptions |
| Medium Confidence | `bg-confidence-medium` | Moderate accuracy |
| Low Confidence | `bg-confidence-low` | Low accuracy |

---

## Examples

### Complete Component Example

```tsx
"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Mic } from "lucide-react"
import type { ComponentProps } from "@/lib/types"

interface AudioButtonProps {
  isRecording: boolean
  onToggle: () => void
  className?: string
}

export function AudioButton({
  isRecording,
  onToggle,
  className,
}: AudioButtonProps) {
  return (
    <Button
      size="lg"
      onClick={onToggle}
      className={cn(
        "h-16 w-16 rounded-full focus-visible-ring",
        isRecording
          ? "bg-destructive hover:bg-destructive/90"
          : "bg-primary hover:bg-primary/90",
        className
      )}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
      aria-pressed={isRecording}
    >
      <Mic className="h-7 w-7" aria-hidden="true" />
    </Button>
  )
}
```

---

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Lucide Icons](https://lucide.dev)

---

**Last Updated**: 2025-01-27

**Maintained By**: Development Team
