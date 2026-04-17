export function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      // Fallback for comma-separated values.
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}
