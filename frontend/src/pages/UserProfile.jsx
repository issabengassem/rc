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
          "Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur http://localhost:8080",
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil</h1>
          <p className="text-gray-600">Gérez vos informations personnelles</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header with Avatar */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-8 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-4xl font-bold text-primary-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
            <p className="text-primary-100 text-sm">
              Membre depuis{" "}
              {new Date(user.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </div>

          {/* Profile Form */}
          <div className="p-8">
            {!editing ? (
              // View Mode
              <div className="space-y-6">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-500 mb-2">
                    <User size={16} className="mr-2" />
                    Nom complet
                  </label>
                  <p className="text-lg text-gray-900">{user.name}</p>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-500 mb-2">
                    <Mail size={16} className="mr-2" />
                    Email
                  </label>
                  <p className="text-lg text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    L'adresse email ne peut pas être modifiée
                  </p>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-500 mb-2">
                    <Phone size={16} className="mr-2" />
                    Téléphone
                  </label>
                  <p className="text-lg text-gray-900">{user.phone}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">
                    Type de compte
                  </label>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary-100 text-primary-700">
                    {user.role}
                  </span>
                </div>

                {/* Edit Button */}
                <div className="pt-6 border-t">
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
                  >
                    <Edit2 size={18} />
                    Modifier mon profil
                  </button>
                </div>
              </div>
            ) : (
              // Edit Mode
              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="mr-2" />
                    Nom complet <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <Mail size={16} className="mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    L'adresse email ne peut pas être modifiée
                  </p>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <Phone size={16} className="mr-2" />
                    Téléphone <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Save size={18} />
                    {saving ? "Enregistrement..." : "Enregistrer"}
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
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    <X size={18} />
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Danger Zone */}
          {!editing && (
            <div className="bg-red-50 border-t border-red-200 p-8">
              <h3 className="text-lg font-bold text-red-900 mb-2">
                Zone de danger
              </h3>
              <p className="text-sm text-red-700 mb-4">
                La suppression de votre compte est définitive et irréversible.
              </p>
              <button
                onClick={handleDeleteClick}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
              >
                <Trash2 size={18} />
                Supprimer mon compte
              </button>
            </div>
          )}
        </div>

        {/* Stats Card */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-bold text-gray-900 mb-4">Statistiques</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">-</p>
              <p className="text-sm text-gray-600">Rendez-vous</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">-</p>
              <p className="text-sm text-gray-600">Salons visités</p>
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
