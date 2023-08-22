import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, User, signInWithPopup } from "firebase/auth";
import jwt_decode from "jwt-decode";
import { createContext, useContext, useEffect, useState } from "react";

export type AuthContextType = {
    userId: string | undefined;
    loading: boolean;
    logout: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    token: string | undefined;
};

const emptyContext: AuthContextType = {
    userId: undefined,
    loading: false,
    logout: async () => {},
    signInWithGoogle: async () => {},
    token: undefined,
};

const AuthContext = createContext<AuthContextType>(emptyContext);

export const useAuth = () => {
    return useContext(AuthContext);
};

type AuthProviderProps = {
    children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const signInResponse = await signInWithPopup(auth, provider);
        setCurrentUser(signInResponse.user);
    };

    const logout = () => auth.signOut();
    const userId = currentUser?.uid;

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setLoading(true);
            setCurrentUser(user);
            setToken(undefined);
            if (!user) {
                setLoading(false);
                return;
            }

            user.getIdToken().then(token => {
                setToken(token);
                setLoading(false);
            });
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        let timeout: NodeJS.Timeout;
        let isCancelled = false;

        const refresh = async () => {
            try {
                const token = await currentUser.getIdToken();

                if (isCancelled) return;
                setToken(token);

                const decodedToken: { exp: number } = jwt_decode(token);
                const expirationTime = decodedToken.exp * 1000 - 60000;
                timeout = setTimeout(refresh, expirationTime - Date.now());
            } catch (error) {
                // TODO: better refresh logic
                console.error("Failed to refresh token", error);
                await logout();
            }
        };

        refresh();

        return () => {
            isCancelled = true;
            clearTimeout(timeout);
        };
    }, [currentUser]);

    const value = {
        logout,
        loading,
        signInWithGoogle,
        userId,
        token,
    };

    console.log("🪕%c Banjo | auth-context.tsx:99 | ", "color: #E91E63", loading);

    return <AuthContext.Provider value={value}> {!loading && children}</AuthContext.Provider>;
}
