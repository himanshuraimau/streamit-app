# StreamIt - Design System & Style Guide

**Version:** 1.0  
**Last Updated:** October 2024  
**App Name:** StreamIt  
**Tagline:** Your world of live streaming

---

## Brand Identity

### Core Concept
StreamIt is a modern, immersive live streaming platform with a dark-mode aesthetic contrasted with vibrant, glowing neon colors. The design creates a "digital theater" or "late-night streaming" vibe that's energetic and entertainment-focused.

### Target Audience
- Content creators and streamers
- Live stream viewers
- Gaming and entertainment enthusiasts
- Users looking for real-time interactive content

### Brand Personality
- **Energetic** - Dynamic and exciting
- **Immersive** - Engaging visual experience
- **Modern** - Clean, contemporary design
- **Premium** - High-quality streaming experience
- **Connected** - Social and interactive

---

## Logo & Branding

### Logo Files
- **Dark Mode:** `/logo_dark.svg` (primary)
- **Light Mode:** `/logo_light.svg` (alternative)

### Logo Usage
```tsx
// Standard usage
<img src="/logo_dark.svg" alt="StreamIt" className="h-8 w-auto" />

// With brand name
<div className="flex items-center space-x-2">
  <img src="/logo_dark.svg" alt="StreamIt" className="h-8 w-auto" />
  <span className="text-xl font-bold text-white">StreamIt</span>
</div>
```

### Logo Sizing
- **Navbar:** `h-8` (32px)
- **Auth Pages:** `h-10` to `h-12` (40-48px)
- **Footer:** `h-8` (32px)
- **Favicon:** Use appropriate sizes (16x16, 32x32, etc.)

---

## Color Palette

### Primary Colors

#### Background Colors
```css
--background: oklch(0.04 0 0);        /* Deep Black #0A0A0A */
--card: oklch(0.10 0 0);              /* Dark Grey #1A1A1A */
--muted: oklch(0.15 0 0);             /* Muted Grey #262626 */
```

#### Text Colors
```css
--foreground: oklch(0.98 0 0);        /* White #FFFFFF */
--muted-foreground: oklch(0.64 0 0);  /* Light Grey #E0E0E0 */
--zinc-400: #A1A1AA;                  /* Secondary text */
--zinc-500: #71717A;                  /* Tertiary text */
```

### Accent Colors

#### Primary Gradient (Pink to Purple)
```css
--primary: oklch(0.54 0.28 328);      /* Pink #FF006E */
--accent: oklch(0.56 0.28 270);       /* Purple #8338EC */
```

**Usage:**
```tsx
className="bg-gradient-to-r from-pink-500 to-purple-600"
className="text-gradient-primary" // For text
```

#### Secondary Gradient (Blue to Cyan)
```css
--secondary: oklch(0.62 0.20 214);    /* Blue #3A86FF */
--cyan: #06FFF0;                      /* Cyan */
```

**Usage:**
```tsx
className="bg-gradient-to-r from-blue-500 to-cyan-400"
className="text-gradient-secondary" // For text
```

### Status Colors
```css
--destructive: oklch(0.60 0.25 27);   /* Red #FF3B30 */
--success: oklch(0.47 0.19 142);      /* Green #34C759 */
--warning: #FFCC00;                   /* Yellow */
--info: #3A86FF;                      /* Blue */
```

### Border & Input Colors
```css
--border: oklch(0.20 0 0);            /* Zinc-800 #27272A */
--input: oklch(0.20 0 0);             /* Zinc-800 */
--ring: oklch(0.56 0.28 270);         /* Purple ring */
```

---

## Typography

### Font Family
```css
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

### Font Sizes & Weights

#### Headings
```tsx
// H1 - Hero/Landing
className="text-6xl md:text-7xl font-bold"

// H2 - Page Title
className="text-3xl font-bold"

// H3 - Section Title
className="text-2xl font-bold"

// H4 - Card Title
className="text-xl font-semibold"
```

#### Body Text
```tsx
// Large body
className="text-xl"          // 20px

// Regular body
className="text-base"        // 16px

// Small text
className="text-sm"          // 14px

// Extra small
className="text-xs"          // 12px
```

#### Font Weights
- **Bold:** `font-bold` (700) - Headings, CTAs
- **Semibold:** `font-semibold` (600) - Subheadings, buttons
- **Medium:** `font-medium` (500) - Links, labels
- **Regular:** `font-normal` (400) - Body text

---

## Components

### Buttons

#### Primary Button (Gradient)
```tsx
<Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
  Click Me
</Button>
```

#### Secondary Button (Outline)
```tsx
<Button 
  variant="outline" 
  className="border-zinc-700 text-white hover:bg-zinc-800"
>
  Click Me
</Button>
```

#### Ghost Button
```tsx
<Button 
  variant="ghost" 
  className="text-zinc-400 hover:text-white"
>
  Click Me
</Button>
```

#### Button States
- **Default:** Gradient or solid color
- **Hover:** Darker shade
- **Disabled:** `disabled={true}` with opacity
- **Loading:** Show loading text, disable interaction

### Cards

#### Standard Card
```tsx
<Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800">
  <CardHeader>
    <CardTitle className="text-white">Title</CardTitle>
    <CardDescription className="text-zinc-400">Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

#### Card with Hover Effect
```tsx
<div className="group relative rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500 transition-all duration-300">
  {/* Content */}
  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
</div>
```

### Inputs

#### Text Input
```tsx
<Input
  type="text"
  placeholder="Enter text..."
  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
/>
```

#### Input with Icon
```tsx
<div className="relative">
  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
  <Input
    type="email"
    placeholder="you@example.com"
    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 pl-10"
  />
</div>
```

#### Input Focus State
```css
/* Automatically applied via index.css */
input:focus {
  @apply ring-2 ring-purple-500 border-purple-500;
}
```

### Forms

#### Form Field Structure
```tsx
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel className="text-zinc-300">Label</FormLabel>
      <FormControl>
        <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" />
      </FormControl>
      <FormDescription className="text-xs text-zinc-500">
        Helper text
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Effects & Animations

### Neon Glow Effect
```tsx
// Primary glow (pink-purple)
className="glow-primary"

// Secondary glow (blue-cyan)
className="glow-secondary"
```

**CSS Definition:**
```css
.glow-primary {
  box-shadow: 0 0 20px rgba(255, 0, 110, 0.5), 0 0 40px rgba(131, 56, 236, 0.3);
}

.glow-secondary {
  box-shadow: 0 0 20px rgba(58, 134, 255, 0.5), 0 0 40px rgba(6, 255, 240, 0.3);
}
```

### Background Gradients
```tsx
// Subtle background effect for pages
<div className="absolute inset-0 overflow-hidden pointer-events-none">
  <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
  <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl"></div>
</div>
```

### Backdrop Blur
```tsx
className="backdrop-blur-xl"  // For cards and overlays
className="bg-black/95 backdrop-blur"  // For navbar
```

### Transitions
```tsx
// Standard transition
className="transition-all duration-300"

// Color transition
className="transition-colors"

// Hover scale
className="hover:scale-105 transition-transform"
```

---

## Layout Patterns

### Page Container
```tsx
<div className="min-h-screen bg-black">
  {/* Content */}
</div>
```

### Centered Content
```tsx
<div className="min-h-screen flex items-center justify-center bg-black px-4">
  {/* Centered content */}
</div>
```

### Container with Max Width
```tsx
<div className="container mx-auto px-4">
  {/* Content */}
</div>

// Or with specific max-width
<div className="max-w-7xl mx-auto px-4">
  {/* Content */}
</div>
```

### Grid Layouts
```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>

// Stream grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* Stream cards */}
</div>
```

---

## Navigation

### Navbar Structure
```tsx
<nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/95 backdrop-blur">
  <div className="container flex h-16 items-center justify-between px-4">
    {/* Logo */}
    <Link to="/" className="flex items-center space-x-2">
      <img src="/logo_dark.svg" alt="StreamIt" className="h-8 w-auto" />
      <span className="text-xl font-bold text-white">StreamIt</span>
    </Link>
    
    {/* Navigation items */}
    
    {/* Auth section */}
  </div>
</nav>
```

### Back Button
```tsx
<Link to="/previous-page" className="text-zinc-400 hover:text-white transition-colors">
  <ArrowLeft className="h-5 w-5" />
</Link>
```

---

## Icons

### Icon Library
**Lucide React** - Consistent, modern icon set

### Icon Sizing
```tsx
// Small icons (buttons, inline)
className="h-4 w-4"

// Medium icons (navigation, forms)
className="h-5 w-5"

// Large icons (illustrations)
className="h-10 w-10"

// Extra large (hero sections)
className="h-16 w-16"
```

### Icon Colors
```tsx
// Primary icons
className="text-white"

// Secondary icons
className="text-zinc-400"

// Accent icons
className="text-purple-400"

// Status icons
className="text-green-500"  // Success
className="text-red-500"    // Error
```

---

## Notifications (Toast)

### Toast Configuration
Using **Sonner** with dark theme

```tsx
// Success
toast.success('Title', {
  description: 'Description text',
});

// Error
toast.error('Title', {
  description: 'Error message',
});

// Info
toast('Title', {
  description: 'Info message',
});
```

### Toast Styling
```tsx
<Toaster 
  position="top-right"
  theme="dark"
  toastOptions={{
    style: {
      background: '#1A1A1A',
      border: '1px solid #3F3F46',
      color: '#FFFFFF',
    },
  }}
/>
```

---

## Spacing & Sizing

### Spacing Scale
```tsx
// Extra small
className="space-y-2"  // 8px
className="gap-2"      // 8px

// Small
className="space-y-4"  // 16px
className="gap-4"      // 16px

// Medium
className="space-y-6"  // 24px
className="gap-6"      // 24px

// Large
className="space-y-8"  // 32px
className="gap-8"      // 32px

// Extra large
className="space-y-12" // 48px
className="gap-12"     // 48px
```

### Padding
```tsx
// Container padding
className="px-4"       // Horizontal
className="py-12"      // Vertical

// Card padding
className="p-6"        // All sides

// Button padding
className="px-8 py-3"  // Horizontal & Vertical
```

### Border Radius
```tsx
className="rounded-lg"    // 8px - Cards
className="rounded-xl"    // 12px - Large cards
className="rounded-full"  // Circular - Buttons, avatars
```

---

## Responsive Design

### Breakpoints
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Responsive Patterns
```tsx
// Hide on mobile, show on desktop
className="hidden md:flex"

// Show on mobile, hide on desktop
className="flex md:hidden"

// Responsive text size
className="text-4xl md:text-6xl lg:text-7xl"

// Responsive grid
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Responsive spacing
className="px-4 md:px-6 lg:px-8"
```

---

## Accessibility

### Focus States
All interactive elements must have visible focus states:
```tsx
className="focus:outline-none focus:ring-2 focus:ring-purple-500"
```

### ARIA Labels
```tsx
<button aria-label="Close menu">
  <X className="h-5 w-5" />
</button>

<img src="/logo.svg" alt="StreamIt logo" />
```

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Tab order should be logical
- Escape key should close modals/dialogs

### Color Contrast
- Minimum contrast ratio: 4.5:1 for normal text
- Minimum contrast ratio: 3:1 for large text
- All text on dark backgrounds uses white or light grey

---

## Loading States

### Button Loading
```tsx
<Button disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>
```

### Skeleton Loaders
```tsx
import { Skeleton } from '@/components/ui/skeleton';

<Skeleton className="h-4 w-full" />
<Skeleton className="h-20 w-20 rounded-full" />
```

### Spinner/Progress
```tsx
// For full-page loading
<div className="flex items-center justify-center min-h-screen">
  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
</div>
```

---

## Error States

### Form Errors
```tsx
<FormMessage className="text-red-500" />
```

### Empty States
```tsx
<div className="text-center py-12">
  <p className="text-zinc-400">No streams available</p>
  <Button className="mt-4">Start Streaming</Button>
</div>
```

### Error Pages
```tsx
<div className="min-h-screen flex items-center justify-center bg-black">
  <div className="text-center space-y-4">
    <h1 className="text-6xl font-bold text-white">404</h1>
    <p className="text-xl text-zinc-400">Page not found</p>
    <Link to="/">
      <Button>Go Home</Button>
    </Link>
  </div>
</div>
```

---

## Best Practices

### Do's ✅
- Use the gradient buttons for primary CTAs
- Maintain consistent spacing throughout
- Use backdrop blur for overlays and cards
- Apply neon glow effects to important elements
- Keep dark mode as the primary theme
- Use the logo consistently across all pages
- Provide clear loading and error states
- Ensure all interactive elements have hover states

### Don'ts ❌
- Don't use light backgrounds (except for specific components)
- Don't mix different gradient styles
- Don't use colors outside the defined palette
- Don't create custom components without following the design system
- Don't forget focus states for accessibility
- Don't use the old "Coro" branding
- Don't use circular letter placeholders instead of the logo

---

## Code Examples

### Complete Auth Page Template
```tsx
"use client";

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function PageName() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border-zinc-800 relative z-10">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Link to="/back" className="text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <img src="/logo_dark.svg" alt="StreamIt" className="h-10 w-auto" />
          </div>
          <CardTitle className="text-2xl text-white">Page Title</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Page content */}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## File Organization

### Component Structure
```
src/
├── components/
│   ├── ui/              # shadcn components
│   └── shared/          # Shared custom components
├── pages/
│   ├── home/
│   │   ├── _components/ # Page-specific components
│   │   └── index.tsx
│   └── auth/
│       ├── _components/ # Auth-specific components
│       └── *.tsx        # Auth pages
├── lib/                 # Utilities and configs
├── types/               # TypeScript types
└── utils/               # Helper functions
```

---

## Version History

- **v1.0** (October 2024) - Initial style guide for StreamIt
  - Rebranded from Coro to StreamIt
  - Established dark mode design system
  - Defined color palette and typography
  - Created component library standards

---

## Maintenance

This style guide should be updated when:
- New components are added
- Color palette changes
- Typography updates
- New patterns emerge
- Brand guidelines change

**Maintained by:** Development Team  
**Review Frequency:** Quarterly or as needed
