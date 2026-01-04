import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Github, Linkedin, Mail, Twitter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function HitMeUpWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[320px] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Main Profile Content */}
            <div className="p-6 flex flex-col items-center text-center">
                
                {/* Header Text */}
                <div className="space-y-1 mb-6">
                    <h3 className="text-xl font-bold text-white font-sans tracking-tight">Let's Connect</h3>
                    <p className="text-gray-400 text-xs leading-relaxed max-w-[200px] mx-auto">
                        Connect with us on social or drop a message.
                    </p>
                </div>

                {/* Profile Card (Centered) */}
                <div className="w-full flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-[1.5px] shrink-0">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                            <span className="text-lg font-bold text-white">CV</span> 
                        </div>
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-lg">Team Codevo</h4>
                        <p className="text-sm text-blue-400 font-mono">@codevo_official</p>
                    </div>
                </div>

                {/* Social Actions */}
                <div className="flex justify-center gap-3 w-full">
                    {[Github, Linkedin, Twitter, Mail].map((Icon, i) => (
                        <Button key={i} variant="outline" size="icon" className="w-10 h-10 rounded-full border-white/10 bg-white/5 hover:bg-white hover:text-black hover:border-transparent transition-all">
                            <Icon className="w-4 h-4" />
                        </Button>
                    ))}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (Arrow <-> Cross) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-white text-black rounded-full shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:bg-zinc-200 transition-all duration-300 flex items-center justify-center group z-50 overflow-hidden relative"
        aria-label="Toggle widget"
      >
        <div className="relative w-6 h-6">
            {/* Arrow Icon (Visible when closed) */}
            <motion.div
                initial={false}
                animate={{ rotate: isOpen ? 180 : 0, opacity: isOpen ? 0 : 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
            >
                {/* Using ChevronLeft to match original request of 'arrow mark' */}
                <ChevronLeft className="w-6 h-6 mr-0.5" /> 
            </motion.div>

            {/* Cross Icon (Visible when open) */}
            <motion.div
                initial={false}
                animate={{ rotate: isOpen ? 0 : -180, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
            >
                <X className="w-6 h-6" />
            </motion.div>
        </div>
      </button>
    </div>
  );
}
