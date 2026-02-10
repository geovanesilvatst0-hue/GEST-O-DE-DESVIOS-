
import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[110] flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-2xl border border-gray-100 animate-in slide-in-from-right-10 duration-300">
      <div className={`p-1.5 rounded-lg ${type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
        {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      </div>
      <p className="text-sm font-bold text-gray-700 pr-4">{message}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
      <div className={`absolute bottom-0 left-0 h-1 bg-current opacity-20 transition-all duration-[5000ms] ease-linear w-full ${type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`} style={{ width: '0%', animation: 'progress 5s linear forwards' }} />
      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default Toast;
