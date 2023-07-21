import { defineConfig } from "hoks";

export default defineConfig({
    debug: false,
    installOnLockChange: true,
    branchName: false,
    commitMessage: false,
    preventCommit: false,
    syncBeforePush: false,
    enforceConventionalCommits: true,
    noTodos: false,
    testChanged: false,
});
