import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Paper, Button, } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useSnackbar } from 'notistack';
import { useAuth } from './AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { getAccounts, createAccount, freezeAccount, deleteAccount, depositFunds, transferFunds, getTransactions, logout } from '../api';
import CreateAccountModal from './CreateAccountModal';
import TopUpModal from './TopUpModal';
import TransferModal from './TransferModal';
import FreezeAccountModal from './FreezeAccountModal';
import NeonParticlesBackground from './NeonParticlesBackground';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
/** ------------------------------------------------------------------
 *  Helpers
 * -----------------------------------------------------------------*/
const gradientByType = {
    debit: 'linear-gradient(120deg, #6C63FF 60%, #1BFFFF 100%)', // blue / purple
    credit: 'linear-gradient(120deg, #D4145A 60%, #FBB03B 100%)', // pink / orange
    savings: 'linear-gradient(120deg, #11998e 60%, #38ef7d 100%)', // green / teal
    checking: 'linear-gradient(120deg, #FF512F 60%, #F09819 100%)', // red / orange
};
const randomLast4 = () => Math.floor(1000 + Math.random() * 9000).toString();
// Etiquetas de tipos traducidos a español
const typeLabels = {
    debit: 'Débito',
    credit: 'Crédito',
    savings: 'Ahorros',
    checking: 'Corriente',
};
/** ------------------------------------------------------------------
 *  Dashboard component
 * -----------------------------------------------------------------*/
const Dashboard = () => {
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const { setToken } = useAuth();
    /** ------------------------------------------------------
     *  Local state
     * -----------------------------------------------------*/
    const [accounts, setAccounts] = React.useState([]);
    const [transactions, setTransactions] = React.useState([]);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [topUpModalOpen, setTopUpModalOpen] = React.useState(false);
    const [transferModalOpen, setTransferModalOpen] = React.useState(false);
    const [freezeModalOpen, setFreezeModalOpen] = React.useState(false);
    const [selectedAccount, setSelectedAccount] = React.useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
    const [accountToDelete, setAccountToDelete] = React.useState('');
    const { token } = useAuth();
    // Suma de todos los balances
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    // Fetch accounts from backend on mount
    React.useEffect(() => {
        if (token) {
            getAccounts(token)
                .then(apiAccounts => {
                setAccounts(apiAccounts.map(acc => ({
                    ...acc,
                    color: gradientByType[acc.type],
                })));
            })
                .catch(() => enqueueSnackbar('Error al obtener cuentas', { variant: 'error' }));
        }
    }, [token]);
    // Fetch transactions
    React.useEffect(() => {
        if (token) {
            getTransactions(token)
                .then(setTransactions)
                .catch(() => enqueueSnackbar('Error al obtener transacciones', { variant: 'error' }));
        }
    }, [token]);
    // Handlers
    const handleAddAccount = async (payload) => {
        if (!token)
            return;
        try {
            const newAcc = await createAccount(token, payload.type, payload.amount);
            setAccounts(prev => [...prev, { ...newAcc, color: gradientByType[newAcc.type] }]);
            setModalOpen(false);
            enqueueSnackbar('¡Cuenta creada exitosamente!', { variant: 'success' });
            // Refresh transactions list
            const txs = await getTransactions(token);
            setTransactions(txs);
        }
        catch {
            enqueueSnackbar('Error al crear cuenta', { variant: 'error' });
        }
    };
    const handleFreezeToggle = async () => {
        if (!token || !selectedAccount)
            return;
        try {
            const updated = await freezeAccount(token, selectedAccount._id, !selectedAccount.frozen);
            setAccounts(prev => prev.map(acc => acc._id === updated._id ? { ...updated, color: gradientByType[updated.type] } : acc));
            setFreezeModalOpen(false);
            enqueueSnackbar(updated.frozen ? 'Cuenta congelada ❄️' : 'Cuenta descongelada ☀️', { variant: 'info' });
            // Refrescar solo lista de transacciones tras cambio de estado
            const txs = await getTransactions(token);
            setTransactions(txs);
        }
        catch {
            enqueueSnackbar('Error al congelar/descongelar', { variant: 'error' });
        }
    };
    const handleDeleteAccount = async () => {
        if (!token || !accountToDelete) {
            enqueueSnackbar('Seleccione una cuenta para eliminar', { variant: 'warning' });
            return;
        }
        try {
            await deleteAccount(token, accountToDelete);
            setAccounts(prev => prev.filter(acc => acc._id !== accountToDelete));
            enqueueSnackbar('Cuenta eliminada exitosamente', { variant: 'success' });
            // Refresh transactions list
            const txs = await getTransactions(token);
            setTransactions(txs);
        }
        catch {
            enqueueSnackbar('Error al eliminar cuenta', { variant: 'error' });
        }
        finally {
            setAccountToDelete('');
        }
    };
    const handleTopUp = async (last4, amount) => {
        if (!token)
            return;
        const acc = accounts.find(a => a.last4 === last4);
        if (!acc) {
            enqueueSnackbar('Cuenta no encontrada', { variant: 'error' });
            return;
        }
        try {
            const updated = await depositFunds(token, acc._id, amount);
            setAccounts(prev => prev.map(a => a._id === updated._id
                ? { ...updated, color: gradientByType[updated.type] }
                : a));
            setTopUpModalOpen(false);
            enqueueSnackbar('¡Fondos agregados exitosamente!', { variant: 'success' });
            // Refrescar transacciones tras depósito
            const txs = await getTransactions(token);
            setTransactions(txs);
        }
        catch {
            enqueueSnackbar('Error al agregar fondos', { variant: 'error' });
        }
    };
    const handleTransfer = async (originLast4, recipientEmail, amount) => {
        if (!token)
            return;
        const acc = accounts.find(a => a.last4 === originLast4);
        if (!acc) {
            enqueueSnackbar('Cuenta no encontrada', { variant: 'error' });
            return;
        }
        try {
            await transferFunds(token, acc._id, recipientEmail, amount);
            // Update local balance
            setAccounts(prev => prev.map(a => a._id === acc._id ? { ...a, balance: a.balance - amount } : a));
            enqueueSnackbar(`Transferencia enviada a ${recipientEmail}`, { variant: 'success' });
            // Refresh transactions list
            const txs = await getTransactions(token);
            setTransactions(txs);
        }
        catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Error al transferir', { variant: 'error' });
        }
    };
    // Delete confirmation modal component
    const DeleteAccountModal = () => (_jsxs(Dialog, { open: deleteModalOpen, onClose: () => setDeleteModalOpen(false), children: [_jsx(DialogTitle, { children: "Eliminar cuenta" }), _jsx(DialogContent, { children: _jsxs(FormControl, { fullWidth: true, margin: "normal", children: [_jsx(InputLabel, { id: "delete-select-label", children: "Selecciona cuenta" }), _jsx(Select, { labelId: "delete-select-label", value: accountToDelete, label: "Selecciona cuenta", onChange: e => setAccountToDelete(e.target.value), children: accounts.map(acc => (_jsxs(MenuItem, { value: acc._id, children: [acc.name, " (\u2022\u2022\u2022\u2022", acc.last4, ")"] }, acc._id))) })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => { setDeleteModalOpen(false); setAccountToDelete(''); }, color: "secondary", children: "Cancelar" }), _jsx(Button, { onClick: () => { handleDeleteAccount(); setDeleteModalOpen(false); }, color: "error", variant: "contained", disabled: !accountToDelete, children: "Eliminar" })] })] }));
    /** ------------------------------------------------------------------
     *  Render helpers
     * -----------------------------------------------------------------*/
    const AccountCard = ({ account }) => (_jsxs(Paper, { "data-testid": "tarjeta-cuenta", elevation: 6, sx: {
            background: account.color,
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
        }, children: [_jsx(Button, { "data-testid": "boton-congelar-cuenta", size: "small", variant: account.frozen ? 'outlined' : 'contained', color: account.frozen ? 'warning' : 'primary', sx: {
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 2,
                    fontSize: 12,
                    px: 1.5,
                    py: 0.5,
                    minWidth: 0,
                    ...(account.frozen && {
                        background: '#fff',
                        color: '#222E50', // dark text for contrast
                        border: '1.5px solid #A6B1E1',
                        '&:hover': {
                            background: '#f5f5f5',
                            color: '#222E50',
                        },
                    }),
                }, onClick: () => {
                    setSelectedAccount(account);
                    setFreezeModalOpen(true);
                }, children: account.frozen ? 'Descongelar' : 'Congelar' }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, mb: 2, children: [_jsx(Box, { sx: {
                            width: 32,
                            height: 24,
                            borderRadius: '4px',
                            background: 'linear-gradient(120deg, #fff 60%, #1BFFFF 100%)',
                            boxShadow: '0 0 8px #1BFFFF99',
                            mr: 1,
                        } }), _jsxs(Typography, { "data-testid": "saldo-cuenta", variant: "subtitle2", fontWeight: 600, color: "#fff", letterSpacing: 2, children: ["$", account.balance.toFixed(2)] })] }), _jsxs(Typography, { "data-testid": "texto-numero-cuenta", variant: "h6", fontWeight: 700, letterSpacing: 2, sx: { mb: 1, fontFamily: 'monospace', userSelect: 'none' }, children: ["\u2022\u2022\u2022\u2022 ", account.last4] }), _jsx(Typography, { "data-testid": "tipo-cuenta", variant: "body2", color: "#A6B1E1", fontWeight: 500, children: typeLabels[account.type] })] }));
    const AddAccountCard = () => (_jsxs(Paper, { "data-testid": "tarjeta-agregar-cuenta", elevation: 0, sx: {
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
            cursor: 'pointer',
            gap: 2,
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 1 },
        }, onClick: () => setModalOpen(true), children: [_jsx(Box, { sx: {
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '2px dashed #A6B1E1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1,
                }, children: _jsx("span", { style: { fontSize: 28, color: '#A6B1E1' }, children: "+" }) }), _jsx(Typography, { fontWeight: 600, children: "Agregar cuenta" })] }));
    /** ------------------------------------------------------------------
     *  JSX
     * -----------------------------------------------------------------*/
    return (_jsxs(Box, { minHeight: "100vh", width: "100vw", display: "flex", flexDirection: "column", position: "relative", sx: { background: 'linear-gradient(90deg, #2E3192 0%, #1BFFFF 100%)', overflow: 'hidden' }, children: [_jsxs(Box, { component: "header", width: "100%", maxWidth: "100vw", sx: {
                    px: { xs: 2, sm: 4 },
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(12,10,30,0.85)',
                    borderBottom: '1.5px solid rgba(44,255,255,0.08)',
                    position: 'fixed', top: 0, left: 0,
                    zIndex: 2,
                    boxSizing: 'border-box',
                }, children: [_jsxs(Box, { component: RouterLink, to: "/", "data-testid": "logo-header-dashboard", display: "flex", alignItems: "center", gap: 1, children: [_jsx(AccountBalanceIcon, { "data-testid": "logo-header-dashboard-icon", sx: { color: '#FFD600', fontSize: 32 } }), _jsx(Typography, { "data-testid": "logo-header-dashboard-text", variant: "h6", fontWeight: 700, color: "#fff", children: "ATENEA BANK" })] }), _jsx(Button, { "data-testid": "boton-logout", onClick: async () => {
                            try {
                                await logout();
                                enqueueSnackbar('Sesión cerrada correctamente', { variant: 'success' });
                            }
                            catch {
                                enqueueSnackbar('Error al cerrar sesión', { variant: 'error' });
                            }
                            setToken('');
                            navigate('/login');
                        }, variant: "outlined", sx: { color: '#1BFFFF', borderColor: '#1BFFFF', '&:hover': { background: 'rgba(27,255,255,0.08)' } }, children: "Cerrar sesi\u00F3n" })] }), _jsx(NeonParticlesBackground, {}), _jsx(Box, { position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", flex: 1, width: "100%", pt: 12, children: _jsxs(Paper, { elevation: 8, sx: {
                        p: 4,
                        width: '100%',
                        maxWidth: 700,
                        mx: 2,
                        background: 'rgba(18, 22, 39, 0.97)',
                        borderRadius: 4,
                        boxShadow: '0 0 32px 8px #1BFFFF55, 0 0 0 1.5px #1BFFFF44, 0 8px 32px #000',
                        color: '#fff',
                        border: '1.5px solid #222E50',
                    }, children: [_jsx(Typography, { "data-testid": "titulo-dashboard", variant: "h4", fontWeight: 700, mb: 3, children: "Tablero Principal" }), _jsxs(Paper, { "data-testid": "tarjeta-saldo-total", elevation: 0, sx: {
                                background: 'linear-gradient(90deg, #1BFFFF22 0%, #2E319222 100%)',
                                borderRadius: 3,
                                p: 3,
                                mb: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                boxShadow: '0 0 24px 4px #1BFFFF55',
                            }, children: [_jsx(Typography, { "data-testid": "saldo-total-dashboard-label", variant: "subtitle2", color: "#A6B1E1", fontWeight: 500, mb: 0.5, children: "Saldo total" }), _jsx(Typography, { "data-testid": "saldo-total-dashboard", variant: "h3", fontWeight: 700, sx: { color: '#1BFFFF', textShadow: '0 0 12px #1BFFFF88', letterSpacing: 1 }, children: totalBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) })] }), _jsxs(Box, { "data-testid": "contenedor-cuentas", mb: 4, display: "flex", flexWrap: "wrap", gap: 3, children: [accounts.map(acc => (_jsx(AccountCard, { account: acc }, acc.last4))), accounts.length < 4 && _jsx(AddAccountCard, {})] }), _jsxs(Box, { display: "flex", justifyContent: "center", gap: 3, mb: 3, children: [_jsx(Button, { "data-testid": "boton-eliminar-cuenta", variant: "contained", color: "error", sx: {
                                        fontWeight: 700,
                                        px: 4,
                                        py: 1.2,
                                        fontSize: 18,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        letterSpacing: 1,
                                        boxShadow: '0 0 12px #ff174455',
                                    }, onClick: () => setDeleteModalOpen(true), children: "Eliminar" }), _jsx(Button, { "data-testid": "boton-agregar-fondos", variant: "contained", sx: {
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
                                        '&:hover': { background: 'linear-gradient(90deg, #1BFFFF 0%, #2E3192 100%)' },
                                    }, onClick: () => setTopUpModalOpen(true), children: "Agregar fondos" }), _jsx(Button, { "data-testid": "boton-enviar", variant: "outlined", sx: {
                                        color: '#1BFFFF',
                                        borderColor: '#1BFFFF',
                                        fontWeight: 700,
                                        px: 4,
                                        py: 1.2,
                                        fontSize: 18,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        letterSpacing: 1,
                                        '&:hover': { borderColor: '#2E3192', background: 'rgba(27,255,255,0.08)' },
                                    }, onClick: () => setTransferModalOpen(true), children: "Enviar" })] }), _jsxs(Box, { mt: 4, children: [_jsx(Typography, { "data-testid": "titulo-transacciones", variant: "h5", mb: 2, children: "Lista de transacciones" }), (() => {
                                    // group by date
                                    const groups = {};
                                    transactions.forEach(tx => {
                                        const date = new Date(tx.date).toLocaleDateString('es-ES');
                                        groups[date] = groups[date] || [];
                                        groups[date].push(tx);
                                    });
                                    return Object.entries(groups).map(([date, txs]) => (_jsxs(Box, { mb: 2, children: [_jsx(Typography, { "data-testid": "fecha-transaccion", variant: "subtitle2", fontWeight: 600, children: date }), txs.map(tx => (_jsxs(Box, { "data-testid": "item-transaccion", display: "flex", justifyContent: "space-between", py: 0.5, children: [_jsx(Typography, { "data-testid": "descripcion-transaccion", sx: { color: tx.direction === 'in' || tx.type === 'account_opened' ? 'success.main' : tx.direction === 'out' || tx.type === 'account_closed' ? 'error.main' : '#fff' }, children: tx.type === 'deposit'
                                                            ? `Depósito en cuenta ${accounts.find(a => a._id === tx.accountId)?.last4}`
                                                            : tx.type === 'account_opened'
                                                                ? `Cuenta activada ${tx.last4 ?? accounts.find(a => a._id === tx.accountId)?.last4 ?? ''}`
                                                                : tx.type === 'account_closed'
                                                                    ? `Cuenta de débito cerrada ${tx.last4 ?? accounts.find(a => a._id === tx.accountId)?.last4 ?? ''}`
                                                                    : tx.type === 'status_change'
                                                                        ? `${tx.description} ${tx.last4 ?? accounts.find(a => a._id === tx.accountId)?.last4 ?? ''}`
                                                                        : tx.description }), _jsx(Typography, { "data-testid": "monto-transaccion", sx: { color: tx.direction === 'in' || tx.type === 'account_opened' ? 'success.main' : tx.direction === 'out' || tx.type === 'account_closed' ? 'error.main' : '#fff' }, children: tx.direction === 'neutral'
                                                            ? ''
                                                            : `${tx.direction === 'in' ? '+ ' : '- '}${tx.amount?.toFixed(2)}` })] }, tx._id)))] }, date)));
                                })()] }), _jsx(CreateAccountModal, { open: modalOpen, onClose: () => setModalOpen(false), onCreate: handleAddAccount }), _jsx(TopUpModal, { open: topUpModalOpen, onClose: () => setTopUpModalOpen(false), onTopUp: handleTopUp, accounts: accounts }), _jsx(TransferModal, { open: transferModalOpen, onClose: () => setTransferModalOpen(false), onTransfer: handleTransfer, accounts: accounts }), _jsx(FreezeAccountModal, { open: freezeModalOpen && Boolean(selectedAccount), onClose: () => setFreezeModalOpen(false), onConfirm: handleFreezeToggle, accountName: selectedAccount?.name || '', last4: selectedAccount?.last4 || '', frozen: Boolean(selectedAccount?.frozen) }), _jsx(DeleteAccountModal, {})] }) })] }));
};
export default Dashboard;
