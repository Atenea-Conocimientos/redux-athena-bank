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
  onCreate: (account: { type: string; amount: number }) => void;
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Crear nueva cuenta</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal" error={errorType}>
          <InputLabel id="account-type-label">Tipo de cuenta *</InputLabel>
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
            <Typography color="error" variant="caption">Tipo de cuenta requerido</Typography>
          )}
        </FormControl>
        <TextField
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
        <Button onClick={handleClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleCreate} variant="contained" color="primary">
          Crear cuenta
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAccountModal;
