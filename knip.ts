import type { KnipConfig } from "knip";

const config: KnipConfig = {
    workspaces: {
        ".": {
            entry: ["src/index.ts", "src/main.ts"],
        },
    },
};

export default config;
