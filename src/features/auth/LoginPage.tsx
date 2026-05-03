import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NautilusLogo } from "@/components/brand/NautilusLogo";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      void navigate("/projects");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-surface p-4 sm:p-8"
      style={{
        backgroundImage:
          "radial-gradient(circle at top right, rgba(224, 227, 229, 0.4) 0%, rgba(247, 249, 251, 1) 50%)",
      }}
    >
      <main className="relative w-full max-w-[440px] overflow-hidden rounded-xl border border-surface-high bg-surface-lowest p-8 shadow-sm sm:p-10">
        <div className="absolute left-0 top-0 h-1 w-full bg-primary" />

        <header className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 flex justify-center">
            <NautilusLogo />
          </div>
          <h1 className="text-2xl font-semibold text-on-surface">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Enter your credentials to access your workspace.
          </p>
        </header>

        <form
          id="login-form"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="flex flex-col"
        >
          <div className="mb-5">
            <label
              className="mb-1.5 block text-[13px] font-medium text-on-surface"
              htmlFor="login-email"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant">
                <Mail size={16} />
              </div>
              <input
                id="login-email"
                type="email"
                placeholder="name@company.com"
                required
                autoComplete="email"
                className="w-full rounded border border-outline-variant bg-surface-lowest py-2.5 pl-10 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-6">
            <label
              className="mb-1.5 block text-[13px] font-medium text-on-surface"
              htmlFor="login-password"
            >
              Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant">
                <Lock size={16} />
              </div>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full rounded border border-outline-variant bg-surface-lowest py-2.5 pl-10 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant/60 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant transition-colors hover:text-on-surface"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <label className="flex items-center gap-2 text-[13px] text-on-surface-variant">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded-sm border-outline-variant text-primary focus:ring-primary"
              />
              Remember me
            </label>
            <button
              type="button"
              className="text-[13px] font-medium text-primary hover:text-on-primary-fixed-variant hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2 rounded border border-error-container bg-error-container/30 px-3 py-2.5">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-error" />
              <p className="text-body-sm text-on-error-container">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded bg-primary py-2.5 text-[14px] font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-6 rounded border border-outline-variant bg-surface-low px-3 py-2.5">
          <p className="mb-1.5 text-label-caps text-on-surface-variant">
            Demo credentials
          </p>
          <p className="text-body-sm text-on-surface-variant">
            <strong className="text-on-surface">Manager:</strong>{" "}
            manager@nautilus.dev / Manager123!
          </p>
          <p className="text-body-sm text-on-surface-variant">
            <strong className="text-on-surface">Developer:</strong>{" "}
            developer@nautilus.dev / Developer123!
          </p>
        </div>

        <div className="mt-6 text-center text-[13px] text-on-surface-variant">
          Don't have an account?{" "}
          <Link
            className="font-semibold text-primary hover:underline"
            to="/register"
          >
            Create one
          </Link>
        </div>
      </main>
    </div>
  );
};
