import { jsx as _jsx } from "react/jsx-runtime";
import { SnackbarProvider } from 'notistack';
export const NotistackProvider = ({ children }) => (_jsx(SnackbarProvider, { maxSnack: 3, autoHideDuration: 3000, anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, children: children }));
