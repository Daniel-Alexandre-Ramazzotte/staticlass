const base = import.meta.env.BASE_URL;

export function appUrl(path) {
  return `${base}${path.replace(/^\/+/, '')}`;
}
