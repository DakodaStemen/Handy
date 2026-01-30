import React, { useEffect, useRef } from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "compact";
  autoGrow?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  className = "",
  variant = "default",
  autoGrow = false,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoGrow && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  }, [props.value, autoGrow]);

  const baseClasses = `px-2 py-1 text-sm font-semibold bg-mid-gray/10 border border-mid-gray/80 rounded text-left transition-[background-color,border-color] duration-150 hover:bg-logo-primary/10 hover:border-logo-primary focus:outline-none focus:bg-logo-primary/10 focus:border-logo-primary ${autoGrow ? "resize-none overflow-y-auto" : "resize-y overflow-auto"}`;

  const variantClasses = {
    default: "px-3 py-2 min-h-[100px]",
    compact: "px-2 py-1 min-h-[80px]",
  };

  return (
    <textarea
      ref={textareaRef}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
};
