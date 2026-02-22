import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { User, LogOut, Calendar, Store, Menu, X } from "lucide-react";
import { authService } from "../services/apiService";

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user is logged in on component mount and when location changes
  useEffect(() => {
    const userData = authService.getCurrentUser();
    if (userData) {
      setUser(userData);
    } else {
      setUser(null);
    }
    // Close mobile menu on route change
    setMobileMenuOpen(false);
    setShowUserMenu(false);
  }, [location]); // Re-run when route changes

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setShowUserMenu(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to={"/"} className="flex items-center gap-3 group">
                <div className="bg-gradient-to-br from-primary-600 to-secondary-600 p-2 transition-all group-hover:shadow-lg group-hover:scale-105">
                  <svg
                    className="w-8 h-8 text-white"
                    viewBox="0 0 100 100"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Stylized R logo matching the design */}
                    {/* Top horizontal bars */}
                    <path d="M20 15 L75 15 L75 22 L20 22 Z" />
                    <path d="M30 28 L75 28 L75 35 L30 35 Z" />
                    {/* Vertical stem */}
                    <path d="M20 15 L20 85 L30 85 L30 15 Z" />
                    {/* Diagonal leg */}
                    <path d="M30 50 Q40 50 50 65 L55 85 L70 85 L58 60 Q48 45 30 45 Z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                  reservecut
                </h1>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                {user ? (
                  <>
                    {/* User is logged in */}

                    {/* Salons Link */}
                    <Link
                      to="/salons"
                      className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Salons
                    </Link>

                    {/* My Appointments Link */}
                    <Link
                      to="/mes-rendez-vous"
                      className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Calendar size={18} />
                      <span>Mes Rendez-vous</span>
                    </Link>

                    {/* Propose Salon Link - Only for OWNER role */}
                    {user.role === "OWNER" && (
                      <Link
                        to="/proposer-salon"
                        className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Store size={18} />
                        <span>Proposer mon salon</span>
                      </Link>
                    )}

                    {/* My Salons Link - Only for OWNER role */}
                    {user.role === "OWNER" && (
                      <Link
                        to="/mes-salons"
                        className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Store size={18} />
                        <span>Mes Salons</span>
                      </Link>
                    )}

                    {/* User Menu Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{user.name.split(" ")[0]}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* User is NOT logged in */}
                    <Link
                      to="/salons"
                      className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Salons
                    </Link>
                    <Link
                      to="/login"
                      className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Connexion
                    </Link>
                    <Link
                      to="/register"
                      className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity shadow-md"
                    >
                      S'inscrire
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-primary-600 focus:outline-none"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                <>
                  {/* User info in mobile menu */}
                  <div className="px-3 py-2 border-b border-gray-200 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Salons Link */}
                  <Link
                    to="/salons"
                    className="block text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Salons
                  </Link>

                  {/* My Appointments Link */}
                  <Link
                    to="/mes-rendez-vous"
                    className="flex items-center gap-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Calendar size={18} />
                    <span>Mes Rendez-vous</span>
                  </Link>

                  {/* Profile Link */}
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={18} />
                    <span>Mon Profil</span>
                  </Link>

                  {/* Owner-only links */}
                  {user.role === "OWNER" && (
                    <>
                      <Link
                        to="/mes-salons"
                        className="flex items-center gap-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Store size={18} />
                        <span>Mes Salons</span>
                      </Link>

                      <Link
                        to="/proposer-salon"
                        className="flex items-center gap-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Store size={18} />
                        <span>Proposer mon salon</span>
                      </Link>
                    </>
                  )}

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-md text-base font-medium transition-colors mt-2 border-t border-gray-200 pt-3"
                  >
                    <LogOut size={18} />
                    <span>Déconnexion</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Not logged in - mobile menu */}
                  <Link
                    to="/salons"
                    className="block text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Salons
                  </Link>

                  <Link
                    to="/login"
                    className="block text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Connexion
                  </Link>

                  <Link
                    to="/register"
                    className="block bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-3 py-2 rounded-md text-base font-medium hover:opacity-90 transition-opacity shadow-md text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    S'inscrire
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Click outside to close dropdown */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-[100]"
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Dropdown Menu Portal - Rendered AFTER backdrop to appear on top */}
      {showUserMenu && (
        <div className="fixed top-16 right-4 sm:right-6 lg:right-8 z-[200] min-w-[350px] sm:min-w-[400px] bg-white rounded-xl shadow-2xl border border-gray-200 py-2">
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-primary-50/30 to-secondary-50/30">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user && user.name}
            </p>
            <p className="text-xs text-gray-500 truncate break-all">
              {user && user.email}
            </p>
          </div>

          <Link
            to="/profile"
            onClick={() => setShowUserMenu(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 cursor-pointer"
          >
            <User size={18} className="flex-shrink-0" />
            <span>Mon Profil</span>
          </Link>

          <Link
            to="/mes-rendez-vous"
            onClick={() => setShowUserMenu(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 cursor-pointer"
          >
            <Calendar size={18} className="flex-shrink-0" />
            <span>Mes Rendez-vous</span>
          </Link>

          {user && user.role === "OWNER" && (
            <>
              <Link
                to="/mes-salons"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 cursor-pointer"
              >
                <Store size={18} className="flex-shrink-0" />
                <span>Mes Salons</span>
              </Link>

              <Link
                to="/proposer-salon"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 cursor-pointer"
              >
                <Store size={18} className="flex-shrink-0" />
                <span>Proposer mon salon</span>
              </Link>
            </>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 border-t border-gray-200 mt-2 pt-3 cursor-pointer"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      )}
    </>
  );
}
