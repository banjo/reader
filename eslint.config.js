import js from "@banjoanton/eslint-config/javascript";
import react from "@banjoanton/eslint-config/react";
import ts from "@banjoanton/eslint-config/typescript";

export default [
    {
        ignores: ["**/dist/", "**/public/", "**/*.esm.js", "**/.cache/", "**/cache/"],
    },
    ...ts,
    ...js,
    ...react,
    {
        files: ["**/*.{ts,tsx}"],
        rules: {
            "no-undef": "off",
        },
    },
];
