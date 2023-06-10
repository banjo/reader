// Update auto generated models to be correct, making the date type work.
import { globby } from "globby";
import fs from "node:fs";

const readFile = (path: string) => {
    return fs.promises.readFile(path, "utf8");
};

const writeFile = async (path: string, content: string) => {
    await fs.promises.writeFile(path, content, "utf8");
};

// TODO: fix so that everything gets replaced
const replaceMap = {
    "z.date()": "z.coerce.date()", // make date parsing work
    "z.string().nullish()": "z.union([z.string(), z.null()])", // make type be only null or value, not undefined as well.
};

const main = async () => {
    const files = await globby(`**/prisma/zod/*.ts`);

    for (const file of files) {
        const content = await readFile(file);

        let newContent = content;
        for (const [oldValue, newValue] of Object.entries(replaceMap)) {
            newContent = newContent.replaceAll(oldValue, newValue);
        }

        await writeFile(file, newContent);
    }
};

main();
