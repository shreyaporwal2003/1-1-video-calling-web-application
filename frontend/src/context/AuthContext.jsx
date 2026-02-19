import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => {
	return useContext(AuthContext);
};

export const AuthContextProvider = ({ children }) => {
	const [authUser, setAuthUser] = useState(JSON.parse(localStorage.getItem("chat-user")) || null);
    const [loading, setLoading] = useState(false);

    // We can add a function to check auth status from backend if needed, 
    // but relying on localStorage + backend cookie check on protected routes is a common pattern.
    // For now, we trust localStorage for initial render, and backend will reject if token is invalid.

	return <AuthContext.Provider value={{ authUser, setAuthUser, loading, setLoading }}>{children}</AuthContext.Provider>;
};
