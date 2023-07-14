import { defineConfig } from "hoks";

export default defineConfig({
    debug: true,
    installOnLockChange: true,
    branchName: false,
    commitMessage: false,
    staged: {
        "*": "prettier --write",
    },
    preventCommit: false,
    syncBeforePush: false,
    enforceConventionalCommits: true,
    noTodos: false,
    testChanged: false,
});
