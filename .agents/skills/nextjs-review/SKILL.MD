---
name: nextjs-review
description: Reviews Next.js and TypeScript code for critical issues only - types, performance, security, and App Router patterns.
---

# Next.js + TypeScript Review (Essentials Only)

Focus on issues that actually break things or cause real problems.

## What to Check

### 1. TypeScript - Does it have types?

- Props missing types → Add interface
- Using `any` → Use proper type
- Function missing return type → Add it
- API response not typed → Create interface

### 2. Next.js Patterns - Is it using the right pattern?

- Should it be Server or Client Component?
- Using next/image instead of <img>?
- Has loading.tsx and error.tsx?
- Metadata for SEO?

### 3. Performance - Will it be slow?

- Fetching data in a loop? (N+1 problem)
- Missing cache settings?
- Heavy component not code-split?
- No debouncing on search/input?

### 4. Security - Can it be exploited?

- Secrets exposed in client code?
- No authentication on API routes?
- SQL injection possible?
- No input validation?

## Review Priority

Check in this order:

1. 🔴 **BREAKS**: Type errors, security holes, crashes
2. 🟡 **SLOWS**: Performance issues, bad patterns
3. 🔵 **IMPROVES**: Minor optimizations

## Keep Feedback Short

Format:

🔴 ISSUE: Missing types on props
Fix: Add interface Props { user: User }

That's it. No long explanations unless asked.