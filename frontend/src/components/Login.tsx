import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Box, Button, TextField, Typography, Paper, Link } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NeonParticlesBackground from './NeonParticlesBackground';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const gradient = 'linear-gradient(90deg, #2E3192 0%, #1BFFFF 100%)';

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        enqueueSnackbar('Login successful!', { variant: 'success' });
        // Redirect or update auth state here
      } else {
        enqueueSnackbar(data.message || 'Login failed', { variant: 'error' });
      }
    } catch {
      enqueueSnackbar('Network error', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minHeight="100vh"
      width="100vw"
      display="flex"
      flexDirection="column"
      position="relative"
      sx={{ background: gradient, overflow: 'hidden' }}
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
      {/* Centered Login Card */}
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
            minWidth: 340,
            maxWidth: 400,
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
            {t('Login')}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label={t('Email')}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              InputProps={{
                sx: {
                  background: '#181C2F',
                  borderRadius: 2,
                  color: '#fff',
                  boxShadow: '0 0 8px #1BFFFF33',
                  input: { color: '#fff' },
                },
              }}
              InputLabelProps={{ sx: { color: '#A6B1E1' } }}
            />
            <TextField
              label={t('Password')}
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              InputProps={{
                sx: {
                  background: '#181C2F',
                  borderRadius: 2,
                  color: '#fff',
                  boxShadow: '0 0 8px #1BFFFF33',
                  input: { color: '#fff' },
                },
              }}
              InputLabelProps={{ sx: { color: '#A6B1E1' } }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 3,
                fontWeight: 700,
                py: 1.2,
                fontSize: 18,
                background: 'linear-gradient(90deg, #2E3192 0%, #1BFFFF 100%)',
                boxShadow: '0 0 12px #1BFFFF66',
                borderRadius: 2,
                textTransform: 'none',
                letterSpacing: 1,
                '&:hover': {
                  background: 'linear-gradient(90deg, #1BFFFF 0%, #2E3192 100%)',
                },
              }}
              disabled={loading}
            >
              {loading ? t('Logging in...') : t('Login')}
            </Button>
          </form>
          <Box mt={3} textAlign="center">
            <Typography variant="body2" color="#A6B1E1">
              {t("Don't have an account?")} &nbsp;
              <Link component={RouterLink} to="/signup" sx={{ color: '#1BFFFF', fontWeight: 600 }}>
                {t('Sign Up')}
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;
