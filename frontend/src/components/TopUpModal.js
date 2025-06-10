import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem, Select, InputLabel, FormControl, TextField, Typography } from '@mui/material';
const TopUpModal = ({ open, onClose, onTopUp, accounts }) => {
    const [selectedLast4, setSelectedLast4] = useState('');
    const [amount, setAmount] = useState('');
    const [errorAccount, setErrorAccount] = useState(false);
    const [errorAmount, setErrorAmount] = useState(false);
    const handleTopUp = () => {
        let valid = true;
        setErrorAccount(false);
        setErrorAmount(false);
        const account = accounts.find(acc => acc.last4 === selectedLast4);
        if (!account || account.frozen) {
            setErrorAccount(true);
            valid = false;
        }
        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setErrorAmount(true);
            valid = false;
        }
        if (valid) {
            onTopUp(selectedLast4, numAmount);
            setSelectedLast4('');
            setAmount('');
        }
    };
    const handleClose = () => {
        setSelectedLast4('');
        setAmount('');
        setErrorAccount(false);
        setErrorAmount(false);
        onClose();
    };
    return (_jsxs(Dialog, { open: open, onClose: handleClose, maxWidth: "xs", fullWidth: true, children: [_jsx(DialogTitle, { "data-testid": "titulo-modal-agregar-fondos", children: "Agregar fondos" }), _jsxs(DialogContent, { children: [_jsxs(FormControl, { fullWidth: true, margin: "normal", error: errorAccount, children: [_jsx(InputLabel, { "data-testid": "etiqueta-cuenta", id: "account-select-label", children: "Cuenta *" }), _jsx(Select, { "data-testid": "selector-cuenta", labelId: "account-select-label", value: selectedLast4, label: "Cuenta *", onChange: e => setSelectedLast4(e.target.value), children: accounts.map(acc => (_jsxs(MenuItem, { value: acc.last4, disabled: acc.frozen, children: ["\u2022\u2022\u2022\u2022 ", acc.last4, " ", acc.frozen ? '(Congelada)' : ''] }, acc.last4))) }), errorAccount && (_jsx(Typography, { "data-testid": "texto-error-cuenta", color: "error", variant: "caption", children: "Selecciona una cuenta v\u00E1lida y activa" }))] }), _jsx(TextField, { "data-testid": "input-monto", fullWidth: true, margin: "normal", label: "Monto a agregar *", type: "number", value: amount, onChange: e => setAmount(e.target.value), error: errorAmount, helperText: errorAmount ? 'Monto debe ser un número positivo' : '', inputProps: { min: 1 } })] }), _jsxs(DialogActions, { children: [_jsx(Button, { "data-testid": "boton-cancelar-agregar-fondos", onClick: handleClose, color: "secondary", children: "Cancelar" }), _jsx(Button, { "data-testid": "boton-agregar-fondos", onClick: handleTopUp, variant: "contained", color: "primary", children: "Agregar fondos" })] })] }));
};
export default TopUpModal;
