import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export const metadata = {
  title: 'Winpay Simulator Dashboard',
  description: 'Dashboard interaktif untuk testing Winpay SNAP & Checkout Page API',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="app-layout">
          <Sidebar />
          <div className="main-content">
            <Header />
            <main className="page-body">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
