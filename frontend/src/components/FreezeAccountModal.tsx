import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';

interface FreezeAccountModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  accountName: string;
  last4: string;
  frozen: boolean;
}

const FreezeAccountModal: React.FC<FreezeAccountModalProps> = ({ open, onClose, onConfirm, accountName, last4, frozen }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{frozen ? 'Descongelar cuenta' : 'Congelar cuenta'}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" mt={2}>
          {/* Optional: Ice/Sun Animation Placeholder */}
          <Box mb={2}>
            {frozen ? (
              <span style={{ fontSize: 38, color: '#FFD600' }}>☀️</span>
            ) : (
              <span style={{ fontSize: 38, color: '#00e6ff' }}>❄️</span>
            )}
          </Box>
          <Typography variant="h6" fontWeight={700} mb={1}>
            {accountName} •••• {last4}
          </Typography>
          <Typography align="center">
            {frozen
              ? '¿Seguro que querés descongelar esta cuenta?'
              : '¿Seguro que querés congelar esta cuenta?'}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={onConfirm} variant="contained" color={frozen ? 'warning' : 'primary'}>
          {frozen ? 'Descongelar' : 'Congelar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FreezeAccountModal;
