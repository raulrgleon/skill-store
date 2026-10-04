import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
}

export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition-[background-color,border-color,opacity] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-45',
        size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-10 px-3.5 text-[14px]',
        variant === 'primary' && 'bg-accent text-accent-ink hover:brightness-110',
        variant === 'secondary' && 'border border-line bg-surface text-ink hover:bg-surface-2',
        variant === 'ghost' && 'text-ink hover:bg-surface-2',
        className,
      )}
      {...props}
    />
  )
}
