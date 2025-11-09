import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: ReactNode;
  onUploadClick?: () => void;
}

export function AppLayout({ children, onUploadClick }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader onUploadClick={onUploadClick} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

