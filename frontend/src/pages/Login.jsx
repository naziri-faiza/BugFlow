import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bug, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { loginUser } from '../api/auth.js';
import { useAuth } from '../context/authContext.js';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If redirected from a protected route, preserve target location
  const from = location.state?.from?.pathname || '/';

  function validate() {
    const next = {};
    if (!email.trim()) {
      next.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (!password) {
      next.password = 'Password is required.';
    } else if (password.length < 8) {
      next.password = 'Password must be at least 8 characters.';
    }
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });

      if (data && data.success && data.token) {
        login(data.token, data.user);
        navigate(from, { replace: true });
      } else {
        setServerError(data?.message || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot connect to backend server. Please verify the API is running at http://localhost:5000.'
          : 'Unable to login. Please check your credentials and try again.');
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <Bug size={26} />
          <span>BugFlow</span>
        </div>
        <p className="auth-tagline">Track bugs. Ship faster.</p>

        <h1 className="auth-heading">Welcome back</h1>

        {serverError && (
          <div className="auth-alert-error" role="alert">
            <AlertCircle size={16} />
            <span>{serverError}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="form-group">
            <label htmlFor="login-email">
              Email <span className="required">*</span>
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setServerError('');
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              autoComplete="email"
              disabled={isSubmitting}
              required
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="login-password">
              Password <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setServerError('');
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                autoComplete="current-password"
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          {/* Remember / Forgot */}
          <div className="form-row">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={isSubmitting}
              />
              Remember me
            </label>
            <a href="#forgot" onClick={(e) => e.preventDefault()}>
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="auth-spinner" /> Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
