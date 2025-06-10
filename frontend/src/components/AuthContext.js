import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('jwt') || null);
    useEffect(() => {
        if (token) {
            localStorage.setItem('jwt', token);
        }
        else {
            localStorage.removeItem('jwt');
        }
    }, [token]);
    return (_jsx(AuthContext.Provider, { value: { token, setToken }, children: children }));
};
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context)
        throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
