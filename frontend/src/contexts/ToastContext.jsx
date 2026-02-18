import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/Toast";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(
    ({ type = "info", title, message, duration = 4000 }) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);
      return id;
    },
    [],
  );

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Convenience methods
  const success = useCallback(
    (message, title, duration) => {
      return showToast({ type: "success", message, title, duration });
    },
    [showToast],
  );

  const error = useCallback(
    (message, title, duration) => {
      return showToast({ type: "error", message, title, duration });
    },
    [showToast],
  );

  const warning = useCallback(
    (message, title, duration) => {
      return showToast({ type: "warning", message, title, duration });
    },
    [showToast],
  );

  const info = useCallback(
    (message, title, duration) => {
      return showToast({ type: "info", message, title, duration });
    },
    [showToast],
  );

  return (
    <ToastContext.Provider
      value={{ showToast, success, error, warning, info, removeToast }}
    >
      {children}

      {/* Toast Container */}
      <div className="fixed top-20 right-4 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              duration={toast.duration}
              onClose={removeToast}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};
