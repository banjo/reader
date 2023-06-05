import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function IndexPage() {
    const { userId } = auth();

    if (!userId) {
        redirect("/");
    }

    return <div>hello</div>;
}
