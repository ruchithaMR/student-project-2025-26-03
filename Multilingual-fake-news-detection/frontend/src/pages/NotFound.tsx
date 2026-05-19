import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-white flex items-center justify-center px-4">
      <div className="text-center">
        {/* Large 404 Background */}
        <div className="relative mb-8">
          <h1 className="text-[180px] md:text-[240px] font-black text-gray-100 select-none leading-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center">
              <i className="ri-error-warning-line text-6xl text-white"></i>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="bg-teal-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-teal-600 transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <i className="ri-home-line"></i>
            Go to Homepage
          </Link>
          <Link
            to="/dashboard"
            className="bg-white text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 border-2 border-gray-200 transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <i className="ri-dashboard-line"></i>
            Go to Dashboard
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Quick Links</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link to="/verify-text" className="text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap">
              Verify Text
            </Link>
            <Link to="/verify-url" className="text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap">
              Verify URL
            </Link>
            <Link to="/verify-image" className="text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap">
              Verify Image
            </Link>
            <Link to="/analytics" className="text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap">
              Analytics
            </Link>
            <Link to="/history" className="text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap">
              History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}