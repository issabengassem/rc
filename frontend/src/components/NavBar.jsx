import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { User, LogOut, Calendar, Store } from "lucide-react";
import { authService } from "../services/apiService";

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Check if user is logged in on component mount and when location changes
  useEffect(() => {
    const userData = authService.getCurrentUser();
    if (userData) {
      setUser(userData);
    } else {
      setUser(null);
    }
  }, [location]); // Re-run when route changes

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setShowUserMenu(false);
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
              {/* CHANGED: No role checks - everyone can access everything */}
              {user ? (
                <>
                  {/* User is logged in */}

                  {/* Salons Link */}
                  <Link
                    to="/salons"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors hidden sm:block"
                  >
                    Salons
                  </Link>

                  {/* My Appointments Link */}
                  <Link
                    to="/mes-rendez-vous"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Calendar size={18} />
                    <span className="hidden sm:block">Mes Rendez-vous</span>
                  </Link>

                  {/* Propose Salon Link - Only for OWNER role */}
                  {user.role === "OWNER" && (
                    <Link
                      to="/proposer-salon"
                      className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Store size={18} />
                      <span className="hidden sm:block">
                        Proposer mon salon
                      </span>
                    </Link>
                  )}

                  {/* My Salons Link - Only for OWNER role */}
                  {user.role === "OWNER" && (
                    <Link
                      to="/mes-salons"
                      className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Store size={18} />
                      <span className="hidden sm:block">Mes Salons</span>
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
                      <span className="hidden sm:block">
                        {user.name.split(" ")[0]}
                      </span>
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="text-sm font-semibold text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>

                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        >
                          <User size={16} />
                          Mon Profil
                        </Link>

                        <Link
                          to="/mes-rendez-vous"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        >
                          <Calendar size={16} />
                          Mes Rendez-vous
                        </Link>

                        {user.role === "OWNER" && (
                          <Link
                            to="/proposer-salon"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                          >
                            <Store size={16} />
                            Proposer mon salon
                          </Link>
                        )}

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition border-t border-gray-200 mt-2 pt-2"
                        >
                          <LogOut size={16} />
                          Déconnexion
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* User is NOT logged in */}
                  <Link
                    to="/salons"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors hidden sm:block"
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
          </div>
        </div>
      </nav>

      {/* CHANGED: Click outside to close dropdown */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
}
