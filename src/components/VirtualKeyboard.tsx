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
    { label: "shift", width: 2.4, value: "Shift" }, { label: "Z" }, { label: "X" }, { label: "C" }, { label: "V" }, { label: "B" }, { label: "N" }, { label: ",", value: ",<" }, { label: ".", value: ".>" }, { label: "/", value: "/?" }, { label: "shift", width: 2.4, value: "Shift" }
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
    if (char === label) return true;
    if (activeChar === ' ' && !keyLabel) return true;
    if (activeChar === '\n' && label === 'enter') return true;
    if (keyValue && keyValue.includes(activeChar)) return true;
    if (label === 'shift') {
       const isUpper = activeChar !== activeChar.toLowerCase();
       const isSymbolShift = '~!@#$%^&*()_+{}|:"<>?'.includes(activeChar);
       return isUpper || isSymbolShift;
    }
    return false;
  };

  return (
    <div className="w-full mx-auto select-none perspective-1000">
      {/* Main Keyboard Chassis - Responsive key base unit */}
      <div className="relative p-1 md:p-4 bg-[#080808] rounded-lg md:rounded-2xl border border-white/10 shadow-2xl transform transition-transform duration-500 hover:rotate-x-1 group [--kb-unit:5.2vw] md:[--kb-unit:1.8rem]">
        
        {/* Stronger White Under-glow for visibility */}
        <div className="absolute -inset-2 bg-white/5 blur-3xl -z-10 rounded-full opacity-30" />

        <div className="flex flex-col gap-[0.3rem] md:gap-1.5">
          {KEY_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-[0.3rem] md:gap-1.5 justify-center">
              {row.map((key, keyIndex) => {
                const active = isActive(key.label, key.value);
                const isEnter = key.label === "enter";
                
                return (
                  <div
                    key={keyIndex}
                    className={cn(
                      // Base Shape & Dark Theme - Responsive Height and Text
                      "h-[2rem] md:h-12 flex items-center justify-center text-[8px] md:text-xs font-bold transition-all duration-75 rounded-[3px] md:rounded-[6px] border-b-[2px] md:border-b-[3px] relative overflow-hidden",
                      "bg-[#0a0a0a] border-black", 

                      // IDLE STATE: Bright White Backlight (Always On)
                      !active && "text-white shadow-[0_0_15px_rgba(255,255,255,0.25)] border-b-white/10",

                      // ACTIVE STATE: 
                      // Standard Keys -> Blue Backlight
                      active && !isEnter && "text-blue-500 border-blue-900 shadow-[0_0_20px_rgba(59,130,246,0.8)] translate-y-[2px] border-b-[1px]",
                      
                      // Enter Key -> Dark Green Backlight
                      active && isEnter && "text-green-600 border-green-900 shadow-[0_0_20px_rgba(22,163,74,0.8)] translate-y-[2px] border-b-[1px]"
                    )}
                    style={{ 
                      flex: key.width || 1,
                      // Dynamic width calculation using CSS variable
                      minWidth: key.width ? `calc(${key.width} * var(--kb-unit))` : 'auto'
                    }}
                  >
                    <span className="relative z-10 tracking-wide">{key.label}</span>
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
