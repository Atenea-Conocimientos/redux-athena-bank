import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Box, Button, TextField, Typography, Paper, Link } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from './AuthContext';
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
  const { setToken } = useAuth();

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
        if (data.token) {
          setToken(data.token);
        }
        enqueueSnackbar('Inicio de sesión exitoso', { variant: 'success' });
        navigate('/dashboard');
      } else {
        enqueueSnackbar(data.message || 'Error al iniciar sesión', { variant: 'error' });
      }
    } catch {
      enqueueSnackbar('Error de red', { variant: 'error' });
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
      sx={{ background: gradient, overflow: 'hidden', pt: 12 }}
    >
      {/* Header */}
      <Box component="header" width="100%" maxWidth="100vw" sx={{
        px: { xs: 2, sm: 4 }, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(12,10,30,0.85)', borderBottom: '1.5px solid rgba(44,255,255,0.08)', position: 'fixed', top: 0, left: 0, zIndex: 2, boxSizing: 'border-box'
      }}>
        <Box component={RouterLink} to="/" data-testid="logo-header-login" display="flex" alignItems="center" gap={1}>
          <AccountBalanceIcon sx={{ color: '#FFD600', fontSize: 32 }} />
          <Typography variant="h6" fontWeight={700} color="#fff">ATENEA BANK</Typography>
        </Box>
        <Button component={RouterLink} to="/signup" variant="outlined" sx={{ color: '#1BFFFF', borderColor: '#1BFFFF', '&:hover': { background: 'rgba(27,255,255,0.08)' } }} data-testid="boton-signup-header">Crear cuenta</Button>
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
          <Typography variant="h4" align="left" fontWeight={700} mb={3} data-testid="titulo-login">
            Iniciar sesión
          </Typography>
          <form onSubmit={handleSubmit} data-testid="formulario-login">
            <TextField
              data-testid="input-correo-login"
              label="Correo electrónico"
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
              data-testid="input-contrasena-login"
              label="Contraseña"
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
              data-testid="boton-login"
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
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>
          <Box mt={3} textAlign="center">
            <Typography variant="body2" data-testid="texto-pregunta-cuenta-login">
              ¿No tienes cuenta? &nbsp;
              <Link component={RouterLink} to="/signup" data-testid="link-registrarse-login" sx={{ color: '#1BFFFF', fontWeight: 600 }}>
                Registrarse
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;
