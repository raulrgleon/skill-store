export function Toast({ message }: { message: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-70 flex justify-center px-4" role="status" aria-live="polite">
      <p className="rounded-[12px] border border-line bg-surface px-4 py-2.5 text-[14px] shadow-soft">{message}</p>
    </div>
  )
}
