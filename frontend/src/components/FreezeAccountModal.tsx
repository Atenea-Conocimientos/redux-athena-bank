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
      <DialogTitle data-testid="titulo-modal-congelar-cuenta">{frozen ? 'Descongelar cuenta' : 'Congelar cuenta'}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" mt={2}>
          {/* Optional: Ice/Sun Animation Placeholder */}
          <Box mb={2}>
            {frozen ? (
              <span data-testid="icono-congelar-cuenta" style={{ fontSize: 38, color: '#FFD600' }}>☀️</span>
            ) : (
              <span data-testid="icono-descongelar-cuenta" style={{ fontSize: 38, color: '#00e6ff' }}>❄️</span>
            )}
          </Box>
          <Typography data-testid="texto-numero-cuenta" variant="h6" fontWeight={700} mb={1}>
            {accountName} •••• {last4}
          </Typography>
          <Typography data-testid="texto-confirmacion-congelar-cuenta" align="center">
            {frozen
              ? '¿Seguro que querés descongelar esta cuenta?'
              : '¿Seguro que querés congelar esta cuenta?'}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button data-testid="boton-cancelar-congelar-cuenta" onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button data-testid="boton-congelar-cuenta" onClick={onConfirm} variant="contained" color={frozen ? 'warning' : 'primary'}>
          {frozen ? 'Descongelar' : 'Congelar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FreezeAccountModal;
