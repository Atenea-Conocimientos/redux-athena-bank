import axios from 'axios';
const API_BASE = import.meta.env.DEV ? 'http://localhost:4000/api' : '/api';

export interface Account {
  _id: string;
  type: 'debit' | 'credit' | 'savings' | 'checking';
  last4: string;
  name: string;
  frozen: boolean;
  balance: number;
}

export async function getAccounts(token: string): Promise<Account[]> {
  const res = await axios.get(`${API_BASE}/accounts`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function createAccount(token: string, type: string, initialAmount: number): Promise<Account> {
  const res = await axios.post(`${API_BASE}/accounts`, { type, initialAmount }, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function freezeAccount(token: string, id: string, isFrozen: boolean): Promise<Account> {
  const res = await axios.put(`${API_BASE}/accounts/${id}/freeze`, { isFrozen }, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function deleteAccount(token: string, id: string): Promise<void> {
  await axios.delete(`${API_BASE}/accounts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
}
