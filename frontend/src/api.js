import axios from 'axios';
const API_BASE = import.meta.env.DEV ? 'http://localhost:6007/api' : '/api';
export async function getAccounts(token) {
    const res = await axios.get(`${API_BASE}/accounts`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
}
export async function createAccount(token, type, initialAmount) {
    const res = await axios.post(`${API_BASE}/accounts`, { type, initialAmount }, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
}
export async function freezeAccount(token, id, isFrozen) {
    const res = await axios.put(`${API_BASE}/accounts/${id}/freeze`, { isFrozen }, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
}
export async function deleteAccount(token, id) {
    await axios.delete(`${API_BASE}/accounts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
}
// Add funds to an account
export async function depositFunds(token, accountId, amount) {
    const res = await axios.post(`${API_BASE}/accounts/${accountId}/deposit`, { amount }, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
}
// Transferencia de fondos desde una cuenta específica
export async function transferFunds(token, fromAccountId, toEmail, amount) {
    await axios.post(`${API_BASE}/transactions/transfer`, { fromAccountId, toEmail, amount }, { headers: { Authorization: `Bearer ${token}` } });
}
export async function getTransactions(token) {
    const res = await axios.get(`${API_BASE}/transactions`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
}
// Logout del usuario
export async function logout() {
    await axios.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true });
}
