/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack(config) {
        config.experiments = { ...config.experiments, topLevelAwait: true };
        config.externals.push("pino-pretty", "linkedom");

        return config;
    },
    transpilePackages: ["db"],
};

export default nextConfig;
