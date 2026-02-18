// Toast utility for non-React contexts or easier imports
// Note: For React components, use useToast() hook instead

let toastInstance = null;

export const setToastInstance = (instance) => {
  toastInstance = instance;
};

export const toast = {
  success: (message, title, duration) => {
    if (toastInstance) {
      toastInstance.success(message, title, duration);
    } else {
      console.warn("Toast not initialized. Falling back to alert.");
      alert(message);
    }
  },
  error: (message, title, duration) => {
    if (toastInstance) {
      toastInstance.error(message, title, duration);
    } else {
      console.warn("Toast not initialized. Falling back to alert.");
      alert(message);
    }
  },
  warning: (message, title, duration) => {
    if (toastInstance) {
      toastInstance.warning(message, title, duration);
    } else {
      console.warn("Toast not initialized. Falling back to alert.");
      alert(message);
    }
  },
  info: (message, title, duration) => {
    if (toastInstance) {
      toastInstance.info(message, title, duration);
    } else {
      console.warn("Toast not initialized. Falling back to alert.");
      alert(message);
    }
  },
  show: ({ type, message, title, duration }) => {
    if (toastInstance) {
      toastInstance.showToast({ type, message, title, duration });
    } else {
      console.warn("Toast not initialized. Falling back to alert.");
      alert(message);
    }
  },
};
