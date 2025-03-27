import AdminPanel from './_components/AdminPanel/AdminPanel';
import './styles/global.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
      </body>
    </html>
  );
}
