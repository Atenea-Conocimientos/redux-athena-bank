import React from 'react';
import { SnackbarProvider } from 'notistack';

export const NotistackProvider = ({ children }: { children: React.ReactNode }) => (
  <SnackbarProvider
    maxSnack={3}
    autoHideDuration={3000}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  >
    {children}
  </SnackbarProvider>
);
