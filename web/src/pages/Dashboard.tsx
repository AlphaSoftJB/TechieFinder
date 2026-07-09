import { useAuth } from '../contexts/AuthContext';
import UserDashboard from './UserDashboard';
import TechnicianDashboard from './TechnicianDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  return user?.role === 'TECHNICIAN' ? <TechnicianDashboard /> : <UserDashboard />;
}
