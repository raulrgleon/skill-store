import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

const field =
  'w-full rounded-[10px] border border-line bg-surface px-3 text-[14px] text-ink outline-none placeholder:text-mute focus-visible:border-accent'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, 'h-10', className)} {...props} />
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(field, 'min-h-28 py-2.5 leading-relaxed', className)} {...props} />
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[13px] text-mute">{hint}</span> : null}
    </label>
  )
}
