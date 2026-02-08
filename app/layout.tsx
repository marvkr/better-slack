import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dispatch - AI Native Task Coordination',
  description: 'Stop chatting, start doing.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
