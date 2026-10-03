---
trigger: always_on
---

Add comments explaining:

- Why the code exists (not what it does)
- Any tricky logic
- TODO items

Use JSDoc for functions:

```typescript
/**
 * Calculates user's total points
 * @param userId - The user's ID
 * @returns Total points earned
 */
function func(argOne: string): number {
  // implementation
}