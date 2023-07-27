import "dotenv/config";
import { addToUsersWorker, fetchWorker } from "worker-utils";

const main = async () => {
    await fetchWorker.clear();
    await addToUsersWorker.clear();
    process.exit(0);
};

main();
