import { auth } from "@/lib/firebase";
import { getTokenRefreshDelayMs, isSessionInvalidError } from "@/lib/auth";
import { isDev } from "@/utils/runtime";
import { raise } from "@banjoanton/utils";
import { GoogleAuthProvider, User, signInWithPopup } from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const transientRetryMs = 30_000;

export type AuthContextType = {
    userId: string | undefined;
    loading: boolean;
    logout: () => Promise<void>;
    refreshToken: () => Promise<string | undefined>;
    signInWithGoogle: () => Promise<void>;
    token: string | undefined;
};

const emptyContext: AuthContextType = {
    userId: undefined,
    loading: false,
    logout: async () => {},
    refreshToken: async () => undefined,
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

    const logout = useCallback(() => auth.signOut(), []);

    const refreshToken = useCallback(async (): Promise<string | undefined> => {
        if (isDev()) {
            return "development";
        }

        if (!currentUser) {
            return undefined;
        }

        try {
            const refreshedToken = await currentUser.getIdToken(true);
            setToken(refreshedToken);
            return refreshedToken;
        } catch (error) {
            console.error("Failed to refresh token", error);

            // A network blip must not end the session; only a rejected session should.
            if (isSessionInvalidError(error)) {
                await logout();
            }

            return undefined;
        }
    }, [currentUser, logout]);

    const userId = currentUser?.uid;

    useEffect(() => {
        if (isDev()) {
            const uid =
                import.meta.env.VITE_DEVELOPMENT_UID ?? raise("VITE_DEVELOPMENT_UID not specified");

            setCurrentUser({
                uid,
            } as User);
            setToken("development");
            setLoading(false);
            return;
        }

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
        if (!currentUser || isDev()) return;

        let timeout: ReturnType<typeof setTimeout>;
        let isCancelled = false;

        const refresh = async () => {
            const refreshedToken = await refreshToken();

            if (isCancelled) return;

            const delay = refreshedToken
                ? Math.max(getTokenRefreshDelayMs(refreshedToken), 5_000)
                : transientRetryMs;

            timeout = setTimeout(() => void refresh(), delay);
        };

        void refresh();

        return () => {
            isCancelled = true;
            clearTimeout(timeout);
        };
    }, [currentUser, refreshToken]);

    const value = {
        logout,
        loading,
        refreshToken,
        signInWithGoogle,
        userId,
        token,
    };

    return <AuthContext.Provider value={value}> {!loading && children}</AuthContext.Provider>;
}
