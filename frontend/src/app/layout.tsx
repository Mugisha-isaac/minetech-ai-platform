import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'MineTech AI Platform',
  description: 'Intelligent mining operations management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen flex font-sans">
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-screen ml-64">
          {children}
        </main>
      </body>
    </html>
  );
}
