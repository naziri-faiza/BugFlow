import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bug, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { registerUser } from '../api/auth.js';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const next = {};
    const trimmedName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      next.name = 'Full name is required.';
    } else if (trimmedName.length < 2 || trimmedName.length > 100) {
      next.name = 'Name must be between 2 and 100 characters.';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail) {
      next.email = 'Email is required.';
    } else if (cleanEmail.length > 150 || !emailPattern.test(cleanEmail)) {
      next.email = 'Please enter a valid email address.';
    }

    if (!password) {
      next.password = 'Password is required.';
    } else if (password.length < 8) {
      next.password = 'Password must be at least 8 characters.';
    } else if (new TextEncoder().encode(password).length > 72) {
      next.password = 'Password cannot exceed 72 bytes.';
    }

    if (!confirmPassword) {
      next.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match.';
    }

    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (data && data.success) {
        setSuccessMessage(data.message || 'Account created successfully! Redirecting to sign in...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setServerError(data?.message || 'Unable to register. Please try again.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot connect to backend server. Please verify the API is running at http://localhost:5000.'
          : 'Unable to register. Please check your details and try again.');
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

        <h1 className="auth-heading">Create your account</h1>

        {serverError && (
          <div className="auth-alert-error" role="alert">
            <AlertCircle size={16} />
            <span>{serverError}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert-success" role="status">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Full name */}
          <div className="form-group">
            <label htmlFor="reg-name">
              Full name <span className="required">*</span>
            </label>
            <input
              id="reg-name"
              type="text"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setServerError('');
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              autoComplete="name"
              disabled={isSubmitting || !!successMessage}
              required
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="reg-email">
              Email <span className="required">*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setServerError('');
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              autoComplete="email"
              disabled={isSubmitting || !!successMessage}
              required
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="reg-password">
              Password <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setServerError('');
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                autoComplete="new-password"
                disabled={isSubmitting || !!successMessage}
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

          {/* Confirm password */}
          <div className="form-group">
            <label htmlFor="reg-confirm">
              Confirm password <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="reg-confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setServerError('');
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                autoComplete="new-password"
                disabled={isSubmitting || !!successMessage}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="form-error">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="auth-submit"
            disabled={isSubmitting || !!successMessage}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="auth-spinner" /> Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
