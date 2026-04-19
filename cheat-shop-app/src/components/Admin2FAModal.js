'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Eye, EyeOff } from 'lucide-react';
import { useNotification } from '@/components/NotificationComponent';

export default function Admin2FAModal({ isOpen, onClose, admin }) {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  // Load or generate 2FA setup
  useEffect(() => {
    if (isOpen && admin) {
      // Always show QR code for admin
      generateQRCode();
    }
  }, [isOpen, admin]);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/2fa/setup', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminId: admin.id }),
      });

      const data = await response.json();
      
      if (data.success) {
        setQrCode(data.data.qrCode);
        setSecret(data.data.secret);
      } else {
        addNotification(data.error || 'Failed to generate QR code', 'error');
      }
    } catch (error) {
      console.error('[2FA] QR generation error:', error);
      addNotification('Failed to generate QR code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    addNotification('Secret copied to clipboard', 'success');
  };

  const handleClose = () => {
    setQrCode('');
    setSecret('');
    setShowSecret(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-[#0B0B0B] border border-[#252525] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-regular text-white">
                2FA for {admin?.login}
              </h3>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-[#262626] rounded transition-colors cursor-pointer"
              >
                <X className="h-4 w-4 text-[#989898]" />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#989898] font-light">Loading QR code...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  {qrCode && (
                    <div className="bg-white p-4 rounded-xl inline-block mb-4">
                      <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                    </div>
                  )}
                </div>

                {secret && (
                  <div>
                    <label className="block text-sm font-regular text-white mb-2">
                      Manual Entry Key (if QR scan fails)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        value={secret}
                        readOnly
                        className="flex-1 bg-[#161616] border border-[#383838] rounded-xl px-4 py-3 text-white font-mono text-sm"
                      />
                      <button
                        onClick={() => setShowSecret(!showSecret)}
                        className="p-3 hover:bg-[#262626] rounded-xl transition-colors cursor-pointer"
                      >
                        {showSecret ? (
                          <EyeOff className="h-4 w-4 text-[#989898]" />
                        ) : (
                          <Eye className="h-4 w-4 text-[#989898]" />
                        )}
                      </button>
                      <button
                        onClick={copySecret}
                        className="p-3 hover:bg-[#262626] rounded-xl transition-colors cursor-pointer"
                      >
                        <Copy className="h-4 w-4 text-[#989898]" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-[#161616] border border-[#383838] rounded-xl p-4">
                  <h5 className="text-white font-regular mb-2">Instructions for admin:</h5>
                  <ol className="text-[#989898] text-sm space-y-1 list-decimal list-inside">
                    <li>Install Google Authenticator or similar TOTP app</li>
                    <li>Scan the QR code above or manually enter the key</li>
                    <li>The app will generate 6-digit codes every 30 seconds</li>
                    <li>Use these codes when logging into admin panel</li>
                  </ol>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-[#161616] border border-[#393939] text-[#989898] hover:text-white rounded-xl transition-colors cursor-pointer font-regular"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}