import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Ficha do Viajante — Viagem Missionária',
  description:
    'Cadastro do viajante: dados pessoais, informações de saúde e autorizações para a viagem missionária.',
};

export const viewport: Viewport = {
  themeColor: '#12b3c4',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
