#!/usr/bin/env zx
/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */

import * as prettier from "prettier";
import "zx/globals";

$.verbose = false;

const searchPath = "./apps/web/src/app";
const outputPath = "./apps/web/src/app/client/lib/api-routes.ts";

main();

async function main() {
    const output = await getOutput();
    const routes = getRoutes(output);

    const fns = routes.map(route => {
        return {
            path: route.path,
            fn: createFunction(route),
        };
    });

    const exportedObjectString = createExportedObject(fns);
    saveFile(exportedObjectString);
}

async function getOutput() {
    const routesRes = await $`find ${searchPath} -name route.ts`;

    if (!routesRes) {
        console.log("No routes.ts files found");
        process.exit(0);
    }

    const output = routesRes.stdout.split("\n").filter(Boolean);

    return output;
}

function getRoutes(output) {
    const paths = output.map(route => {
        return route.replace(searchPath, "").replace("/route.ts", "");
    });

    const regex = /\[(.*?)\]/g;

    const routes = paths.map(path => {
        const params = path.match(regex);

        if (!params) {
            return {
                path,
                params: [],
            };
        }

        return {
            path,
            params: params.map(param => param.replace("[", "").replace("]", "")),
        };
    });

    return routes;
}

function createFunction(route) {
    if (route.params.length === 0) {
        return `"${route.path}"`;
    }

    const args = route.params.map(param => `${param}: string`).join(", ");

    return `(${args}) => \`${route.path.replace(/\[(.*?)\]/g, "${$1}")}\``;
}

function createExportedObject(routes) {
    const routesObject = routes.reduce((acc, route) => {
        const key = route.path.toUpperCase();
        const keyWithUnderscores = key.replace(/\//g, (match, offset) => {
            if (offset === 0) {
                return "";
            }

            return "_";
        });

        acc[keyWithUnderscores] = route.fn;

        return acc;
    }, {});

    return `export const ROUTES = {
    ${Object.keys(routesObject)
        .map(key => `"${key}": ${routesObject[key]}`)
        .join(",\n")}
    } as const`;
}

async function saveFile(content) {
    const prettierConfig = await prettier.resolveConfig(outputPath);
    const formatted = await prettier.format(content, {
        ...prettierConfig,
        filepath: outputPath,
    });

    fs.createFileSync(outputPath);
    fs.writeFileSync(outputPath, formatted);
}
