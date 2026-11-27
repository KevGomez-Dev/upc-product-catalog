import type { NextConfig } from 'next';
import { configuredOrigin } from './src/lib/origins';

configuredOrigin('API_BASE_URL', 'http://127.0.0.1:3000');
configuredOrigin('WEB_ORIGIN', 'http://127.0.0.1:3001');

const nextConfig: NextConfig = {};
export default nextConfig;
