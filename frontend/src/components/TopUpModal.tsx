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

interface AccountOption {
  last4: string;
  name: string;
  frozen?: boolean;
}

interface TopUpModalProps {
  open: boolean;
  onClose: () => void;
  onTopUp: (last4: string, amount: number) => void;
  accounts: AccountOption[];
}

const TopUpModal: React.FC<TopUpModalProps> = ({ open, onClose, onTopUp, accounts }) => {
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Agregar fondos</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal" error={errorAccount}>
          <InputLabel id="account-select-label">Cuenta *</InputLabel>
          <Select
            labelId="account-select-label"
            value={selectedLast4}
            label="Cuenta *"
            onChange={e => setSelectedLast4(e.target.value)}
          >
            {accounts.map(acc => (
              <MenuItem key={acc.last4} value={acc.last4} disabled={acc.frozen}>
                •••• {acc.last4} {acc.frozen ? '(Congelada)' : ''}
              </MenuItem>
            ))}
          </Select>
          {errorAccount && (
            <Typography color="error" variant="caption">Selecciona una cuenta válida y activa</Typography>
          )}
        </FormControl>
        <TextField
          fullWidth
          margin="normal"
          label="Monto a agregar *"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          error={errorAmount}
          helperText={errorAmount ? 'Monto debe ser un número positivo' : ''}
          inputProps={{ min: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleTopUp} variant="contained" color="primary">
          Agregar fondos
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TopUpModal;
