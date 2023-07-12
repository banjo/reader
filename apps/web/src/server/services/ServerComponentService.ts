import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { UserRepository } from "server";

const getUserId = async () => {
    const { userId: externalUserId } = auth();

    if (!externalUserId) {
        redirect("/");
    }

    const userId = await UserRepository.getIdByExternalId(externalUserId);

    if (!userId.success) {
        console.log("no user id found in db");
        redirect("/");
    }

    return userId.data;
};

const parseId = (id: string) => {
    const parsedId = Number(id);

    if (Number.isNaN(parsedId)) {
        return null;
    }

    return parsedId;
};

export const ServerComponentService = {
    getUserId,
    parseId,
};
