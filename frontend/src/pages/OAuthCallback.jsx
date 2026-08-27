import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const userParam = searchParams.get("user");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage(decodeURIComponent(error));
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage("Aucun token reçu de Google. Veuillez réessayer.");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    try {
      localStorage.setItem("accessToken", token);
      if (userParam) {
        const userJson = decodeURIComponent(userParam);
        const user = JSON.parse(userJson);
        localStorage.setItem("user", JSON.stringify(user));
        // Redirect by role
        setStatus("success");
        setMessage(`Bienvenue ${user.name || user.email} !`);
        setTimeout(() => {
          if (user.role === "OWNER") navigate("/mes-salons");
          else navigate("/salons");
        }, 1200);
      } else {
        // If no user param, fetch user via token later or just redirect
        setStatus("success");
        setMessage("Connexion Google réussie !");
        setTimeout(() => navigate("/salons"), 1200);
      }
    } catch (e) {
      console.error("OAuth callback parse error:", e);
      setStatus("error");
      setMessage("Erreur lors du traitement de la réponse Google");
      setTimeout(() => navigate("/login"), 3000);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="animate-spin mx-auto text-primary-600 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-900">Connexion Google en cours...</h2>
            <p className="text-sm text-gray-600 mt-2">Veuillez patienter</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-900">Succès !</h2>
            <p className="text-sm text-gray-600 mt-2">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="mx-auto text-red-600 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-900">Erreur</h2>
            <p className="text-sm text-red-600 mt-2">{message}</p>
            <p className="text-xs text-gray-500 mt-4">Redirection vers la page de connexion...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
