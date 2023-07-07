import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs";

export default function IndexPage() {
    const { userId } = auth();

    if (!userId) {
        redirect("/");
    }

    return <div>hello</div>;
}
