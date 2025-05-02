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
  balance?: number;
}

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  onTransfer: (originLast4: string, recipientEmail: string, amount: number) => void;
  accounts: AccountOption[];
}

const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const TransferModal: React.FC<TransferModalProps> = ({ open, onClose, onTransfer, accounts }) => {
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Enviar transferencia</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          margin="normal"
          label="Email del destinatario *"
          value={recipientEmail}
          onChange={e => setRecipientEmail(e.target.value)}
          error={errorEmail}
          helperText={errorEmail ? 'Email inválido' : ''}
        />
        <FormControl fullWidth margin="normal" error={errorAccount}>
          <InputLabel id="origin-account-label">Cuenta origen *</InputLabel>
          <Select
            labelId="origin-account-label"
            value={originLast4}
            label="Cuenta origen *"
            onChange={e => setOriginLast4(e.target.value)}
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
          label="Monto a enviar *"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          error={errorAmount || errorBalance}
          helperText={
            errorAmount
              ? 'Monto debe ser un número positivo'
              : errorBalance
              ? 'Saldo insuficiente'
              : ''
          }
          inputProps={{ min: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleTransfer} variant="contained" color="primary">
          Enviar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferModal;
