import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Link } from "react-router-dom";

export function LandingPage() {
    const { userId, signInWithGoogle } = useAuth();
    return (
        <section
            className="h-full-with-nav flex flex-col items-start justify-center gap-6 px-16
                pb-8 pt-6 md:py-10 font-open"
        >
            <div className="flex max-w-[980px] flex-col items-start gap-2">
                <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
                    Banjo Reader
                </h1>
                <p className="text-muted-foreground max-w-[700px] text-lg">
                    A super simple RSS feed reader. Not much more than that actually.
                </p>
            </div>

            <div className="flex gap-4">
                {userId ? (
                    <Link to={"/dashboard"} className={buttonVariants()}>
                        Dashboard
                    </Link>
                ) : (
                    <>
                        <button className={buttonVariants()} onClick={signInWithGoogle}>
                            Sign in
                        </button>
                        <button
                            className={buttonVariants({ variant: "outline" })}
                            onClick={signInWithGoogle}
                        >
                            Sign up
                        </button>
                    </>
                )}
            </div>
        </section>
    );
}
