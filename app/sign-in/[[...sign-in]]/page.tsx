import { CenteredContainer } from "@/components/centered-container";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <CenteredContainer withNav={true}>
            <SignIn />;
        </CenteredContainer>
    );
}
