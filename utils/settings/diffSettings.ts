/**
 * diffSettings.ts
 *
 * Pure utility for computing a partial diff between two objects.
 * Used by the Settings screen to build a minimal update payload
 * instead of checking each field manually.
 *
 * Depends on: none (pure TypeScript)
 * Used by: app/(drawer)/settings.tsx
 */

/**
 * Returns only the fields in `current` that differ from `original`,
 * restricted to the listed `keys`. Omitted or identical fields
 * are excluded from the result.
 */
export function getChangedFields<T extends object>(
	current: Partial<T>,
	original: T,
	keys: (keyof T)[],
): Partial<T> {
	const diff: Partial<T> = {};
	for (const key of keys) {
		if (current[key] !== original[key]) {
			diff[key] = current[key];
		}
	}
	return diff;
}
