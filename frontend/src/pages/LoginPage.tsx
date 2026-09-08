import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../app/providers/AuthProvider";
import { Button } from "../components/ui/Button";
import { Input, Label, FieldError } from "../components/ui/Input";
import { extractErrorMessage } from "../services/apiClient";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";
    return <Navigate to={from} replace />;
  }

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email is required.";
    if (!password) next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const loggedInUser = await login(email.trim(), password);
      navigate(loggedInUser.role === "ADMIN" ? "/dashboard" : "/dashboard", { replace: true });
    } catch (err) {
      setFormError(extractErrorMessage(err, "Incorrect email or password."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-brick font-display text-xl font-semibold text-white">
            R
          </div>
          <h1 className="font-display text-2xl font-medium text-ink">Realty CRM</h1>
          <p className="mt-1 text-sm text-ink-soft">Sign in to manage your sales pipeline.</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <form onSubmit={handleSubmit} noValidate>
            {formError && (
              <div role="alert" className="mb-4 rounded-md border border-rust/30 bg-rust-light px-3 py-2 text-sm text-rust">
                {formError}
              </div>
            )}

            <div className="mb-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                hasError={!!errors.email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
              <FieldError message={errors.email} />
            </div>

            <div className="mb-6">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                hasError={!!errors.password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <FieldError message={errors.password} />
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Sign in
            </Button>
          </form>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-white/60 p-4 text-xs text-ink-soft">
          <p className="mb-1.5 font-medium text-ink">Demo credentials</p>
          <p>Admin: admin@realestatecrm.io / Admin@123</p>
          <p>Sales: rahul@realestatecrm.io / Sales@123</p>
        </div>
      </div>
    </div>
  );
}
