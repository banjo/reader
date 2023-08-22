import { CenteredContainer } from "@/components/shared/centered-container";
import { useAuth } from "@/contexts/auth-context";
import { FC } from "react";

export const SignInPage: FC = () => {
    const { signInWithGoogle } = useAuth();

    return (
        <CenteredContainer>
            <button onClick={signInWithGoogle}>Sign in with Google</button>
        </CenteredContainer>
    );
};
