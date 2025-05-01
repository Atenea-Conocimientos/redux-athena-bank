import React from 'react';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

const gradient = 'linear-gradient(90deg, #2E3192 0%, #1BFFFF 100%)';

const SignUp: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        minWidth: '100vw',
        background: 'radial-gradient(circle at 20% 30%, #2e3192 0%, #1bffff 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* Header and Nav */}
      <Box sx={{
        width: '100%',
        maxWidth: 540,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: { xs: 2, sm: 4 },
        mt: { xs: 2, sm: 4 },
      }}>
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
      {/* Sign Up Form */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <Paper
          elevation={12}
          sx={{
            px: { xs: 2, sm: 6 },
            py: { xs: 4, sm: 7 },
            borderRadius: 6,
            background: 'rgba(16, 20, 38, 0.95)',
            boxShadow: '0 0 32px 8px #1bffff44',
            minWidth: { xs: 280, sm: 380 },
            maxWidth: 420,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography variant="h3" fontWeight={700} color="#fff" mb={4}>
            {t('welcome', 'Sign Up')}
          </Typography>
          <TextField
            variant="outlined"
            fullWidth
            label={t('firstName', 'First name')}
            sx={{ mb: 3, input: { color: '#fff' }, label: { color: '#1BFFFF' } }}
            InputLabelProps={{ style: { color: '#1BFFFF' } }}
          />
          <TextField
            variant="outlined"
            fullWidth
            label={t('lastName', 'Last name')}
            sx={{ mb: 3, input: { color: '#fff' }, label: { color: '#1BFFFF' } }}
            InputLabelProps={{ style: { color: '#1BFFFF' } }}
          />
          <TextField
            variant="outlined"
            fullWidth
            label={t('email', 'Email')}
            sx={{ mb: 3, input: { color: '#fff' }, label: { color: '#1BFFFF' } }}
            InputLabelProps={{ style: { color: '#1BFFFF' } }}
          />
          <TextField
            variant="outlined"
            fullWidth
            type="password"
            label={t('password', 'Password')}
            sx={{ mb: 4, input: { color: '#fff' }, label: { color: '#1BFFFF' } }}
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
