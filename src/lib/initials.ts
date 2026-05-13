/** Returns a 2-letter avatar string from a person's name.
 *  Rule: first letter of the first word + first letter of the second word.
 *  Single-word names use the first 2 letters. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
