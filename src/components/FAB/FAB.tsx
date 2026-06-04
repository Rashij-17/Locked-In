// ==========================================
// 🔒 Locked In — FAB (Floating Action Button)
// ==========================================

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export default function FAB() {
  const openTaskModal = useUIStore((s) => s.openTaskModal);

  return (
    <motion.button
      onClick={() => openTaskModal()}
      className="animate-pulse-glow"
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.92 }}
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        width: 56,
        height: 56,
        borderRadius: 16,
        border: 'none',
        background: 'var(--accent)',
        color: 'var(--accent-text)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
        boxShadow: '0 4px 20px var(--shadow-accent)',
      }}
      title="Create new task"
    >
      <Plus size={26} strokeWidth={2.5} />
    </motion.button>
  );
}
