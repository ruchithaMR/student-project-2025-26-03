import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-yellow-500 text-white'
  };

  const icons = {
    success: 'ri-check-line',
    error: 'ri-close-line',
    info: 'ri-information-line',
    warning: 'ri-error-warning-line'
  };

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
      <div className={`${styles[type]} px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]`}>
        <i className={`${icons[type]} text-2xl`}></i>
        <span className="font-medium flex-1">{message}</span>
        <button
          onClick={onClose}
          className="hover:bg-white/20 rounded p-1 transition-colors"
        >
          <i className="ri-close-line"></i>
        </button>
      </div>
    </div>
  );
}