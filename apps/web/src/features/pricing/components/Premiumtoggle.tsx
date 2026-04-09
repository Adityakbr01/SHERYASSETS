"use client";import { motion } from 'framer-motion';interface PremiumToggleProps {
    isYearly: boolean;
    setIsYearly: (val: boolean) => void;
}export const PremiumToggle: React.FC<PremiumToggleProps> = ({ isYearly, setIsYearly }) => {
    return (
        <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">

                {/* Monthly label */}
                <span
                    className="text-[13px] font-medium transition-colors duration-200"
                    style={{ color: !isYearly ? 'var(--foreground)' : 'var(--foreground-muted)' }}
                >
                    Monthly
                </span>

                {/* Track */}
                <button
                    onClick={() => setIsYearly(!isYearly)}
                    className="relative w-[62px] h-[28px] cursor-pointer rounded-full focus:outline-none transition-colors duration-300"
                    style={{
                        background: isYearly ? 'var(--toggle-on)' : 'var(--toggle-off)',
                        border: '1px solid var(--border)',
                    }}
                    aria-label="Toggle billing cycle"
                >
                    {/* Thumb */}
                    <motion.span
                        className="absolute top-[3px] left-[3px] w-[20px] h-[20px] rounded-full shadow-sm"
                        style={{ background: 'var(--toggle-thumb)' }}
                        animate={{ x: isYearly ? 34 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                </button>

                {/* Yearly label */}
                <span
                    className="text-[13px] font-medium transition-colors duration-200"
                    style={{ color: isYearly ? 'var(--foreground)' : 'var(--foreground-muted)' }}
                >
                    Yearly
                </span>

                {/* Save badge */}
                <motion.span
                    initial={false}
                    animate={{
                        opacity: isYearly ? 1 : 0,
                        scale: isYearly ? 1 : 0.8,
                        x: isYearly ? 0 : -4,
                    }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{
                        background: 'var(--brand-muted)',
                        color: 'var(--brand-text)',
                        border: '1px solid var(--brand)',
                        letterSpacing: '0.04em',
                    }}
                >
                    SAVE 20%
                </motion.span>
            </div>
        </div>
    );
};