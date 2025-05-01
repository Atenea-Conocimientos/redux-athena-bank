import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import NeonParticlesBackground from './NeonParticlesBackground';

const gradient =
  'linear-gradient(90deg, #2E3192 0%, #1BFFFF 100%)';

interface SignUpForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const SignUp: React.FC = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState<SignUpForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        'http://localhost:4000/api/auth/signup',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
          credentials: 'include', // Allow cookies/auth headers for CORS
        }
      );
      const data = await res.json();
      if (res.ok) {
        enqueueSnackbar('Signup successful!', { variant: 'success' });
        setForm({ firstName: '', lastName: '', email: '', password: '' });
        navigate('/login');
      } else {
        enqueueSnackbar(data.message || 'Signup failed', { variant: 'error' });
      }
    } catch {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };


  const isDisabled =
    loading ||
    !form.firstName ||
    !form.lastName ||
    !form.email ||
    !form.password;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        minWidth: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <NeonParticlesBackground />

      {/* Header */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          bgcolor: 'rgba(10,12,30,0.85)',
          borderBottom: '1px solid #22224a',
          boxShadow: '0 2px 16px #1bffff22',
          zIndex: 10,
        }}
      >
        <Box
          sx={{
            maxWidth: 900,
            mx: 'auto',
            px: { xs: 2, sm: 4 },
            py: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
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
                🧑‍💻
              </Typography>
            </Box>
            <Typography variant="h5" color="#fff" fontWeight={600}>
              ATENEA BANK
            </Typography>
          </Box>

          {/* dummy nav */}
          <Box sx={{ display: 'flex', gap: 5 }}>
            {['Home', 'About', 'Contact'].map((item) => (
              <Typography key={item} color="#1BFFFF" sx={{ cursor: 'pointer' }}>
                {item}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Form */}
      <Box sx={{ mt: 10, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Paper
          elevation={12}
          sx={{
            px: { xs: 2, sm: 6 },
            py: { xs: 4, sm: 7 },
            borderRadius: 6,
            background: 'rgba(16,20,38,0.95)',
            boxShadow: '0 0 32px 8px #1bffff77, 0 0 0 1px #1bffff33',
            width: '100%',
            maxWidth: 420,
            backdropFilter: 'blur(2px)',
          }}
        >
          <form onSubmit={handleSubmit} autoComplete="off">
            <Typography variant="h3" fontWeight={700} color="#fff" mb={4}>
              {t('welcome', 'Sign Up')}
            </Typography>

            {[
              { name: 'firstName', label: t('firstName', 'First name') },
              { name: 'lastName', label: t('lastName', 'Last name') },
              { name: 'email', label: t('email', 'Email') },
              { name: 'password', label: t('password', 'Password'), type: 'password' },
            ].map(({ name, label, type }) => (
              <TextField
                key={name}
                name={name}
                type={type || 'text'}
                value={(form as any)[name]}
                onChange={handleChange}
                required
                fullWidth
                variant="outlined"
                label={label}
                sx={{
                  mb: 3,
                  input: { color: '#fff' },
                  label: { color: '#1BFFFF' },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#fff',
                    boxShadow: '0 0 8px 2px #fff8, 0 0 2px #1bffff44',
                    transition: 'box-shadow .3s, border-color .3s',
                  },
                  '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1bffff',
                    boxShadow: '0 0 16px 4px #fff, 0 0 8px #1bffff88',
                  },
                }}
              />
            ))}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isDisabled}
              sx={{
                mt: 1,
                py: 1.5,
                fontWeight: 700,
                fontSize: 22,
                borderRadius: 2,
                background: gradient,
                boxShadow: '0 0 24px 4px #1bffff44',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(90deg,#1BFFFF 0%,#2E3192 100%)',
                },
              }}
            >
              {loading ? t('signingUp', 'Signing Up...') : t('signUp', 'Sign Up')}
            </Button>
          </form>
        </Paper>
        <Box mt={2} textAlign="center">
          <Typography variant="body2">
            Already have an account?{' '}
            <RouterLink to="/login">Login</RouterLink>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default SignUp;
