export const inputClassName =
  "w-full rounded-[var(--radius-control)] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow,background-color] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-0";

export const textAreaClassName =
  `${inputClassName} min-h-32 resize-y`;

export const selectClassName =
  `${inputClassName} appearance-none bg-[linear-gradient(45deg,transparent_50%,#64748b_50%),linear-gradient(135deg,#64748b_50%,transparent_50%)] bg-[position:calc(100%-20px)_calc(50%-2px),calc(100%-14px)_calc(50%-2px)] bg-[size:6px_6px,6px_6px] bg-no-repeat pr-10`;
