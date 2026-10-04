type ToastProps = {
  message: string
}

export function Toast({ message }: ToastProps) {
  return (
    <div className="frost pointer-events-none fixed inset-x-0 top-16 z-70 mx-auto w-fit max-w-[90vw] rounded-full px-4 py-2 text-[13px] font-semibold rise">
      {message}
    </div>
  )
}
