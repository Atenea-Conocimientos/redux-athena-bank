import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  TextField,
  Typography
} from '@mui/material';

interface CreateAccountModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (account: { type: "debit" | "credit" | "savings" | "checking"; amount: number }) => void;
}

const accountTypes = [
  { value: 'debit', label: 'Débito' },
  { value: 'credit', label: 'Crédito' },
  { value: 'savings', label: 'Ahorros' },
  { value: 'checking', label: 'Corriente' },
];

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({ open, onClose, onCreate }) => {
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
      onCreate({ type: type as "debit" | "credit" | "savings" | "checking", amount: numAmount });
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

  return (
    <Dialog data-testid="modal-crear-cuenta" open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle data-testid="titulo-modal-crear-cuenta">Crear nueva cuenta</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal" error={errorType}>
          <InputLabel data-testid="etiqueta-tipo-cuenta" id="account-type-label">Tipo de cuenta *</InputLabel>
          <Select
            fullWidth
            labelId="account-type-label"
            id="account-type"
            value={type}
            label="Tipo de cuenta *"
            onChange={e => setType(e.target.value)}
            variant="outlined"
            displayEmpty
            MenuProps={{ container: document.body }}
          >
            <MenuItem value="" disabled>
              <em></em>
            </MenuItem>
            {accountTypes.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          {errorType && (
            <Typography data-testid="texto-error-tipo-cuenta" color="error" variant="caption">Tipo de cuenta requerido</Typography>
          )}
        </FormControl>
        <TextField
          data-testid="input-monto-inicial"
          fullWidth
          margin="normal"
          label="Monto inicial *"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          error={errorAmount}
          helperText={errorAmount ? 'Monto debe ser un número mayor o igual a 0' : ''}
          inputProps={{ min: 0 }}
        />
      </DialogContent>
      <DialogActions>
        <Button data-testid="boton-cancelar-crear-cuenta" onClick={handleClose} color="secondary">
          Cancelar
        </Button>
        <Button data-testid="boton-crear-cuenta" onClick={handleCreate} variant="contained" color="primary">
          Crear cuenta
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAccountModal;
