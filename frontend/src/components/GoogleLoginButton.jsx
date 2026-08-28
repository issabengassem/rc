import React, { useEffect, useRef, useState } from "react";
import { getBackendBaseUrl, getApiBaseUrl } from "../services/apiService";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "553267498033-e0j2h01ouk14hp43mbg7bt248i162ns3.apps.googleusercontent.com";

const GoogleLoginButton = ({ onSuccess, onError, text = "signin_with" }) => {
  const gisDivRef = useRef(null);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [useGis, setUseGis] = useState(true);

  const backendBase = getBackendBaseUrl();
  const apiBase = getApiBaseUrl();

  // 1) Redirect flow (OAuth2 code) - always available
  const handleRedirectLogin = () => {
    // Spring Security OAuth2 authorization endpoint
    window.location.href = `${backendBase}/oauth2/authorization/google`;
  };

  // 2) ID Token flow (GIS) - verifies via POST /api/auth/google
  useEffect(() => {
    // Load Google Identity Services script
    if (document.getElementById("google-gis-script")) {
      setGisLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "google-gis-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGisLoaded(true);
    script.onerror = () => setUseGis(false);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!gisLoaded || !useGis || !window.google) return;
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          const idToken = response.credential;
          if (!idToken) {
            onError && onError("Aucun token Google reçu");
            return;
          }
          try {
            const res = await fetch(`${apiBase}/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({ error: res.statusText }));
              throw new Error(err.error || err.message || "Échec vérification Google");
            }
            const data = await res.json();
            // Store JWT and user like normal login
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("user", JSON.stringify(data.user));
            onSuccess && onSuccess(data);
          } catch (e) {
            console.error("GIS login failed:", e);
            onError && onError(e.message);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render the official Google button in hidden container, then we trigger it via custom button
      if (gisDivRef.current) {
        window.google.accounts.id.renderButton(gisDivRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text,
          locale: "fr",
        });
      }
    } catch (e) {
      console.warn("GIS init failed, falling back to redirect flow:", e);
      setUseGis(false);
    }
  }, [gisLoaded, useGis, apiBase, onSuccess, onError, text]);

  return (
    <div className="w-full">
      {/* Redirect flow button - primary */}
      <button
        type="button"
        onClick={handleRedirectLogin}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow transition-all text-sm font-medium text-gray-700"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="w-5 h-5"
        />
        Continuer avec Google
      </button>

      {/* GIS rendered button (hidden but functional) - shown as alternative */}
      <div className="mt-3 flex flex-col items-center">
        <div className="text-xs text-gray-400 my-1">ou via Google Identity</div>
        <div ref={gisDivRef} className={useGis ? "mt-1" : "hidden"} />
      </div>

      <p className="text-[10px] text-gray-400 text-center mt-2">
        Connexion sécurisée via Google OAuth2
      </p>
    </div>
  );
};

export default GoogleLoginButton;
