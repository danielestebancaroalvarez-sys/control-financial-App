export function FormField({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="text-[12px] font-bold text-cc-primary">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-[10px] text-cc-secondary leading-snug">{hint}</p>}
      {children}
    </div>
  )
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3 pt-1">
      <div>
        <h3 className="text-[13px] font-bold text-cc-primary">{title}</h3>
        {description && (
          <p className="text-[10px] text-cc-secondary mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}
