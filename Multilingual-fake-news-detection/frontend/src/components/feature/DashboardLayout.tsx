import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { clearAuthentication, getAuthenticatedUser, isAuthenticated } from '../../services/auth';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: 'ri-dashboard-line' },
  { to: '/verify-text', label: 'Verify Text', icon: 'ri-file-text-line' },
  { to: '/verify-url', label: 'Verify URL', icon: 'ri-links-line' },
  { to: '/verify-image', label: 'Verify Image', icon: 'ri-image-2-line' },
  { to: '/analytics', label: 'Analytics', icon: 'ri-bar-chart-2-line' },
  { to: '/history', label: 'History', icon: 'ri-time-line' },
];

const bottomNavLinks = [
  { to: '/dashboard', label: 'Home', icon: 'ri-dashboard-line' },
  { to: '/verify-text', label: 'Text', icon: 'ri-file-text-line' },
  { to: '/verify-url', label: 'URL', icon: 'ri-links-line' },
  { to: '/verify-image', label: 'Image', icon: 'ri-image-2-line' },
  { to: '/history', label: 'History', icon: 'ri-time-line' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('Profile');
  const [currentUserInitial, setCurrentUserInitial] = useState('U');

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const user = getAuthenticatedUser();
    const displayName = user?.name || user?.email?.split('@')[0] || 'Profile';
    const initial = displayName.trim().charAt(0).toUpperCase() || 'U';

    setCurrentUserName(displayName);
    setCurrentUserInitial(initial);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  useEffect(() => {
    const handleOutsideClick = () => setProfileMenuOpen(false);

    if (profileMenuOpen) {
      document.addEventListener('click', handleOutsideClick);
    }

    return () => document.removeEventListener('click', handleOutsideClick);
  }, [profileMenuOpen]);

  const handleLogout = () => {
    clearAuthentication();
    setProfileMenuOpen(false);
    setDrawerOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Hamburger (mobile only) */}
          <button
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-all cursor-pointer flex-shrink-0"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <i className="ri-menu-line text-lg"></i>
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 cursor-pointer">
            <div className="w-8 h-8 flex items-center justify-center bg-teal-600 rounded-lg">
              <i className="ri-shield-check-line text-white text-base"></i>
            </div>
            <span className="text-sm font-extrabold text-slate-900 tracking-tight whitespace-nowrap">VerifyAI</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive(link.to)
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <i className={`${link.icon} text-sm`}></i>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="relative flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setProfileMenuOpen((prev) => !prev);
              }}
              className="flex items-center gap-1.5 pl-2 pr-2 sm:pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-teal-600 text-white text-xs font-bold flex-shrink-0">
                {currentUserInitial}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-slate-700 whitespace-nowrap">{currentUserName}</span>
              <i className={`hidden sm:inline ri-arrow-${profileMenuOpen ? 'up' : 'down'}-s-line text-slate-400 text-sm`}></i>
            </button>

            {profileMenuOpen && (
              <div
                className="absolute right-0 top-11 w-44 rounded-xl border border-slate-200 bg-white shadow-lg p-1.5 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <i className="ri-user-line text-slate-500"></i>
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  <i className="ri-logout-box-r-line"></i>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-slate-100 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2 cursor-pointer" onClick={() => setDrawerOpen(false)}>
            <div className="w-8 h-8 flex items-center justify-center bg-teal-600 rounded-lg">
              <i className="ri-shield-check-line text-white text-base"></i>
            </div>
            <span className="text-sm font-extrabold text-slate-900 tracking-tight">VerifyAI</span>
          </Link>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-all cursor-pointer"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        {/* Drawer Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive(link.to)
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className={`${link.icon} text-base`}></i>
              </div>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Drawer Footer */}
        <div className="border-t border-slate-100 px-3 py-4 flex flex-col gap-1">
          <Link
            to="/analytics"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              isActive('/analytics') ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-bar-chart-2-line text-base"></i>
            </div>
            Analytics
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 flex items-center justify-center rounded-full bg-teal-600 text-white text-xs font-bold flex-shrink-0">
              {currentUserInitial}
            </div>
            {currentUserName}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-logout-box-r-line text-base"></i>
            </div>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 py-4 sm:py-6 px-4 sm:px-6 lg:px-16 pb-20 lg:pb-6">
        {children ?? <Outlet />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around px-2 h-16 shadow-lg">
        {bottomNavLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              isActive(link.to) ? 'text-teal-600' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className={`${link.icon} text-lg`}></i>
            </div>
            <span className="text-[10px] font-semibold whitespace-nowrap">{link.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
