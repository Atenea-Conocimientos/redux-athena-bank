import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem, Select, InputLabel, FormControl, TextField, Typography } from '@mui/material';
const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
const TransferModal = ({ open, onClose, onTransfer, accounts }) => {
    const [recipientEmail, setRecipientEmail] = useState('');
    const [originLast4, setOriginLast4] = useState('');
    const [amount, setAmount] = useState('');
    const [errorEmail, setErrorEmail] = useState(false);
    const [errorAccount, setErrorAccount] = useState(false);
    const [errorAmount, setErrorAmount] = useState(false);
    const [errorBalance, setErrorBalance] = useState(false);
    const handleTransfer = () => {
        let valid = true;
        setErrorEmail(false);
        setErrorAccount(false);
        setErrorAmount(false);
        setErrorBalance(false);
        if (!validateEmail(recipientEmail)) {
            setErrorEmail(true);
            valid = false;
        }
        const account = accounts.find(acc => acc.last4 === originLast4);
        if (!account || account.frozen) {
            setErrorAccount(true);
            valid = false;
        }
        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setErrorAmount(true);
            valid = false;
        }
        if (account && typeof account.balance === 'number' && numAmount > account.balance) {
            setErrorBalance(true);
            valid = false;
        }
        if (valid) {
            onTransfer(originLast4, recipientEmail, numAmount);
            setRecipientEmail('');
            setOriginLast4('');
            setAmount('');
        }
    };
    const handleClose = () => {
        setRecipientEmail('');
        setOriginLast4('');
        setAmount('');
        setErrorEmail(false);
        setErrorAccount(false);
        setErrorAmount(false);
        setErrorBalance(false);
        onClose();
    };
    return (_jsxs(Dialog, { open: open, onClose: handleClose, maxWidth: "xs", fullWidth: true, children: [_jsx(DialogTitle, { children: "Enviar transferencia" }), _jsxs(DialogContent, { children: [_jsx(TextField, { fullWidth: true, margin: "normal", label: "Email del destinatario *", value: recipientEmail, onChange: e => setRecipientEmail(e.target.value), error: errorEmail, helperText: errorEmail ? 'Email inválido' : '' }), _jsxs(FormControl, { fullWidth: true, margin: "normal", error: errorAccount, children: [_jsx(InputLabel, { id: "origin-account-label", children: "Cuenta origen *" }), _jsx(Select, { labelId: "origin-account-label", value: originLast4, label: "Cuenta origen *", onChange: e => setOriginLast4(e.target.value), children: accounts.map(acc => (_jsxs(MenuItem, { value: acc.last4, disabled: acc.frozen, children: ["\u2022\u2022\u2022\u2022 ", acc.last4, " ", acc.frozen ? '(Congelada)' : ''] }, acc.last4))) }), errorAccount && (_jsx(Typography, { color: "error", variant: "caption", children: "Selecciona una cuenta v\u00E1lida y activa" }))] }), _jsx(TextField, { fullWidth: true, margin: "normal", label: "Monto a enviar *", type: "number", value: amount, onChange: e => setAmount(e.target.value), error: errorAmount || errorBalance, helperText: errorAmount
                            ? 'Monto debe ser un número positivo'
                            : errorBalance
                                ? 'Saldo insuficiente'
                                : '', inputProps: { min: 1 } })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: handleClose, color: "secondary", children: "Cancelar" }), _jsx(Button, { onClick: handleTransfer, variant: "contained", color: "primary", children: "Enviar" })] })] }));
};
export default TransferModal;
