import AdminPanel from './_components/AdminPanel/AdminPanel';
import ThemeSwitcher from './_components/ThemeSwitcher';
import LangBubble from './_components/LangBubble';
import './styles/global.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ClientInitializer from './_components/ClientInitializer';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdminPanelEnabled =
    process.env.NEXT_PUBLIC_ADMIN_PANEL_ENABLED === 'true';

  return (
    <html lang="en">
      <body>
        {children}
        {isAdminPanelEnabled && <AdminPanel />}
        <ToastContainer />
        <ThemeSwitcher />
        <LangBubble />
        <ClientInitializer />
      </body>
    </html>
  );
}