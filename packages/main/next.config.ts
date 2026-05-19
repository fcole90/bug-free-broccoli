import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';
const repositoryBasePath = '/bug-free-broccoli';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isDev ? '' : repositoryBasePath,
};

export default nextConfig;
