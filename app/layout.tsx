import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ClientInitializer from './_components/ClientInitializer';
import LangBubble from './_components/LangBubble';
import ThemeSwitcher from './_components/ThemeSwitcher';
import './styles/global.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <ToastContainer />
        <ThemeSwitcher />
        <LangBubble />
        <ClientInitializer />
      </body>
    </html>
  );
}
