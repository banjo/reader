import { defineConfig } from "hoks";

export default defineConfig({
    installOnLockChange: true,
    branchName: false,
    commitMessage: false,
    staged: {
        "*": "pnpm run format",
        "*.{ts,js,tsx,jsx}": "pnpm exec eslint --fix --ext .ts,.tsx,.js,.jsx",
    },
    preventCommit: false,
    syncBeforePush: false,
    enforceConventionalCommits: true,
    noTodos: false,
    testChanged: false,
});
