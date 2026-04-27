import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import './i18n/config';
import { Toaster } from './components/ui/sonner.tsx'

// Limpiar datos antiguos de sync del localStorage al iniciar
// Esto evita que el modal de OnboardingSync aparezca con información desactualizada
const SYNC_STORAGE_KEY = 'onboarding_sync_state';
try {
  const stored = localStorage.getItem(SYNC_STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    // Si hay datos antiguos del formato syncProgress/isSyncing, limpiarlos
    if (parsed.syncProgress && parsed.isSyncing) {
      console.log('🧹 Limpiando datos antiguos de sync del localStorage');
      localStorage.removeItem(SYNC_STORAGE_KEY);
    }
  }
} catch (error) {
  console.error('Error limpiando datos antiguos de sync:', error);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
        <Toaster style={{
          '--normal-bg':
            'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
          '--normal-text': 'light-dark(var(--color-green-600), var(--color-green-400))',
          '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
        } as React.CSSProperties} />
        <App />
    </QueryClientProvider>
  </StrictMode>,
)
