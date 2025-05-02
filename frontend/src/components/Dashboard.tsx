import React from 'react';
import { Box, Typography, Paper, Button, List, ListItem } from '@mui/material';
import NeonParticlesBackground from './NeonParticlesBackground';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { Link as RouterLink } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <Box
      minHeight="100vh"
      width="100vw"
      display="flex"
      flexDirection="column"
      position="relative"
      sx={{ background: 'linear-gradient(90deg, #2E3192 0%, #1BFFFF 100%)', overflow: 'hidden' }}
    >
      {/* Header/Navbar */}
      <Box
        component="header"
        width="100%"
        maxWidth="100vw"
        sx={{
          px: { xs: 2, sm: 4 },
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(12, 10, 30, 0.85)',
          borderBottom: '1.5px solid rgba(44,255,255,0.08)',
          zIndex: 2,
          position: 'relative',
          overflowX: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <AccountBalanceIcon sx={{ color: '#FFD600', fontSize: 32 }} />
          <Typography variant="h6" fontWeight={700} color="#fff">
            ATENEA BANK
          </Typography>
        </Box>
        <Box display="flex" gap={4}>
          <RouterLink to="/" style={{ color: '#1BFFFF', textDecoration: 'none', fontWeight: 500 }}>Home</RouterLink>
          <RouterLink to="/about" style={{ color: '#1BFFFF', textDecoration: 'none', fontWeight: 500 }}>About</RouterLink>
          <RouterLink to="/contact" style={{ color: '#1BFFFF', textDecoration: 'none', fontWeight: 500 }}>Contact</RouterLink>
        </Box>
      </Box>
      {/* Background */}
      <Box position="absolute" top={0} left={0} width="100%" height="100%" zIndex={0}>
        <NeonParticlesBackground />
      </Box>
      {/* Centered Dashboard Card */}
      <Box
        position="relative"
        zIndex={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
        flex={1}
        width="100vw"
        minHeight="calc(100vh - 80px)"
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            minWidth: 500,
            maxWidth: 700,
            mx: 2,
            background: 'rgba(18, 22, 39, 0.97)',
            borderRadius: 4,
            boxShadow:
              '0 0 32px 8px #1BFFFF55, 0 0 0 1.5px #1BFFFF44, 0 8px 32px #000',
            color: '#fff',
            border: '1.5px solid #222E50',
          }}
        >
          <Typography variant="h4" align="left" fontWeight={700} mb={3}>
            Dashboard
          </Typography>
          {/* Total Balance Card */}
          <Box mb={4}>
            <Paper
              elevation={0}
              sx={{
                background: 'linear-gradient(90deg, #1BFFFF22 0%, #2E319222 100%)',
                borderRadius: 3,
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                boxShadow: '0 0 24px 4px #1BFFFF55',
                mb: 2,
              }}
            >
              <Typography variant="subtitle2" color="#A6B1E1" fontWeight={500} mb={0.5}>
                Total Balance
              </Typography>
              <Typography
                variant="h3"
                fontWeight={700}
                sx={{
                  color: '#1BFFFF',
                  textShadow: '0 0 12px #1BFFFF88',
                  letterSpacing: 1,
                }}
              >
                $12,345.67
              </Typography>
            </Paper>
          </Box>
          {/* Account Cards Row */}
          <Box mb={4}>
            <Box display="flex" gap={3} flexWrap="nowrap">
              {/* Active Account Card */}
              <Paper
                elevation={6}
                sx={{
                  background: 'linear-gradient(120deg, #2E3192 60%, #1BFFFF 100%)',
                  borderRadius: 4,
                  minWidth: 260,
                  maxWidth: 320,
                  p: 3,
                  color: '#fff',
                  boxShadow: '0 4px 32px #1BFFFF44',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                }}
              >
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Box
                    sx={{
                      width: 32,
                      height: 24,
                      borderRadius: '4px',
                      background: 'linear-gradient(120deg, #fff 60%, #1BFFFF 100%)',
                      boxShadow: '0 0 8px #1BFFFF99',
                      mr: 1,
                    }}
                  />
                  <Typography variant="subtitle2" fontWeight={600} color="#fff" letterSpacing={2}>
                    Bank
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  letterSpacing={2}
                  sx={{ mb: 1, fontFamily: 'monospace', userSelect: 'none' }}
                >
                  •••• 7526
                </Typography>
                <Typography variant="body2" color="#A6B1E1" fontWeight={500}>
                  Charles Arnett
                </Typography>
              </Paper>
              {/* Add Account Card */}
              <Paper
                elevation={0}
                sx={{
                  minWidth: 260,
                  maxWidth: 320,
                  p: 3,
                  border: '2px dashed #A6B1E1',
                  borderRadius: 4,
                  background: 'rgba(24,28,47,0.4)',
                  color: '#A6B1E1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.7,
                  cursor: 'not-allowed',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '2px dashed #A6B1E1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1,
                  }}
                >
                  <span style={{ fontSize: 28, color: '#A6B1E1' }}>+</span>
                </Box>
                <Typography fontWeight={600} sx={{ color: '#A6B1E1' }}>
                  Add Account
                </Typography>
              </Paper>
            </Box>
          </Box>
          {/* Dashboard Action Buttons */}
          <Box display="flex" justifyContent="center" gap={3} mb={3}>
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(90deg, #2E3192 0%, #1BFFFF 100%)',
                color: '#fff',
                fontWeight: 700,
                px: 4,
                py: 1.2,
                fontSize: 18,
                borderRadius: 2,
                boxShadow: '0 0 12px #1BFFFF66',
                textTransform: 'none',
                letterSpacing: 1,
                '&:hover': {
                  background: 'linear-gradient(90deg, #1BFFFF 0%, #2E3192 100%)',
                },
              }}
            >
              Top Up
            </Button>
            <Button
              variant="outlined"
              sx={{
                color: '#1BFFFF',
                borderColor: '#1BFFFF',
                fontWeight: 700,
                px: 4,
                py: 1.2,
                fontSize: 18,
                borderRadius: 2,
                textTransform: 'none',
                letterSpacing: 1,
                '&:hover': {
                  borderColor: '#2E3192',
                  background: 'rgba(27,255,255,0.08)',
                },
              }}
            >
              Transfer
            </Button>
          </Box>
          {/* Transaction List */}
          <Box mt={3}>
            <Typography variant="h6" fontWeight={700} color="#fff" mb={2}>
              Lista de transacciones
            </Typography>
            {(() => {
              const transactions = [
                {
                  date: '02/05/2025',
                  description: 'Pago luz',
                  type: 'expense',
                  amount: '- $80.00',
                },
                {
                  date: '01/05/2025',
                  description: 'Transferencia recibida',
                  type: 'income',
                  amount: '+ $1,000.00',
                },
                {
                  date: '30/04/2025',
                  description: 'Pago supermercado',
                  type: 'expense',
                  amount: '- $250.50',
                },
                {
                  date: '29/04/2025',
                  description: 'Depósito',
                  type: 'income',
                  amount: '+ $500.00',
                },
                {
                  date: '28/04/2025',
                  description: 'Cuenta abierta',
                  type: 'special',
                  amount: 'Evento',
                },
                {
                  date: '27/04/2025',
                  description: 'Pago Netflix',
                  type: 'expense',
                  amount: '- $15.00',
                },
              ];
              const getColor = (type: string) =>
                type === 'income' ? '#00e676' : type === 'expense' ? '#ff1744' : '#FFD600';
              return (
                <List sx={{ width: '100%', bgcolor: 'transparent', p: 0 }}>
                  {transactions.slice(0, 5).map((tx, idx) => (
                    <ListItem
                      key={idx}
                      sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0 }}
                    >
                      <Box>
                        <Typography fontWeight={600} color="#A6B1E1">{tx.date}</Typography>
                        <Typography variant="body2" color={tx.type === 'special' ? '#FFD600' : '#fff'}>{tx.description}</Typography>
                      </Box>
                      <Typography fontWeight={700} sx={{ color: getColor(tx.type), fontFamily: 'monospace', fontSize: 18 }}>{tx.amount}</Typography>
                    </ListItem>
                  ))}
                </List>
              );
            })()}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
