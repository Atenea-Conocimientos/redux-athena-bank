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
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

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
        enqueueSnackbar('Registro exitoso!', { variant: 'success' });
        setForm({ firstName: '', lastName: '', email: '', password: '' });
        navigate('/login');
      } else {
        enqueueSnackbar(data.message || 'Registro fallido', { variant: 'error' });
      }
    } catch {
      alert('Error de red');
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
      <Box component="header" width="100%" maxWidth="100vw" sx={{
        px: { xs: 2, sm: 4 },
        py: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(12,10,30,0.85)',
        borderBottom: '1.5px solid rgba(44,255,255,0.08)',
        zIndex: 2,
        position: 'fixed',
        top: 0,
        left: 0,
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <AccountBalanceIcon sx={{ color: '#FFD600', fontSize: 32 }} />
          <Typography variant="h6" fontWeight={700} color="#fff">
            ATENEA BANK
          </Typography>
        </Box>
        <Box display="flex" gap={4} data-testid="navbar-signup">
          <RouterLink to="/" data-testid="nav-inicio-signup" style={{ color: '#1BFFFF', textDecoration: 'none', fontWeight: 500 }}>Inicio</RouterLink>
          <RouterLink to="/about" data-testid="nav-acerca-signup" style={{ color: '#1BFFFF', textDecoration: 'none', fontWeight: 500 }}>Acerca de</RouterLink>
          <RouterLink to="/contact" data-testid="nav-contacto-signup" style={{ color: '#1BFFFF', textDecoration: 'none', fontWeight: 500 }}>Contacto</RouterLink>
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
          <form onSubmit={handleSubmit} autoComplete="off" data-testid="formulario-registro">
            <Typography variant="h3" fontWeight={700} color="#fff" mb={4} data-testid="titulo-registro">
              Registrarse
            </Typography>

            {[
              { name: 'firstName', label: 'Nombre' },
              { name: 'lastName', label: 'Apellido' },
              { name: 'email', label: 'Correo electrónico' },
              { name: 'password', label: 'Contraseña', type: 'password' },
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
                data-testid={`input-${name}-registro`}
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
              data-testid="boton-registrarse"
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </Button>
          </form>
        </Paper>
        <Box mt={2} textAlign="center">
          <Typography variant="body2" data-testid="texto-pregunta-cuenta">
            ¿Ya tienes cuenta?{' '}
            <RouterLink to="/login" data-testid="link-iniciar-sesion-signup">Iniciar sesión</RouterLink>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default SignUp;
