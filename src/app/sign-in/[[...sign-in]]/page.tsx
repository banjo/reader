import { CenteredContainer } from "@/client/components/layout/centered-container";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <CenteredContainer withNav={true}>
            <SignIn />;
        </CenteredContainer>
    );
}
