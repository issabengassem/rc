import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { authService } from "../services/apiService";
import { useToast } from "../contexts/ToastContext";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const email = location.state?.email || "";

  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    if (!email) {
      toast.warning("No email provided");
      navigate("/register");
      return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate, toast]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    console.log("=== VERIFY EMAIL DEBUG ===");
    console.log("Email:", email);
    console.log("Verification Code:", verificationCode);

    if (verificationCode.length !== 6) {
      toast.warning("Veuillez entrer un code à 6 chiffres");
      return;
    }

    setLoading(true);

    try {
      console.log("Calling authService.verifyEmail...");
      const response = await authService.verifyEmail(email, verificationCode);
      console.log("Response received:", response);
      toast.success("Email vérifié avec succès!");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("Verification error:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      toast.error(error.message || "Code de vérification invalide");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);

    try {
      await authService.resendVerificationCode(email);
      toast.success("Nouveau code envoyé!");
      setTimeLeft(600); // Reset timer
      setVerificationCode("");
    } catch (error) {
      toast.error(error.message || "Erreur lors de l'envoi du code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Vérifiez votre email
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Un code de vérification à 6 chiffres a été envoyé à
          <br />
          <span className="font-semibold text-blue-600">{email}</span>
        </p>

        {/* Timer */}
        <div className="flex items-center justify-center gap-2 mb-6 text-gray-600">
          <Clock className="w-5 h-5" />
          <span className="font-medium">
            Code expire dans: {formatTime(timeLeft)}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-6">
          {/* Verification Code Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code de vérification
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setVerificationCode(value);
              }}
              className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="000000"
              maxLength="6"
              required
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Entrez le code à 6 chiffres reçu par email
            </p>
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={loading || verificationCode.length !== 6}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition ${
              loading || verificationCode.length !== 6
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Vérification...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Vérifier
              </>
            )}
          </button>
        </form>

        {/* Resend Code */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Vous n'avez pas reçu le code?
          </p>
          <button
            onClick={handleResend}
            disabled={resending || timeLeft === 0}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-4 h-4 ${resending ? "animate-spin" : ""}`}
            />
            {resending ? "Envoi en cours..." : "Renvoyer le code"}
          </button>
        </div>

        {/* Back to Register */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/register")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Retour à l'inscription
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
