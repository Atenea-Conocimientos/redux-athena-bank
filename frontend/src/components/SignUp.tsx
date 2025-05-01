import React from 'react';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import NeonParticlesBackground from './NeonParticlesBackground';

const gradient = 'linear-gradient(90deg, #2E3192 0%, #1BFFFF 100%)';

const SignUp: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        minWidth: '100vw',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <NeonParticlesBackground />
      {/* Header and Nav - now always at the top */}
      <Box
        sx={{
          width: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 10,
          bgcolor: 'rgba(10, 12, 30, 0.85)',
          borderBottom: '1px solid #22224a',
          boxShadow: '0 2px 16px 0 #1bffff22',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 900,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: { xs: 2, sm: 4 },
            py: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'rgba(46,49,146,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
              }}
            >
              <Typography color="#1BFFFF" fontWeight={700} fontSize={24}>
                &#x1F9D1;
              </Typography>
            </Box>
            <Typography variant="h5" color="#fff" fontWeight={600}>
              ATENEA BANK
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 5 }}>
            <Typography color="#1BFFFF" sx={{ cursor: 'pointer' }}>
              Home
            </Typography>
            <Typography color="#1BFFFF" sx={{ cursor: 'pointer' }}>
              About
            </Typography>
            <Typography color="#1BFFFF" sx={{ cursor: 'pointer' }}>
              Contact
            </Typography>
          </Box>
        </Box>
      </Box>
      {/* Sign Up Form */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <Paper
          elevation={12}
          sx={{
            px: { xs: 2, sm: 6 },
            py: { xs: 4, sm: 7 },
            borderRadius: 6,
            background: 'rgba(16, 20, 38, 0.95)', // solid glassmorphic background
            boxShadow: '0 0 32px 8px #1bffff77, 0 0 0 1px #1bffff33', // stronger neon glow
            minWidth: { xs: 280, sm: 380 },
            maxWidth: 420,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backdropFilter: 'blur(2px)',
          }}
        >
          <Typography variant="h3" fontWeight={700} color="#fff" mb={4}>
            {t('welcome', 'Sign Up')}
          </Typography>
          <TextField
            variant="outlined"
            fullWidth
            label={t('firstName', 'First name')}
            sx={{
              mb: 3,
              input: { color: '#fff' },
              label: { color: '#1BFFFF' },
              '& .MuiOutlinedInput-notchedOutline': {
                boxShadow: '0 0 8px 2px #fff8, 0 0 2px 0 #1bffff44',
                borderColor: '#fff',
                transition: 'box-shadow 0.3s, border-color 0.3s',
              },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                boxShadow: '0 0 16px 4px #fff, 0 0 8px 2px #1bffff88',
                borderColor: '#1bffff',
              },
            }}
            InputLabelProps={{ style: { color: '#1BFFFF' } }}
          />
          <TextField
            variant="outlined"
            fullWidth
            label={t('lastName', 'Last name')}
            sx={{
              mb: 3,
              input: { color: '#fff' },
              label: { color: '#1BFFFF' },
              '& .MuiOutlinedInput-notchedOutline': {
                boxShadow: '0 0 8px 2px #fff8, 0 0 2px 0 #1bffff44',
                borderColor: '#fff',
                transition: 'box-shadow 0.3s, border-color 0.3s',
              },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                boxShadow: '0 0 16px 4px #fff, 0 0 8px 2px #1bffff88',
                borderColor: '#1bffff',
              },
            }}
            InputLabelProps={{ style: { color: '#1BFFFF' } }}
          />
          <TextField
            variant="outlined"
            fullWidth
            label={t('email', 'Email')}
            sx={{
              mb: 3,
              input: { color: '#fff' },
              label: { color: '#1BFFFF' },
              '& .MuiOutlinedInput-notchedOutline': {
                boxShadow: '0 0 8px 2px #fff8, 0 0 2px 0 #1bffff44',
                borderColor: '#fff',
                transition: 'box-shadow 0.3s, border-color 0.3s',
              },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                boxShadow: '0 0 16px 4px #fff, 0 0 8px 2px #1bffff88',
                borderColor: '#1bffff',
              },
            }}
            InputLabelProps={{ style: { color: '#1BFFFF' } }}
          />
          <TextField
            variant="outlined"
            fullWidth
            type="password"
            label={t('password', 'Password')}
            sx={{
              mb: 4,
              input: { color: '#fff' },
              label: { color: '#1BFFFF' },
              '& .MuiOutlinedInput-notchedOutline': {
                boxShadow: '0 0 8px 2px #fff8, 0 0 2px 0 #1bffff44',
                borderColor: '#fff',
                transition: 'box-shadow 0.3s, border-color 0.3s',
              },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                boxShadow: '0 0 16px 4px #fff, 0 0 8px 2px #1bffff88',
                borderColor: '#1bffff',
              },
            }}
            InputLabelProps={{ style: { color: '#1BFFFF' } }}
          />
          <Button
            variant="contained"
            fullWidth
            sx={{
              fontWeight: 700,
              fontSize: 22,
              py: 1.5,
              borderRadius: 8,
              background: gradient,
              boxShadow: '0 0 24px 4px #1bffff44',
              color: '#fff',
              textTransform: 'none',
              transition: 'background 0.3s',
              '&:hover': {
                background:
                  'linear-gradient(90deg, #1BFFFF 0%, #2E3192 100%)',
              },
            }}
          >
            {t('signUp', 'Sign Up')}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default SignUp;
