import React, { useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const Toast = ({
  id,
  type = "info",
  title,
  message,
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const types = {
    success: {
      bgColor: "bg-green-50",
      borderColor: "border-green-500",
      textColor: "text-green-800",
      iconColor: "text-green-500",
      icon: CheckCircle,
      defaultTitle: "Succès",
    },
    error: {
      bgColor: "bg-red-50",
      borderColor: "border-red-500",
      textColor: "text-red-800",
      iconColor: "text-red-500",
      icon: XCircle,
      defaultTitle: "Erreur",
    },
    warning: {
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-500",
      textColor: "text-yellow-800",
      iconColor: "text-yellow-500",
      icon: AlertTriangle,
      defaultTitle: "Attention",
    },
    info: {
      bgColor: "bg-blue-50",
      borderColor: "border-blue-500",
      textColor: "text-blue-800",
      iconColor: "text-blue-500",
      icon: Info,
      defaultTitle: "Information",
    },
  };

  const config = types[type] || types.info;
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border-l-4 rounded-lg shadow-lg p-4 mb-3 min-w-[320px] max-w-md animate-slideInRight`}
      role="alert"
    >
      <div className="flex items-start">
        <Icon
          className={`${config.iconColor} mr-3 flex-shrink-0 mt-0.5`}
          size={24}
        />
        <div className="flex-1">
          <h3 className={`font-semibold ${config.textColor} mb-1`}>
            {displayTitle}
          </h3>
          <p className={`text-sm ${config.textColor}`}>{message}</p>
        </div>
        <button
          onClick={() => onClose(id)}
          className={`${config.iconColor} hover:opacity-70 transition-opacity ml-3 flex-shrink-0`}
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
