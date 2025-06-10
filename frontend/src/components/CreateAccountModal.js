import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem, Select, InputLabel, FormControl, TextField, Typography } from '@mui/material';
const accountTypes = [
    { value: 'debit', label: 'Débito' },
    { value: 'credit', label: 'Crédito' },
    { value: 'savings', label: 'Ahorros' },
    { value: 'checking', label: 'Corriente' },
];
const CreateAccountModal = ({ open, onClose, onCreate }) => {
    const [type, setType] = useState('');
    const [amount, setAmount] = useState('');
    const [errorType, setErrorType] = useState(false);
    const [errorAmount, setErrorAmount] = useState(false);
    const handleCreate = () => {
        let valid = true;
        setErrorType(false);
        setErrorAmount(false);
        if (!type) {
            setErrorType(true);
            valid = false;
        }
        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount < 0) {
            setErrorAmount(true);
            valid = false;
        }
        if (valid) {
            onCreate({ type, amount: numAmount });
            setType('');
            setAmount('');
        }
    };
    const handleClose = () => {
        setType('');
        setAmount('');
        setErrorType(false);
        setErrorAmount(false);
        onClose();
    };
    return (_jsxs(Dialog, { "data-testid": "modal-crear-cuenta", open: open, onClose: handleClose, maxWidth: "xs", fullWidth: true, children: [_jsx(DialogTitle, { "data-testid": "titulo-modal-crear-cuenta", children: "Crear nueva cuenta" }), _jsxs(DialogContent, { children: [_jsxs(FormControl, { fullWidth: true, margin: "normal", error: errorType, children: [_jsx(InputLabel, { "data-testid": "etiqueta-tipo-cuenta", id: "account-type-label", children: "Tipo de cuenta *" }), _jsxs(Select, { fullWidth: true, labelId: "account-type-label", id: "account-type", value: type, label: "Tipo de cuenta *", onChange: e => setType(e.target.value), variant: "outlined", displayEmpty: true, MenuProps: { container: document.body }, children: [_jsx(MenuItem, { value: "", disabled: true, children: _jsx("em", {}) }), accountTypes.map(opt => (_jsx(MenuItem, { value: opt.value, children: opt.label }, opt.value)))] }), errorType && (_jsx(Typography, { "data-testid": "texto-error-tipo-cuenta", color: "error", variant: "caption", children: "Tipo de cuenta requerido" }))] }), _jsx(TextField, { "data-testid": "input-monto-inicial", fullWidth: true, margin: "normal", label: "Monto inicial *", type: "number", value: amount, onChange: e => setAmount(e.target.value), error: errorAmount, helperText: errorAmount ? 'Monto debe ser un número mayor o igual a 0' : '', inputProps: { min: 0 } })] }), _jsxs(DialogActions, { children: [_jsx(Button, { "data-testid": "boton-cancelar-crear-cuenta", onClick: handleClose, color: "secondary", children: "Cancelar" }), _jsx(Button, { "data-testid": "boton-crear-cuenta", onClick: handleCreate, variant: "contained", color: "primary", children: "Crear cuenta" })] })] }));
};
export default CreateAccountModal;
