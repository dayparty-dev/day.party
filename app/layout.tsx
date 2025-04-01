import AdminPanel from './_components/AdminPanel/AdminPanel';
import LangBubble from './_components/LangBubble';
import './styles/global.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { appWithTranslation } from 'next-i18next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdminPanelEnabled: boolean =
    process.env.NEXT_PUBLIC_ADMIN_PANEL_ENABLED === 'true';

  return (
    <html lang="en">
      <body>
        {children}
        {isAdminPanelEnabled && <AdminPanel />}
        <ToastContainer />
        <LangBubble />
      </body>
    </html>
  );
}