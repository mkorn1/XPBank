import { LoginForm } from '../components/LoginForm';
import { AuthLayout } from '../components/AuthLayout';
import { useAuthRedirect } from '../hooks/useAuthRedirect';

export const LoginPage = () => {
  useAuthRedirect(false); // Redirect if already authenticated

  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
};

