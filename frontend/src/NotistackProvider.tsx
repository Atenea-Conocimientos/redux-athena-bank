import React from 'react';
import { SnackbarProvider } from 'notistack';

export const NotistackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
    {children}
  </SnackbarProvider>
);
