import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, setAuthenticated } from '../../services/auth';

export default function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!formData.acceptTerms) {
      setError('Please accept the Terms of Service to continue.');
      return;
    }

    const registerResult = registerUser({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
    if (!registerResult.success) {
      setError(registerResult.reason);
      return;
    }

    setError('');
    setAuthenticated(true, {
      name: formData.name,
      email: formData.email,
    });
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://readdy.ai/api/search-image?query=abstract%20dark%20navy%20digital%20network%20visualization%20with%20glowing%20teal%20nodes%20and%20data%20streams%2C%20futuristic%20AI%20technology%20background%2C%20deep%20space%20aesthetic%20with%20subtle%20grid%20lines%2C%20professional%20and%20sophisticated%20dark%20theme&width=800&height=900&seq=signup-bg-002&orientation=portrait"
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
              Join 50,000+ Fact-Checkers
            </div>
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Start Detecting<br />
              <span className="text-teal-400">Fake News Today</span>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              Create your free account and get instant access to AI-powered multilingual fake news detection across text, URLs, and images.
            </p>

            <div className="mt-10 space-y-3">
              {[
                { icon: 'ri-check-line', text: 'Free forever — no credit card required' },
                { icon: 'ri-check-line', text: 'Analyze up to 100 articles per day' },
                { icon: 'ri-check-line', text: 'Full access to analytics dashboard' },
                { icon: 'ri-check-line', text: 'Multilingual support: EN, HI, KN' },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center bg-teal-500/30 rounded-full flex-shrink-0">
                    <i className={`${f.icon} text-teal-400 text-xs`}></i>
                  </div>
                  <span className="text-slate-300 text-sm">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-500 text-xs">© 2026 TruthGuard AI. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg">
              <i className="ri-shield-check-fill text-white text-base"></i>
            </div>
            <span className="text-slate-900 font-bold text-lg">TruthGuard <span className="text-teal-600">AI</span></span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Create your account</h1>
            <p className="text-slate-500 text-sm">Start fighting misinformation with AI — it's free</p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 px-4 py-3 bg-rose-50 border border-rose-200 rounded-lg">
              <i className="ri-error-warning-line text-rose-500 text-sm flex-shrink-0"></i>
              <p className="text-rose-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className="ri-user-3-line text-slate-400 text-sm"></i>
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                  placeholder="Enter Name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className="ri-mail-line text-slate-400 text-sm"></i>
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                  placeholder="you@gmail.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className="ri-lock-line text-slate-400 text-sm"></i>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center cursor-pointer">
                  <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-slate-400 hover:text-slate-600 text-sm`}></i>
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className="ri-lock-line text-slate-400 text-sm"></i>
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                  placeholder="Re-enter your password"
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center cursor-pointer">
                  <i className={`${showConfirm ? 'ri-eye-off-line' : 'ri-eye-line'} text-slate-400 hover:text-slate-600 text-sm`}></i>
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <input
                type="checkbox"
                id="terms"
                checked={formData.acceptTerms}
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 mt-0.5 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                I agree to the{' '}
                <a href="#" className="text-teal-600 hover:text-teal-700 font-semibold">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-teal-600 hover:text-teal-700 font-semibold">Privacy Policy</a>.
                I understand this system provides AI-based insights and is not a substitute for professional fact-checking.
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-teal-600 text-white rounded-lg font-semibold text-sm hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/20 hover:shadow-xl whitespace-nowrap cursor-pointer"
            >
              Create Free Account
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-teal-600 hover:text-teal-700 font-semibold cursor-pointer">Sign in</Link>
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
