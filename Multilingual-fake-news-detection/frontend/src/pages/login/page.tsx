import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated, setAuthenticated, validateCredentials } from '../../services/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const loginResult = validateCredentials(formData.email, formData.password);
    if (!loginResult.success) {
      setError(loginResult.reason);
      return;
    }

    setError('');
    setAuthenticated(rememberMe, loginResult.user);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://readdy.ai/api/search-image?query=abstract%20dark%20navy%20digital%20network%20visualization%20with%20glowing%20teal%20nodes%20and%20data%20streams%2C%20futuristic%20AI%20technology%20background%2C%20deep%20space%20aesthetic%20with%20subtle%20grid%20lines%2C%20professional%20and%20sophisticated%20dark%20theme&width=800&height=900&seq=login-bg-001&orientation=portrait"
          alt="background"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/70 to-teal-900/50"></div>
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg shadow-lg">
              <i className="ri-shield-check-fill text-white text-base"></i>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">TruthGuard <span className="text-teal-400">AI</span></span>
          </Link>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-500/20 border border-teal-500/30 text-teal-300 rounded-full text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse"></span>
              AI-Powered Verification
            </div>
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Fight Misinformation<br />
              <span className="text-teal-400">with AI Precision</span>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              Analyze news content across text, URLs, and images with 94.7% accuracy using DistilBERT multilingual transformer.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {[
                { icon: 'ri-file-text-line', label: 'Text Analysis' },
                { icon: 'ri-links-line', label: 'URL Verification' },
                { icon: 'ri-image-2-line', label: 'Image OCR' },
                { icon: 'ri-translate-2', label: 'Multilingual' },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <div className="w-7 h-7 flex items-center justify-center bg-teal-500/30 rounded-lg">
                    <i className={`${f.icon} text-teal-300 text-sm`}></i>
                  </div>
                  <span className="text-white text-xs font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-500 text-xs">© 2026 TruthGuard AI. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg">
              <i className="ri-shield-check-fill text-white text-base"></i>
            </div>
            <span className="text-slate-900 font-bold text-lg">TruthGuard <span className="text-teal-600">AI</span></span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome back</h1>
            <p className="text-slate-500 text-sm">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 px-4 py-3 bg-rose-50 border border-rose-200 rounded-lg">
              <i className="ri-error-warning-line text-rose-500 text-sm flex-shrink-0"></i>
              <p className="text-rose-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className="ri-mail-line text-slate-400 text-sm"></i>
                </div>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Password
                </label>
                <a href="#" className="text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer">Forgot password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className="ri-lock-line text-slate-400 text-sm"></i>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center cursor-pointer"
                >
                  <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-slate-400 hover:text-slate-600 text-sm`}></i>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer">Remember me for 30 days</label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-teal-600 text-white rounded-lg font-semibold text-sm hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/20 hover:shadow-xl whitespace-nowrap cursor-pointer"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/signup" className="text-teal-600 hover:text-teal-700 font-semibold cursor-pointer">
                Create one free
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-teal-600 transition-colors cursor-pointer flex items-center justify-center gap-1">
              <i className="ri-arrow-left-line"></i>
              Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
