import { useState } from "react";
import { motion } from "framer-motion";// ── Slide Button ──────────────────────────────────────────────────────────────
interface SlideButtonProps {
    isGradient?: boolean;
    label: string;
    onClick?: () => void;
}export const SlideButton: React.FC<SlideButtonProps> = ({ isGradient = false, label, onClick }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`w-full rounded-full text-shadow-2xs cursor-pointer py-3.5 text-[14px] font-medium transition-all duration-300 shadow-sm overflow-hidden relative ${isGradient
                ? 'bg-black/80 hover:bg-black/90 border-white/20 backdrop-blur-md text-white'
                : 'bg-[#1a1a1a] hover:bg-black text-white'
                }`}
        >
            {/* Outgoing — slides up and out */}
            <motion.span
                className="absolute inset-0 flex items-center justify-center"
                animate={hovered ? { y: '-100%', opacity: 0 } : { y: '0%', opacity: 1 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
                {label}
            </motion.span>

            {/* Incoming — slides up from below */}
            <motion.span
                className="absolute inset-0 flex items-center justify-center"
                initial={{ y: '100%', opacity: 0 }}
                animate={hovered ? { y: '0%', opacity: 1 } : { y: '100%', opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
                {label}
            </motion.span>

            {/* Spacer to hold button height */}
            <span className="invisible">{label}</span>
        </button>
    );
};