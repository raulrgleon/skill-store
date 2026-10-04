type ToastProps = {
  message: string
}

export function Toast({ message }: ToastProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-70 mx-auto w-fit max-w-[90vw] border border-line bg-card px-4 py-2 text-[14px] text-ink md:bottom-6">
      {message}
    </div>
  )
}
