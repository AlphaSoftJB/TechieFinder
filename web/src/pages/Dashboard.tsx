import { useAuth } from '../contexts/AuthContext';
import UserDashboard from './UserDashboard';
import TechnicianDashboard from './TechnicianDashboard';
import AdminDashboard from './AdminDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return <AdminDashboard />;
  return user?.role === 'TECHNICIAN' ? <TechnicianDashboard /> : <UserDashboard />;
}
