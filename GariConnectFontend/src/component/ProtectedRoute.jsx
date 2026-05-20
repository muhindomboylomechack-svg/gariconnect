import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    // Non connecté ? Retour au login
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Connecté mais mauvais rôle ? Retour à l'accueil
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;