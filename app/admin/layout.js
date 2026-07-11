import './admin.css';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = { title: 'Aligaah Admin' };

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
