import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Box, Button, TextField, Typography, Paper, } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import NeonParticlesBackground from './NeonParticlesBackground';
const gradient = 'linear-gradient(90deg, #2E3192 0%, #1BFFFF 100%)';
const SignUp = () => {
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('http://localhost:4000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
                credentials: 'include', // Allow cookies/auth headers for CORS
            });
            const data = await res.json();
            if (res.ok) {
                enqueueSnackbar('Registro exitoso!', { variant: 'success' });
                setForm({ firstName: '', lastName: '', email: '', password: '' });
                navigate('/login');
            }
            else {
                enqueueSnackbar(data.message || 'Registro fallido', { variant: 'error' });
            }
        }
        catch {
            alert('Error de red');
        }
        finally {
            setLoading(false);
        }
    };
    const isDisabled = loading ||
        !form.firstName ||
        !form.lastName ||
        !form.email ||
        !form.password;
    return (_jsxs(Box, { sx: {
            minHeight: '100vh',
            minWidth: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            pt: 12,
        }, children: [_jsx(NeonParticlesBackground, {}), _jsxs(Box, { component: "header", width: "100%", maxWidth: "100vw", sx: {
                    px: { xs: 2, sm: 4 }, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(12,10,30,0.85)', borderBottom: '1.5px solid rgba(44,255,255,0.08)', position: 'fixed', top: 0, left: 0, zIndex: 2, boxSizing: 'border-box'
                }, children: [_jsxs(Box, { component: RouterLink, to: "/", "data-testid": "logo-header-signup", display: "flex", alignItems: "center", gap: 1, children: [_jsx(AccountBalanceIcon, { sx: { color: '#FFD600', fontSize: 32 } }), _jsx(Typography, { variant: "h6", fontWeight: 700, color: "#fff", children: "ATENEA BANK" })] }), _jsx(Button, { component: RouterLink, to: "/login", "data-testid": "boton-login-header-signup", variant: "outlined", sx: { color: '#1BFFFF', borderColor: '#1BFFFF', '&:hover': { background: 'rgba(27,255,255,0.08)' } }, children: "Iniciar sesi\u00F3n" })] }), _jsxs(Box, { sx: { mt: 10, width: '100%', display: 'flex', justifyContent: 'center' }, children: [_jsx(Paper, { elevation: 12, sx: {
                            px: { xs: 2, sm: 6 },
                            py: { xs: 4, sm: 7 },
                            borderRadius: 6,
                            background: 'rgba(16,20,38,0.95)',
                            boxShadow: '0 0 32px 8px #1bffff77, 0 0 0 1px #1bffff33',
                            width: '100%',
                            maxWidth: 420,
                            backdropFilter: 'blur(2px)',
                        }, children: _jsxs("form", { onSubmit: handleSubmit, autoComplete: "off", "data-testid": "formulario-registro", children: [_jsx(Typography, { variant: "h3", fontWeight: 700, color: "#fff", mb: 4, "data-testid": "titulo-registro", children: "Registrarse" }), [
                                    { name: 'firstName', label: 'Nombre' },
                                    { name: 'lastName', label: 'Apellido' },
                                    { name: 'email', label: 'Correo electrónico' },
                                    { name: 'password', label: 'Contraseña', type: 'password' },
                                ].map(({ name, label, type }) => (_jsx(TextField, { name: name, type: type || 'text', value: form[name], onChange: handleChange, required: true, fullWidth: true, variant: "outlined", label: label, "data-testid": `input-${name}-registro`, sx: {
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
                                    } }, name))), _jsx(Button, { type: "submit", fullWidth: true, variant: "contained", disabled: isDisabled, sx: {
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
                                    }, "data-testid": "boton-registrarse", children: loading ? 'Registrando...' : 'Registrarse' })] }) }), _jsx(Box, { mt: 2, textAlign: "center", children: _jsxs(Typography, { variant: "body2", "data-testid": "texto-pregunta-cuenta", children: ["\u00BFYa tienes cuenta?", ' ', _jsx(RouterLink, { to: "/login", "data-testid": "link-iniciar-sesion-signup", children: "Iniciar sesi\u00F3n" })] }) })] })] }));
};
export default SignUp;
