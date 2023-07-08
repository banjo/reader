/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        appDir: true,
    },
    webpack(config) {
        config.experiments = { ...config.experiments, topLevelAwait: true };
        return config;
    },
};

export default nextConfig;