"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  isValidElement,
  Fragment,
  type SelectHTMLAttributes,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOptionItem {
  value: string;
  label: string;
  disabled?: boolean;
}

function isLazyNode(
  val: unknown,
): val is { _init: (payload: unknown) => unknown; _payload: unknown } {
  return (
    typeof val === "object" &&
    val !== null &&
    "_init" in val &&
    typeof (val as Record<string, unknown>)._init === "function" &&
    "_payload" in val
  );
}

function resolveNode(node: ReactNode): ReactNode {
  let curr: unknown = node;
  while (isLazyNode(curr)) {
    try {
      curr = curr._init(curr._payload);
    } catch {
      break;
    }
  }
  return curr as ReactNode;
}

function extractOptions(children: ReactNode): SelectOptionItem[] {
  const items: SelectOptionItem[] = [];

  function walk(rawNode: ReactNode) {
    const node = resolveNode(rawNode);
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (isValidElement(node)) {
      if (node.type === Fragment && (node.props as { children?: ReactNode })?.children) {
        walk((node.props as { children?: ReactNode }).children);
        return;
      }
      if (node.type === "option") {
        const p = node.props as {
          value?: string | number;
          children?: ReactNode;
          disabled?: boolean;
        };
        const value = p.value !== undefined ? String(p.value) : "";
        let label = "";
        const children = resolveNode(p.children);
        if (typeof children === "string" || typeof children === "number") {
          label = String(children);
        } else if (Array.isArray(children)) {
          label = children
            .map((c) => {
              const resC = resolveNode(c);
              return typeof resC === "string" || typeof resC === "number" ? resC : "";
            })
            .join("");
        } else if (children) {
          label = String(children);
        } else {
          label = value;
        }
        items.push({
          value,
          label: label || value,
          disabled: Boolean(p.disabled),
        });
        return;
      }
      if ((node.props as { children?: ReactNode })?.children) {
        walk((node.props as { children?: ReactNode }).children);
      }
    }
  }

  walk(children);
  return items;
}

export interface CustomSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  searchPlaceholder?: string;
  showSearch?: boolean;
}

export function Select({
  className,
  children,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  name,
  id,
  searchPlaceholder: customSearchPlaceholder,
  showSearch: customShowSearch,
  ...props
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerWidth, setTriggerWidth] = useState<number | null>(null);
  const [alignRight, setAlignRight] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hiddenSelectRef = useRef<HTMLSelectElement>(null);

  const options = useMemo(() => extractOptions(children), [children]);

  // Track value (controlled vs uncontrolled)
  const isControlled = value !== undefined;
  const [internalVal, setInternalVal] = useState<string>(() => {
    if (value !== undefined) return String(value);
    if (defaultValue !== undefined) return String(defaultValue);
    return options[0]?.value ?? "";
  });
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);
  if (!isControlled && prevDefaultValue !== defaultValue) {
    setPrevDefaultValue(defaultValue);
    setInternalVal(defaultValue !== undefined ? String(defaultValue) : (options[0]?.value ?? ""));
  }

  const currentVal = isControlled ? String(value) : internalVal;

  // Selected option resolution
  const selectedOption = useMemo(() => {
    return options.find((o) => o.value === currentVal) ?? options[0];
  }, [options, currentVal]);

  const displayLabel = selectedOption?.label ?? "";

  // Auto-detect search placeholder from first option (e.g. "Semua creator" -> "Cari creator...")
  const autoSearchPlaceholder = useMemo(() => {
    if (customSearchPlaceholder) return customSearchPlaceholder;
    const firstLabel = options[0]?.label?.trim() ?? "";
    if (/^semua\s+/i.test(firstLabel)) {
      const noun = firstLabel.replace(/^semua\s+/i, "").toLowerCase();
      return `Cari ${noun}...`;
    }
    if (/^pilih\s+/i.test(firstLabel)) {
      const noun = firstLabel.replace(/^pilih\s+/i, "").replace(/[….]+$/, "").toLowerCase();
      return `Cari ${noun}...`;
    }
    return "Cari...";
  }, [options, customSearchPlaceholder]);

  // Show search box when 4 or more options, unless explicitly overridden
  const showSearch = customShowSearch !== undefined ? customShowSearch : options.length >= 4;

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, searchQuery]);

  // Measure trigger width and screen boundary on open
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTriggerWidth(rect.width);
      if (window.innerWidth - rect.left < 280 && rect.right > 280) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    }
  }, [open]);

  // Auto-focus search input when opening
  useEffect(() => {
    if (open && showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open, showSearch]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearchQuery("");
      }
    };
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearchQuery("");
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // Sync with form resets
  useEffect(() => {
    const selectEl = hiddenSelectRef.current;
    const formEl = selectEl?.form;
    if (!formEl) return;
    const handleReset = () => {
      setTimeout(() => {
        if (selectEl) {
          setInternalVal(selectEl.value);
        }
      }, 0);
    };
    formEl.addEventListener("reset", handleReset);
    return () => formEl.removeEventListener("reset", handleReset);
  }, []);

  const handleSelect = (option: SelectOptionItem) => {
    if (option.disabled) return;
    if (!isControlled) {
      setInternalVal(option.value);
    }
    setOpen(false);
    setSearchQuery("");

    if (hiddenSelectRef.current) {
      hiddenSelectRef.current.value = option.value;
      const nativeEvent = new Event("change", { bubbles: true });
      hiddenSelectRef.current.dispatchEvent(nativeEvent);

      if (onChange) {
        const syntheticEvent = {
          ...nativeEvent,
          target: hiddenSelectRef.current,
          currentTarget: hiddenSelectRef.current,
          preventDefault: () => nativeEvent.preventDefault(),
          stopPropagation: () => nativeEvent.stopPropagation(),
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    }
  };

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      {/* Hidden native select for standard HTML form serialization & accessibility */}
      <select
        ref={hiddenSelectRef}
        name={name}
        id={id}
        value={currentVal}
        onChange={(e) => {
          setInternalVal(e.target.value);
          onChange?.(e);
        }}
        disabled={disabled}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only pointer-events-none absolute -bottom-px left-0 h-px w-px opacity-0"
        {...props}
      >
        {children}
      </select>

      {/* Custom Trigger Button matching target design */}
      <button
        ref={triggerRef}
        type="button"
        id={id ? `${id}-trigger` : undefined}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-[10px] border border-[#373737] bg-[#171717] px-3 py-1.5 text-xs text-[#FAFAFA] transition-all duration-150 hover:border-[#525252] hover:bg-[#262626] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#525252] focus-visible:border-[#525252] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer select-none",
          open && "border-[#525252] ring-1 ring-[#525252]",
        )}
      >
        <span className="truncate text-left font-normal text-[#FAFAFA]">{displayLabel || "\u00A0"}</span>
        <ChevronDown
          className={cn(
            "ml-2 size-3.5 shrink-0 text-[#A3A3A3] transition-transform duration-200",
            open && "rotate-180 text-[#FAFAFA]",
          )}
        />
      </button>

      {/* Custom Dropdown Menu with Thin Divider Lines matching Apple dark mode */}
      {open ? (
        <div
          role="listbox"
          className={cn(
            "absolute top-[calc(100%+6px)] z-50 min-w-full w-max max-w-[min(calc(100vw-2rem),24rem)] rounded-[12px] border border-[#373737] bg-[#171717] p-2 shadow-xl shadow-black/50 animate-in fade-in-0 zoom-in-95 duration-100",
            alignRight ? "right-0" : "left-0",
          )}
          style={{ minWidth: triggerWidth ? `${triggerWidth}px` : undefined }}
        >
          {/* Search Bar at the top of the menu */}
          {showSearch ? (
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#A3A3A3]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={autoSearchPlaceholder}
                className="h-9 w-full rounded-[8px] border border-[#373737] bg-[#0A0A0A] pl-8 pr-3 text-xs text-[#FAFAFA] placeholder:text-[#A3A3A3] outline-none transition-colors focus:border-[#525252] focus:ring-1 focus:ring-[#525252]"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setOpen(false);
                  }
                }}
              />
            </div>
          ) : null}

          {/* Options List with thin divider lines ("Garis tipis antar item") and dark visible scrollbar */}
          <div className="dropdown-options-scroll max-h-64 overflow-y-auto overscroll-contain divide-y divide-[#262626] rounded-[8px] pr-0.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-[#A3A3A3]">
                Tidak ada hasil
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === currentVal;
                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2.5 text-left text-xs transition-colors duration-150 cursor-pointer select-none",
                      isSelected
                        ? "bg-[#262626] text-[#FAFAFA] font-medium"
                        : "text-[#E5E5E5] hover:bg-[#373737] hover:text-[#FAFAFA]",
                      opt.disabled &&
                        "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-[#737373]",
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected ? (
                      <Check className="ml-2 size-4 shrink-0 text-[#FAFAFA] stroke-[2.5]" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
