import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userService } from "../services/apiService";
import { useToast } from "../contexts/ToastContext";

const Register = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "CLIENT", // CLIENT or OWNER
    agreeToTerms: false,
  });

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (!formData.agreeToTerms) {
      toast.warning("Vous devez accepter les conditions d'utilisation");
      return;
    }

    if (formData.password.length < 6) {
      toast.warning("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    try {
      // Call backend API to create user
      const userData = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role, // 'CLIENT' or 'OWNER'
      };

      console.log("Sending registration data:", userData);

      const result = await userService.createUser(userData);

      console.log("User created:", result);

      toast.success(
        "Compte créé avec succès! Vérifiez votre email pour le code de vérification.",
      );

      // Redirect to verification page with email
      navigate("/verify-email", { state: { email: formData.email } });
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        `Erreur d'inscription: ${error.message}. Assurez-vous que l'email n'est pas déjà utilisé.`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <section className="flex flex-col justify-center items-center min-h-[calc(100vh-64px)] px-4 py-8 sm:py-12 md:py-20 lg:py-32">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 sm:px-8 py-8 sm:py-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Inscription
              </h2>
              <p className="text-white/80 text-xs sm:text-sm">
                Créez votre compte ReserveCut
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8">
              <div className="space-y-4 sm:space-y-6">
                {/* Role Selection - CHANGED: Added role selection */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Je suis <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="CLIENT"
                        checked={formData.role === "CLIENT"}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="p-4 border-2 border-gray-200 rounded-lg peer-checked:border-primary-500 peer-checked:bg-primary-50 transition text-center">
                        <p className="font-semibold">Client</p>
                        <p className="text-xs text-gray-500">
                          Je cherche un salon
                        </p>
                      </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="OWNER"
                        checked={formData.role === "OWNER"}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="p-4 border-2 border-gray-200 rounded-lg peer-checked:border-primary-500 peer-checked:bg-primary-50 transition text-center">
                        <p className="font-semibold">Propriétaire</p>
                        <p className="text-xs text-gray-500">J'ai un salon</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2"
                    >
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Prénom"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2"
                    >
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Nom"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="votre@email.com"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Phone - CHANGED: Added phone field */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2"
                  >
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+212 6 00 00 00 00"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2"
                  >
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                    minLength={6}
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2"
                  >
                    Confirmer le mot de passe{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Terms and Conditions */}
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="w-4 h-4 mt-0.5 text-primary-600 rounded border-gray-300 focus:ring-primary-500 cursor-pointer flex-shrink-0"
                    required
                  />
                  <span className="text-xs sm:text-sm text-gray-600">
                    J'accepte les{" "}
                    <a
                      href="#"
                      className="text-primary-600 hover:text-secondary-600 transition-colors"
                    >
                      conditions d'utilisation
                    </a>
                  </span>
                </label>

                {/* Submit Button - Touch-friendly on mobile */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-4 text-base sm:text-lg rounded-xl font-semibold hover:opacity-90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all min-h-[52px] ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {loading ? "Inscription en cours..." : "S'inscrire"}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 sm:px-8 py-4 sm:py-6 bg-gray-50/50 border-t border-gray-200">
              <p className="text-center text-xs sm:text-sm text-gray-600">
                Vous avez déjà un compte?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-primary-600 hover:text-secondary-600 transition-colors"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-secondary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Register;
