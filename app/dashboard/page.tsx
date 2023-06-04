import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function IndexPage() {
    const { userId } = auth();

    if (!userId) {
        redirect("/");
    }

    return <section className="container ">signed in</section>;
}
