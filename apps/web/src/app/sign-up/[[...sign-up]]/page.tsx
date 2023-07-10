import { CenteredContainer } from "@/client/components/layout/centered-container";
import { SignUp } from "@clerk/nextjs";

export default function Page() {
    return (
        <CenteredContainer withNav={true}>
            <SignUp afterSignInUrl={"/dashboard"} afterSignUpUrl={"/dashboard"} />;
        </CenteredContainer>
    );
}
