import { CenteredContainer } from "@/components/layout/centered-container";
import { SignUp } from "@clerk/nextjs";

export default function Page() {
    return (
        <CenteredContainer withNav={true}>
            <SignUp />;
        </CenteredContainer>
    );
}
