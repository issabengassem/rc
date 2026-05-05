import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Edit2, Save, X, Trash2 } from "lucide-react";
import { userService, authService } from "../services/apiService";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "../components/ConfirmModal";

const UserProfile = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();

    if (!currentUser || !currentUser.id) {
      toast.warning("Vous devez être connecté");
      navigate("/login");
      return;
    }

    fetchUserData(currentUser.id);
  }, []);

  const fetchUserData = async (userId) => {
    setLoading(true);
    try {
      // ENDPOINT USED: userService.getUserById()
      const data = await userService.getUserById(userId);
      setUser(data);
      setFormData({
        name: data.name,
        email: data.email,
        phone: data.phone,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user:", error);

      // Check if it's a network/CORS error
      if (error.message === "Failed to fetch") {
        toast.error(
          "Impossible de se connecter au serveur. Veuillez vérifier votre connexion.", // FIXED: Removed hardcoded localhost URL
        );
      } else if (error.message.includes("Session expirée")) {
        // Token expired - handleResponse will redirect to login
        return;
      } else {
        toast.error(`Erreur lors du chargement du profil: ${error.message}`);
      }
      setLoading(false);
    }
  };

  // ENDPOINT USED: updateUser()
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // ENDPOINT USED: userService.updateUser()
      // Note: Email is not included as it cannot be changed
      const updatedUser = await userService.updateUser(user.id, {
        name: formData.name,
        email: user.email, // Keep original email, not from form
        phone: formData.phone,
        role: user.role,
      });

      // Update localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setUser(updatedUser);
      setEditing(false);
      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  // ENDPOINT USED: deleteUser()
  const handlePhoneChange = (e) => {
    let value = e.target.value;
    
    // Only allow digits, +, and spaces for formatting
    value = value.replace(/[^\d+\s]/g, '');
    
    // Limit to reasonable length (international format)
    if (value.length > 15) {
      value = value.substring(0, 15);
    }
    
    // Validate format: must start with + or be digits only
    if (value && !value.match(/^(\+\d{0,15}|\d{0,15})$/)) {
      return; // Don't update if invalid
    }
    
    setFormData({ ...formData, phone: value });
  };

  // ENDPOINT USED: deleteUser()
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
    setDeleteConfirmation("");
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmation !== "SUPPRIMER") {
      toast.warning('Veuillez taper "SUPPRIMER" pour confirmer');
      return;
    }

    try {
      // ENDPOINT USED: userService.deleteUser()
      await userService.deleteUser(user.id);

      // Clear localStorage
      localStorage.removeItem("user");

      toast.success("Compte supprimé avec succès");
      navigate("/");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Erreur lors de la suppression du compte");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  // Check if user data is loaded
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Aucune donnée utilisateur trouvée</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      {/* Mobile-first Container with Proper Padding */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Responsive Typography */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
            Mon Profil
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Gérez vos informations personnelles
          </p>
        </div>

        {/* Profile Card - Fully Responsive */}
        <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md sm:shadow-lg overflow-hidden transition-shadow hover:shadow-xl">
          {/* Header with Avatar - Responsive Padding */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-6 sm:p-8 lg:p-10 text-center">
            {/* Responsive Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {/* Responsive Text */}
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 break-words px-2">
              {user.name}
            </h2>
            <p className="text-primary-100 text-xs sm:text-sm">
              Membre depuis{" "}
              {new Date(user.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </div>

          {/* Profile Form - Mobile-First Padding */}
          <div className="p-4 sm:p-6 lg:p-8">
            {!editing ? (
              // View Mode
              <div className="space-y-4 sm:space-y-6">
                {/* User Name Field */}
                <div>
                  <label className="flex items-center text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">
                    <User size={14} className="mr-2 sm:mr-2 flex-shrink-0" />
                    <span>Nom complet</span>
                  </label>
                  <p className="text-base sm:text-lg text-gray-900 break-words">
                    {user.name}
                  </p>
                </div>

                {/* Email Field */}
                <div>
                  <label className="flex items-center text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">
                    <Mail size={14} className="mr-2 sm:mr-2 flex-shrink-0" />
                    <span>Email</span>
                  </label>
                  <p className="text-base sm:text-lg text-gray-900 break-all">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    L'adresse email ne peut pas être modifiée
                  </p>
                </div>

                {/* Phone Field */}
                <div>
                  <label className="flex items-center text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">
                    <Phone size={14} className="mr-2 sm:mr-2 flex-shrink-0" />
                    <span>Téléphone</span>
                  </label>
                  <p className="text-base sm:text-lg text-gray-900 break-words">
                    {user.phone}
                  </p>
                </div>

                {/* Account Type */}
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-500 mb-2 block">
                    Type de compte
                  </label>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-primary-100 text-primary-700">
                    {user.role}
                  </span>
                </div>

                {/* Edit Button - Full Width on Mobile */}
                <div className="pt-4 sm:pt-6 border-t">
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 sm:py-3 min-h-[44px] bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 active:bg-primary-800 transition-colors duration-200"
                  >
                    <Edit2 size={18} className="flex-shrink-0" />
                    <span className="text-sm sm:text-base">
                      Modifier mon profil
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              // Edit Mode
              <form onSubmit={handleUpdate} className="space-y-4 sm:space-y-6">
                {/* Name Input */}
                <div>
                  <label className="flex items-center text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    <User size={14} className="mr-2 flex-shrink-0" />
                    <span>Nom complet</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                    style={{ fontSize: "16px" }}
                    required
                  />
                </div>

                {/* Email Input (Disabled) */}
                <div>
                  <label className="flex items-center text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    <Mail size={14} className="mr-2 flex-shrink-0" />
                    <span>Email</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    style={{ fontSize: "16px" }}
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    L'adresse email ne peut pas être modifiée
                  </p>
                </div>

                {/* Phone Input */}
                <div>
                  <label className="flex items-center text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    <Phone size={14} className="mr-2 flex-shrink-0" />
                    <span>Téléphone</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="Ex: +212632151409 ou 0632151409"
                    pattern="^\+?[0-9]{10,15}$"
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                    style={{ fontSize: "16px" }}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: +212632151409 ou 0632151409 (chiffres uniquement)
                  </p>
                </div>

                {/* Action Buttons - Stack on Mobile, Side-by-Side on Desktop */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 active:bg-primary-800 transition-colors duration-200 ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Save size={18} className="flex-shrink-0" />
                    <span className="text-sm sm:text-base">
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                      });
                    }}
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200"
                  >
                    <X size={18} className="flex-shrink-0" />
                    <span className="text-sm sm:text-base">Annuler</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Danger Zone - Responsive Padding */}
          {!editing && (
            <div className="bg-red-50 border-t border-red-200 p-4 sm:p-6 lg:p-8">
              <h3 className="text-base sm:text-lg font-bold text-red-900 mb-2">
                Zone de danger
              </h3>
              <p className="text-xs sm:text-sm text-red-700 mb-4">
                La suppression de votre compte est définitive et irréversible.
              </p>
              <button
                onClick={handleDeleteClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 active:bg-red-800 transition-colors duration-200"
              >
                <Trash2 size={18} className="flex-shrink-0" />
                <span className="text-sm sm:text-base">
                  Supprimer mon compte
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Stats Card - Responsive Grid */}
        <div className="mt-4 sm:mt-6 bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
            Statistiques
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg transition-transform hover:scale-105">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-600">
                -
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Rendez-vous
              </p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg transition-transform hover:scale-105">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-600">
                -
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Salons visités
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmation("");
        }}
        onConfirm={handleConfirmDelete}
        title="Supprimer définitivement votre compte"
        message="Cette action est IRRÉVERSIBLE. Toutes vos données seront perdues."
        details={{
          Impact: "Tous vos rendez-vous seront supprimés",
          Données: "Toutes vos informations seront perdues",
          Accès: "Vous devrez créer un nouveau compte",
        }}
        requiresInput={true}
        inputValue={deleteConfirmation}
        onInputChange={setDeleteConfirmation}
        inputPlaceholder='Tapez "SUPPRIMER" en majuscules'
        inputLabel='Pour confirmer, tapez "SUPPRIMER" ci-dessous:'
        confirmText="Supprimer mon compte"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
};

export default UserProfile;
