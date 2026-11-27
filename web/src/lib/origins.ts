export function configuredOrigin(
  name: 'API_BASE_URL' | 'WEB_ORIGIN',
  fallback: string,
) {
  const url = URL.parse(process.env[name] ?? fallback);
  if (
    !url ||
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      `${name} debe ser un origen HTTP o HTTPS sin credenciales.`,
    );
  }
  return url.origin;
}
