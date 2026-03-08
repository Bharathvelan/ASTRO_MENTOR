# Accessibility Guidelines - AstraMentor Frontend

## Overview

This document outlines the accessibility features and guidelines implemented in the AstraMentor frontend application.

---

## ✅ Implemented Features

### 1. Semantic HTML
- Proper heading hierarchy (h1 → h2 → h3)
- Semantic elements (nav, main, article, section)
- Form labels associated with inputs
- Button elements for interactive actions

### 2. Keyboard Navigation
- All interactive elements accessible via keyboard
- Tab order follows logical flow
- Focus indicators visible on all focusable elements
- Skip links for main content areas
- Focus trap in modals and dialogs

### 3. ARIA Labels
- Descriptive aria-labels on icon-only buttons
- aria-live regions for dynamic content
- aria-expanded for collapsible sections
- aria-current for navigation items

### 4. Color Contrast
- Text meets WCAG AA standards (4.5:1 for normal text)
- Interactive elements have sufficient contrast
- Focus indicators have 3:1 contrast ratio
- Error messages use color + text/icons

### 5. Screen Reader Support
- Descriptive alt text for images
- Hidden text for icon-only buttons
- Status messages announced
- Loading states communicated

### 6. Focus Management
- Skip links to main content
- Focus trap in modals
- Focus returns to trigger after modal close
- Logical tab order throughout

---

## 🎯 Component Accessibility

### Buttons
```tsx
// Good: Descriptive text or aria-label
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// Good: Visible text
<Button>Save Changes</Button>
```

### Forms
```tsx
// Good: Label associated with input
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// Good: Error messages
<Input aria-invalid={hasError} aria-describedby="email-error" />
{hasError && <span id="email-error">Invalid email</span>}
```

### Navigation
```tsx
// Good: Current page indicator
<Link href="/dashboard" aria-current={isActive ? 'page' : undefined}>
  Dashboard
</Link>
```

### Modals/Dialogs
```tsx
// Good: Focus trap and aria attributes
<Dialog>
  <DialogContent aria-labelledby="dialog-title">
    <DialogTitle id="dialog-title">Confirm Action</DialogTitle>
    <FocusTrap>
      {/* Dialog content */}
    </FocusTrap>
  </DialogContent>
</Dialog>
```

---

## 🔧 Accessibility Components

### SkipLink
Allows keyboard users to skip to main content:
```tsx
import { SkipLink } from '@/components/accessibility';

<SkipLink href="#main-content">
  Skip to main content
</SkipLink>
```

### FocusTrap
Traps focus within a container (for modals):
```tsx
import { FocusTrap } from '@/components/accessibility';

<FocusTrap active={isOpen}>
  {/* Modal content */}
</FocusTrap>
```

### ErrorBoundary
Provides accessible error messages:
```tsx
import { ErrorBoundary } from '@/components/error';

<ErrorBoundary>
  {/* App content */}
</ErrorBoundary>
```

---

## 📋 Testing Checklist

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Shift+Tab works in reverse
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals
- [ ] Arrow keys work in menus/lists

### Screen Reader
- [ ] Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] All images have alt text
- [ ] Form labels are announced
- [ ] Error messages are announced
- [ ] Loading states are announced

### Visual
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Text is readable at 200% zoom
- [ ] No information conveyed by color alone

### Interaction
- [ ] All functionality available via keyboard
- [ ] No keyboard traps (except intentional focus traps)
- [ ] Timeout warnings provided
- [ ] Error messages are clear

---

## 🎨 Color Contrast Ratios

### Text
- Normal text (16px+): 4.5:1 minimum
- Large text (18px+ or 14px+ bold): 3:1 minimum
- UI components: 3:1 minimum

### Current Implementation
- Primary text on background: ~15:1 ✅
- Secondary text on background: ~7:1 ✅
- Button text on primary: ~4.5:1 ✅
- Focus indicators: ~3:1 ✅

---

## 🚀 Best Practices

### 1. Use Semantic HTML
```tsx
// Good
<button onClick={handleClick}>Click me</button>

// Bad
<div onClick={handleClick}>Click me</div>
```

### 2. Provide Text Alternatives
```tsx
// Good
<img src="logo.png" alt="AstraMentor logo" />

// Bad
<img src="logo.png" />
```

### 3. Ensure Keyboard Access
```tsx
// Good
<button onClick={handleClick}>Action</button>

// Bad
<div onClick={handleClick}>Action</div>
```

### 4. Use ARIA Appropriately
```tsx
// Good: ARIA enhances native semantics
<button aria-label="Close" onClick={handleClose}>
  <X />
</button>

// Bad: ARIA overrides native semantics unnecessarily
<button role="button">Click me</button>
```

### 5. Manage Focus
```tsx
// Good: Return focus after modal closes
const handleClose = () => {
  setIsOpen(false);
  triggerRef.current?.focus();
};
```

---

## 📚 Resources

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension for accessibility testing
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Built into Chrome DevTools

### Guidelines
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - Web Content Accessibility Guidelines
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) - ARIA design patterns

### Testing
- [NVDA](https://www.nvaccess.org/) - Free screen reader for Windows
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) - Built-in screen reader for Mac
- [Keyboard Testing](https://webaim.org/articles/keyboard/) - Keyboard accessibility guide

---

## 🔍 Known Issues

### To Be Addressed
1. Full WCAG audit not yet completed
2. Some dynamic content may need aria-live regions
3. Color contrast in some edge cases needs verification
4. Screen reader testing incomplete

### Future Improvements
1. Add more comprehensive ARIA labels
2. Implement skip navigation for all major sections
3. Add keyboard shortcuts documentation
4. Improve error message clarity

---

## 💡 Contributing

When adding new features, ensure:
1. All interactive elements are keyboard accessible
2. Proper ARIA attributes are used
3. Color contrast meets WCAG AA standards
4. Focus management is handled correctly
5. Screen reader announcements are appropriate

---

**Last Updated:** March 1, 2026

