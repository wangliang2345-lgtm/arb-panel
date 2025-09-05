import './globals.css';

export const metadata = {
  title: 'ArbWire — Pre-Match Arbitrage',
  description: 'Lightweight pre-match arbitrage viewer powered by OpticOdds.'
};

export default function RootLayout({ children }: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
