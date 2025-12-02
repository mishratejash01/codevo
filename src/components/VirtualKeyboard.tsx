import { useMemo } from 'react';
import { cn } from "@/lib/utils";

interface VirtualKeyboardProps {
  activeChar: string | null;
}

const KEY_ROWS = [
  [
    { label: "esc", width: 1.2 }, { label: "F1" }, { label: "F2" }, { label: "F3" }, { label: "F4" }, { label: "F5" }, { label: "F6" }, { label: "F7" }, { label: "F8" }, { label: "F9" }, { label: "F10" }, { label: "F11" }, { label: "F12" }, { label: "del", width: 1.2 }
  ],
  [
    { label: "`", value: "`~" }, { label: "1", value: "1!" }, { label: "2", value: "2@" }, { label: "3", value: "3#" }, { label: "4", value: "4$" }, { label: "5", value: "5%" }, { label: "6", value: "6^" }, { label: "7", value: "7&" }, { label: "8", value: "8*" }, { label: "9", value: "9(" }, { label: "0", value: "0)" }, { label: "-", value: "-_" }, { label: "=", value: "=+" }, { label: "←", width: 1.5, value: "Backspace" }
  ],
  [
    { label: "tab", width: 1.5, value: "\t" }, { label: "Q" }, { label: "W" }, { label: "E" }, { label: "R" }, { label: "T" }, { label: "Y" }, { label: "U" }, { label: "I" }, { label: "O" }, { label: "P" }, { label: "[", value: "[{" }, { label: "]", value: "]}" }, { label: "\\", value: "\\|", width: 1 }
  ],
  [
    { label: "caps", width: 1.8, value: "CapsLock" }, { label: "A" }, { label: "S" }, { label: "D" }, { label: "F" }, { label: "G" }, { label: "H" }, { label: "J" }, { label: "K" }, { label: "L" }, { label: ";", value: ";:" }, { label: "'", value: "'\"" }, { label: "enter", width: 2.2, value: "\n" }
  ],
  [
    { label: "shift", width: 2.4, value: "Shift" }, { label: "Z" }, { label: "X" }, { label: "C" }, { label: "V" }, { label: "B" }, { label: "N" }, { label: "M" }, { label: ",", value: ",<" }, { label: ".", value: ".>" }, { label: "/", value: "/?" }, { label: "shift", width: 2.4, value: "Shift" }
  ],
  [
    { label: "fn" }, { label: "ctrl" }, { label: "opt" }, { label: "cmd", width: 1.2 }, { label: "", width: 6.5, value: " " }, { label: "cmd", width: 1.2 }, { label: "opt" }, { label: "◄" }, { label: "▲" }, { label: "▼" }, { label: "►" }
  ]
];

export function VirtualKeyboard({ activeChar }: VirtualKeyboardProps) {
  const isActive = (keyLabel: string, keyValue?: string) => {
    if (!activeChar) return false;
    
    const char = activeChar.toLowerCase();
    const label = keyLabel.toLowerCase();
    
    // Direct match (letters)
    if (char === label) return true;
    
    // Special keys
    if (activeChar === ' ' && !keyLabel) return true; // Spacebar
    if (activeChar === '\n' && label === 'enter') return true;
    
    // Symbol matching
    if (keyValue && keyValue.includes(activeChar)) return true;
    
    // Shift key logic
    if (label === 'shift') {
       const isUpper = activeChar !== activeChar.toLowerCase();
       const isSymbolShift = '~!@#$%^&*()_+{}|:"<>?'.includes(activeChar);
       return isUpper || isSymbolShift;
    }

    return false;
  };

  return (
    <div className="w-full mx-auto select-none perspective-1000">
      {/* Keyboard Container */}
      <div className="relative p-2 md:p-4 bg-[#0f0f11] rounded-xl md:rounded-2xl border border-white/10 shadow-2xl transform transition-transform duration-500 hover:rotate-x-1 group">
        
        {/* White Backlight Glow */}
        <div className="absolute -inset-1 bg-white/5 blur-xl -z-10 rounded-full opacity-60 group-hover:opacity-80 transition-opacity" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/5 pointer-events-none rounded-xl" />

        <div className="flex flex-col gap-1 md:gap-1.5">
          {KEY_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 md:gap-1.5 justify-center">
              {row.map((key, keyIndex) => {
                const active = isActive(key.label, key.value);
                return (
                  <div
                    key={keyIndex}
                    className={cn(
                      "h-8 md:h-12 flex items-center justify-center text-[8px] md:text-[10px] lg:text-xs font-medium transition-all duration-75 rounded-[4px] md:rounded-lg border-b-[2px] md:border-b-[3px] relative overflow-hidden",
                      active 
                        ? "bg-white text-black border-gray-300 shadow-[0_0_20px_rgba(255,255,255,0.8)] translate-y-[1px] border-b-[1px] scale-95 z-10" 
                        : "bg-[#1a1a1c] border-black/50 text-gray-400 hover:bg-[#252528] hover:text-white"
                    )}
                    style={{ 
                      flex: key.width || 1,
                      minWidth: key.width ? `${key.width * 1.5}rem` : 'auto' 
                    }}
                  >
                    {/* Key Shine Effect */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/20" />
                    {key.label}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
