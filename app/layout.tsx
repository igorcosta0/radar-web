export const metadata = { title: 'Radar de Oportunidades' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0d0d10', color: '#eeeef2' }}>
        {children}
      </body>
    </html>
  );
}