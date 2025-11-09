import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/features/auth/contexts/AuthContext';
import { UploadProvider } from './src/features/photos/contexts/UploadContext';
import { AppNavigator } from './src/navigation/AppNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UploadProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </UploadProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
