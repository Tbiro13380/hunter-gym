type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
}

export default function Input({ label, error, hint, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`bg-[#1a1a26] border ${error ? 'border-[#ef4444]' : 'border-[#2a2a3a]'} rounded-xl px-3 py-2.5 text-white placeholder-[#64748b] text-sm focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-colors ${className}`}
      />
      {error && <p className="text-[#ef4444] text-xs">{error}</p>}
      {hint && !error && <p className="text-[#64748b] text-xs">{hint}</p>}
    </div>
  )
}
