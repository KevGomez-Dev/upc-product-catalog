import type { NextConfig } from 'next';

const apiBaseUrl = URL.parse(
  process.env.API_BASE_URL ?? 'http://127.0.0.1:3000',
);

if (
  !apiBaseUrl?.hostname ||
  !['http:', 'https:'].includes(apiBaseUrl.protocol) ||
  apiBaseUrl.username ||
  apiBaseUrl.password ||
  apiBaseUrl.pathname !== '/' ||
  apiBaseUrl.search ||
  apiBaseUrl.hash
) {
  throw new Error(
    'API_BASE_URL debe ser un origen HTTP o HTTPS sin credenciales.',
  );
}

const nextConfig: NextConfig = {};

export default nextConfig;
