import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAdminAuth();
  const { isAuthenticated } = useAdminAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    await signIn(data);
    setIsLoading(false);
  };

  return (
    <div className="win2k-desktop">
      {/* Desktop icons area */}
      <div className="win2k-desktop-icons">
        <div className="win2k-icon">
          <div className="win2k-icon-img">
            <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
              <rect x="2" y="2" width="28" height="28" fill="#1a5276" rx="1"/>
              <rect x="4" y="4" width="24" height="16" fill="#2980b9"/>
              <rect x="6" y="22" width="20" height="2" fill="#85c1e9"/>
              <rect x="13" y="26" width="6" height="4" fill="#1a5276"/>
              <rect x="10" y="28" width="12" height="2" fill="#85c1e9"/>
            </svg>
          </div>
          <span className="win2k-icon-label">StreamIt Admin</span>
        </div>
        <div className="win2k-icon">
          <div className="win2k-icon-img">
            <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
              <rect x="2" y="6" width="28" height="20" fill="#f5f5f0" rx="1" stroke="#808080" strokeWidth="1"/>
              <rect x="2" y="6" width="28" height="4" fill="#000080"/>
              <rect x="4" y="12" width="10" height="8" fill="#d4e8f0"/>
              <rect x="16" y="12" width="12" height="2" fill="#808080"/>
              <rect x="16" y="16" width="8" height="2" fill="#808080"/>
            </svg>
          </div>
          <span className="win2k-icon-label">My Documents</span>
        </div>
        <div className="win2k-icon">
          <div className="win2k-icon-img">
            <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
              <ellipse cx="16" cy="16" rx="14" ry="14" fill="#2980b9"/>
              <ellipse cx="16" cy="16" rx="14" ry="6" fill="none" stroke="#85c1e9" strokeWidth="1.5"/>
              <line x1="2" y1="16" x2="30" y2="16" stroke="#85c1e9" strokeWidth="1.5"/>
              <line x1="16" y1="2" x2="16" y2="30" stroke="#85c1e9" strokeWidth="1.5"/>
            </svg>
          </div>
          <span className="win2k-icon-label">Internet Explorer</span>
        </div>
        <div className="win2k-icon">
          <div className="win2k-icon-img">
            <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
              <rect x="4" y="2" width="16" height="20" fill="#f5f5f0" stroke="#808080" strokeWidth="1"/>
              <rect x="4" y="2" width="16" height="4" fill="#000080"/>
              <polygon points="20,2 28,10 20,10" fill="#c0c0c0" stroke="#808080" strokeWidth="1"/>
              <rect x="6" y="10" width="12" height="1.5" fill="#808080"/>
              <rect x="6" y="13" width="10" height="1.5" fill="#808080"/>
              <rect x="6" y="16" width="8" height="1.5" fill="#808080"/>
            </svg>
          </div>
          <span className="win2k-icon-label">Readme.txt</span>
        </div>
      </div>

      {/* Windows 2000 Login Dialog */}
      <div className="win2k-dialog-wrapper" role="main">
        {/* Window Chrome */}
        <div className="win2k-window" role="dialog" aria-labelledby="win2k-title">
          {/* Title Bar */}
          <div className="win2k-titlebar" aria-label="StreamIt Admin - Login">
            <div className="win2k-titlebar-left">
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="win2k-titlebar-icon">
                <rect x="1" y="3" width="14" height="10" fill="#4a90d9" rx="1"/>
                <rect x="1" y="3" width="14" height="3" fill="#2060a0"/>
                <rect x="3" y="8" width="4" height="3" fill="#87ceeb"/>
                <rect x="9" y="8" width="4" height="1.5" fill="#e0e0e0"/>
                <rect x="9" y="10.5" width="2" height="1.5" fill="#e0e0e0"/>
              </svg>
              <span id="win2k-title" className="win2k-titlebar-text">StreamIt Admin Panel</span>
            </div>
            <div className="win2k-titlebar-buttons" aria-hidden="true">
              <button className="win2k-btn-minimize" tabIndex={-1} title="Minimize">_</button>
              <button className="win2k-btn-maximize" tabIndex={-1} title="Maximize">□</button>
              <button className="win2k-btn-close" tabIndex={-1} title="Close">✕</button>
            </div>
          </div>

          {/* Menu Bar */}
          <div className="win2k-menubar" role="menubar" aria-label="Menu bar">
            <span className="win2k-menu-item" role="menuitem" tabIndex={-1}>File</span>
            <span className="win2k-menu-item" role="menuitem" tabIndex={-1}>Edit</span>
            <span className="win2k-menu-item" role="menuitem" tabIndex={-1}>View</span>
            <span className="win2k-menu-item" role="menuitem" tabIndex={-1}>Help</span>
          </div>

          {/* Window Content */}
          <div className="win2k-content">
            {/* Header Panel with logo */}
            <div className="win2k-header-panel">
              <div className="win2k-logo-area">
                <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
                  <rect width="48" height="48" fill="#000080" rx="4"/>
                  <polygon points="24,8 38,20 38,38 24,30 10,38 10,20" fill="#4a90d9"/>
                  <polygon points="24,14 34,22 34,34 24,27 14,34 14,22" fill="#87ceeb"/>
                  <circle cx="24" cy="24" r="5" fill="white"/>
                </svg>
              </div>
              <div className="win2k-header-text">
                <div className="win2k-product-name">StreamIt</div>
                <div className="win2k-product-subtitle">Administrator Console</div>
                <div className="win2k-product-version">Version 2.0.0 Build 2195</div>
              </div>
            </div>

            {/* Separator */}
            <div className="win2k-separator" role="separator" />

            {/* Credentials Panel */}
            <div className="win2k-credentials-area">
              <p className="win2k-instructions">
                Enter your administrator credentials to access the management console.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} aria-label="Admin login form" className="win2k-form">
                {/* Email Field */}
                <div className="win2k-field-row">
                  <label htmlFor="email" className="win2k-label">
                    User name:
                  </label>
                  <div className="win2k-input-wrapper">
                    <input
                      id="email"
                      type="email"
                      className={`win2k-input ${errors.email ? 'win2k-input-error' : ''}`}
                      placeholder="admin@example.com"
                      {...register('email')}
                      disabled={isLoading}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && (
                      <p id="email-error" className="win2k-error-msg" role="alert">
                        ⚠ {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password Field */}
                <div className="win2k-field-row">
                  <label htmlFor="password" className="win2k-label">
                    Password:
                  </label>
                  <div className="win2k-input-wrapper">
                    <input
                      id="password"
                      type="password"
                      className={`win2k-input ${errors.password ? 'win2k-input-error' : ''}`}
                      placeholder="••••••••"
                      {...register('password')}
                      disabled={isLoading}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                    />
                    {errors.password && (
                      <p id="password-error" className="win2k-error-msg" role="alert">
                        ⚠ {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Options row */}
                <div className="win2k-field-row">
                  <label htmlFor="domain" className="win2k-label">
                    Log on to:
                  </label>
                  <div className="win2k-input-wrapper">
                    <select id="domain" className="win2k-select" disabled={isLoading}>
                      <option>STREAMIT-CORP</option>
                      <option>STREAMIT-DEV</option>
                    </select>
                  </div>
                </div>

                {/* Separator */}
                <div className="win2k-separator" role="separator" />

                {/* Action Buttons */}
                <div className="win2k-button-row">
                  <button
                    type="submit"
                    className="win2k-button win2k-button-primary"
                    disabled={isLoading}
                    aria-label={isLoading ? 'Signing in, please wait' : 'Sign in to admin panel'}
                  >
                    {isLoading ? (
                      <span className="win2k-loading">
                        <span className="win2k-spinner" aria-hidden="true" />
                        Signing in...
                      </span>
                    ) : (
                      'OK'
                    )}
                  </button>
                  <button
                    type="button"
                    className="win2k-button"
                    disabled={isLoading}
                    onClick={() => { window.location.reload(); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="win2k-button win2k-button-options"
                    disabled={isLoading}
                  >
                    Options {'>>'}
                  </button>
                  <button
                    type="button"
                    className="win2k-button win2k-button-help"
                    aria-label="Help"
                    disabled={isLoading}
                  >
                    ?
                  </button>
                </div>
              </form>
            </div>

            {/* Status bar */}
            <div className="win2k-statusbar" role="status" aria-live="polite">
              <div className="win2k-status-panel">
                {isLoading ? 'Authenticating...' : 'Ready'}
              </div>
              <div className="win2k-status-panel win2k-status-right">
                <span>Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Taskbar */}
      <div className="win2k-taskbar" role="toolbar" aria-label="Taskbar">
        <button className="win2k-start-button" aria-label="Start menu">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <rect x="0" y="0" width="6" height="6" fill="#ff0000"/>
            <rect x="8" y="0" width="6" height="6" fill="#00b000"/>
            <rect x="0" y="8" width="6" height="6" fill="#0000ff"/>
            <rect x="8" y="8" width="6" height="6" fill="#ffff00"/>
          </svg>
          <strong>Start</strong>
        </button>
        <div className="win2k-taskbar-separator" />
        <div className="win2k-taskbar-tasks">
          <div className="win2k-task-button win2k-task-active">
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <rect x="1" y="3" width="14" height="10" fill="#4a90d9" rx="1"/>
            </svg>
            StreamIt Admin Panel - Log On
          </div>
        </div>
        <div className="win2k-taskbar-clock" aria-label="Current time">
          <div className="win2k-clock-time" id="win2k-clock">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
