import { CenteredContainer } from "@/components/centered-container";
import { SignUp } from "@clerk/nextjs";

export default function Page() {
    return (
        <CenteredContainer withNav={true}>
            <SignUp />;
        </CenteredContainer>
    );
}
