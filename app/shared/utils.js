/**
 * Get initials from a full name (up to 2 letters).
 * @param {string|null|undefined} name
 * @returns {string}
 */
export function initials(name) {
  return (name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/**
 * Format a date string as Brazilian short date (DD/MM/YYYY).
 * @param {string|null|undefined} iso
 * @returns {string}
 */
export function formatDateBR(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

/**
 * Format a 0–1 float as "XX%".
 * @param {number|null|undefined} ratio
 * @returns {string}
 */
export function formatPercent(ratio) {
  if (ratio == null) return '—';
  return `${Math.round(ratio * 100)}%`;
}

/**
 * Generate a random temporary password (8 chars, uppercase alphanumeric).
 * @returns {string}
 */
export function randomPassword() {
  return Math.random().toString(36).slice(-8).toUpperCase();
}
