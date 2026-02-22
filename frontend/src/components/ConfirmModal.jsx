import React from "react";
import { AlertTriangle, X } from "lucide-react";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  details,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "warning",
  requiresInput = false,
  inputValue = "",
  onInputChange = null,
  inputPlaceholder = "",
  inputLabel = "",
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: "text-yellow-600",
      button: "bg-yellow-600 hover:bg-yellow-700",
    },
    danger: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "text-red-600",
      button: "bg-red-600 hover:bg-red-700",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700",
    },
  };

  const style = typeStyles[type] || typeStyles.warning;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 transform transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95"
          >
            <X size={22} />
          </button>

          {/* Icon */}
          <div
            className={`w-14 h-14 sm:w-12 sm:h-12 rounded-full ${style.bg} ${style.border} border-2 flex items-center justify-center mb-4 sm:mb-4`}
          >
            <AlertTriangle className={style.icon} size={26} />
          </div>

          {/* Title */}
          <h3 className="text-xl sm:text-xl font-bold text-gray-900 mb-3 pr-8">
            {title}
          </h3>

          {/* Message */}
          <p className="text-base sm:text-base text-gray-600 mb-4 leading-relaxed">
            {message}
          </p>

          {/* Details */}
          {details && (
            <div
              className={`${style.bg} ${style.border} border rounded-lg p-4 mb-6 overflow-x-auto`}
            >
              <div className="space-y-2.5">
                {Object.entries(details).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-3 text-sm sm:text-sm"
                  >
                    <span className="font-semibold text-gray-700">{key}:</span>
                    <span className="text-gray-900 break-words">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input field for confirmation */}
          {requiresInput && (
            <div className="mb-5">
              {inputLabel && (
                <label className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                  {inputLabel}
                </label>
              )}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => onInputChange && onInputChange(e.target.value)}
                placeholder={inputPlaceholder}
                className="w-full px-4 py-3.5 sm:py-2.5 text-base border border-gray-300 rounded-xl sm:rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors min-h-[52px] sm:min-h-[44px]"
                autoFocus
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-4 sm:py-2.5 border border-gray-300 rounded-xl sm:rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors min-h-[52px] sm:min-h-[44px] text-base active:scale-98"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
              }}
              className={`w-full sm:flex-1 px-4 py-4 sm:py-2.5 rounded-xl sm:rounded-lg text-white font-medium transition-colors min-h-[52px] sm:min-h-[44px] text-base active:scale-98 ${style.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
