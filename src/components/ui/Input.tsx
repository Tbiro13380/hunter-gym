type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
}

export default function Input({ label, error, hint, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="sys-label text-[#958da1]">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`bg-[#1b1b20] border ${
          error ? 'border-[#ef4444]' : 'border-[#4a4455]'
        } px-3 py-2.5 text-[#e4e1e9] placeholder-[#4a4455] text-sm focus:outline-none focus:border-[#7c3aed] transition-colors font-mono-timer ${className}`}
      />
      {error && <p className="sys-label text-[#ef4444]">{error}</p>}
      {hint && !error && <p className="sys-label text-[#958da1]">{hint}</p>}
    </div>
  )
}
