import { SignupForm } from '../components/SignupForm';
import { AuthLayout } from '../components/AuthLayout';
import { useAuthRedirect } from '../hooks/useAuthRedirect';

export const SignupPage = () => {
  useAuthRedirect(false); // Redirect if already authenticated

  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
};

