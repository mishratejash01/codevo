"use client";

import { CornerRightUp, FileUp, Paperclip, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useFileInput } from "@/hooks/use-file-input";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";

interface FileDisplayProps {
  fileName: string;
  onClear: () => void;
}

function FileDisplay({ fileName, onClear }: FileDisplayProps) {
  return (
    <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 w-fit px-3 py-1 rounded-lg group border dark:border-white/10">
      <FileUp className="w-4 h-4 dark:text-white" />
      <span className="text-sm dark:text-white">{fileName}</span>
      <button
        type="button"
        onClick={onClear}
        className="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        <X className="w-3 h-3 dark:text-white" />
      </button>
    </div>
  );
}

interface AIInputWithFileProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  accept?: string;
  maxFileSize?: number;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (message: string, file?: File) => void;
  className?: string;
  showAttachment?: boolean;
}

export function AIInputWithFile({
  id = "ai-input-with-file",
  placeholder = "File Upload and Chat!",
  minHeight = 52,
  maxHeight = 200,
  accept = "image/*",
  maxFileSize = 5,
  value,
  onChange,
  onSubmit,
  className,
  showAttachment = true
}: AIInputWithFileProps) {
  // Internal state if uncontrolled, or sync with prop if controlled
  const [internalValue, setInternalValue] = useState<string>("");
  
  const inputValue = value !== undefined ? value : internalValue;

  const { fileName, fileInputRef, handleFileSelect, clearFile, selectedFile } =
    useFileInput({ accept, maxSize: maxFileSize });

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });

  // Recalculate height when value changes programmatically
  useEffect(() => {
    adjustHeight();
  }, [inputValue, adjustHeight]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    if (onChange) {
      onChange(newVal);
    } else {
      setInternalValue(newVal);
    }
    adjustHeight();
  };

  const handleSubmit = () => {
    if (inputValue.trim() || selectedFile) {
      onSubmit?.(inputValue, selectedFile);
      if (value === undefined) {
         setInternalValue("");
      }
      adjustHeight(true);
    }
  };

  return (
    <div className={cn("w-full py-2 px-0", className)}>
      <div className="relative w-full mx-auto flex flex-col gap-2">
        {showAttachment && fileName && <FileDisplay fileName={fileName} onClear={clearFile} />}

        <div className="relative">
          {showAttachment && (
            <>
              <div
                className="absolute left-3 top-4 sm:top-5 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-lg bg-black/5 dark:bg-white/5 hover:cursor-pointer transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-4 h-4 transition-opacity transform scale-x-[-1] rotate-45 dark:text-white" />
              </div>

              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept={accept}
              />
            </>
          )}

          <Textarea
            id={id}
            placeholder={placeholder}
            className={cn(
              "bg-black/5 dark:bg-[#121214] w-full rounded-2xl sm:rounded-3xl border border-white/5 focus:border-primary/50",
              showAttachment ? "pl-12" : "pl-4", // Adjust padding if attachment button is hidden
              "pr-12 sm:pr-16",
              "placeholder:text-black/70 dark:placeholder:text-white/30",
              "text-black dark:text-white text-wrap py-3 sm:py-4",
              "text-sm sm:text-base",
              "max-h-[200px] overflow-y-auto resize-none leading-[1.4]",
              `min-h-[${minHeight}px]`
            )}
            ref={textareaRef}
            value={inputValue}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                // If it's acting as a submit form, prevent default. 
                // But for Bio, we might want newlines. 
                // We'll assume if onSubmit is passed, we submit. If purely editing (like bio), we allow newlines.
                if (onSubmit) {
                   e.preventDefault();
                   handleSubmit();
                }
              }
            }}
          />

          {onSubmit && (
            <button
              onClick={handleSubmit}
              className="absolute right-3 top-4 sm:top-5 -translate-y-1/2 rounded-xl bg-primary hover:bg-primary/90 py-1.5 px-1.5 transition-colors"
              type="button"
            >
              <CornerRightUp
                className={cn(
                  "w-4 h-4 text-white transition-opacity",
                  (inputValue || selectedFile) ? "opacity-100" : "opacity-70"
                )}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
