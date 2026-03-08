/**
 * Lightweight native-select wrappers that match the shadcn/radix Select API surface.
 * Drop-in replacements so pages compile without @radix-ui/react-select.
 */
"use client";

import * as React from "react";

// ─── Select ──────────────────────────────────────────────────────────────────

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ value, defaultValue, onValueChange, children }: SelectProps) {
  return (
    <SelectContext.Provider value={{ value, defaultValue, onValueChange }}>
      {children}
    </SelectContext.Provider>
  );
}

interface SelectContextValue {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const SelectContext = React.createContext<SelectContextValue>({});

// ─── SelectTrigger ───────────────────────────────────────────────────────────

interface SelectTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
}

export function SelectTrigger({ children, className = "", ...props }: SelectTriggerProps) {
  return (
    <button
      type="button"
      className={`flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── SelectValue ─────────────────────────────────────────────────────────────

interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}

export function SelectValue({ placeholder, children }: SelectValueProps) {
  const ctx = React.useContext(SelectContext);
  return <span>{ctx.value ?? children ?? placeholder ?? ""}</span>;
}

// ─── SelectContent ───────────────────────────────────────────────────────────

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectContent({ children, className = "" }: SelectContentProps) {
  // Rendered inline; positioning handled by the parent layout.
  return (
    <div
      className={`relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md ${className}`}
    >
      {children}
    </div>
  );
}

// ─── SelectItem ──────────────────────────────────────────────────────────────

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function SelectItem({ value, children, className = "", onClick, ...props }: SelectItemProps) {
  const ctx = React.useContext(SelectContext);
  const isSelected = ctx.value === value;

  return (
    <div
      role="option"
      aria-selected={isSelected}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${isSelected ? "bg-accent text-accent-foreground" : ""} ${className}`}
      onClick={(e) => {
        ctx.onValueChange?.(value);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </div>
  );
}
