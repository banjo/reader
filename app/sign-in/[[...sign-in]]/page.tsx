import { SignIn } from "@clerk/nextjs";
import { CenteredContainer } from "../../../components/centered-container";

export default function Page() {
    return (
        <CenteredContainer withNav={true}>
            <SignIn />;
        </CenteredContainer>
    );
}
