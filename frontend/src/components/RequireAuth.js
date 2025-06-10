import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useAuth } from './AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
const RequireAuth = ({ children }) => {
    const { token } = useAuth();
    const location = useLocation();
    if (!token) {
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    return _jsx(_Fragment, { children: children });
};
export default RequireAuth;
