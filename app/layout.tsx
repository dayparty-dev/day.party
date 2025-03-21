import AdminPanel from './_components/AdminPanel/AdminPanel';
import './styles/global.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <AdminPanel />
        <ToastContainer />
      </body>
    </html>
  );
}
