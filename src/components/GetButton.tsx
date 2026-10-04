import type { MouseEvent } from 'react'

type GetButtonProps = {
  price: string
  status: 'idle' | 'busy' | 'installed'
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}

export function GetButton({ price, status, onClick }: GetButtonProps) {
  const label = status === 'installed' ? 'Abierta' : price === 'Gratis' || price === 'Privada' ? 'Obtener' : price

  return (
    <button
      type="button"
      className={`get-btn ${status === 'installed' ? 'is-installed' : ''} ${status === 'busy' ? 'is-busy' : ''}`}
      onClick={onClick}
      aria-label={label}
    >
      {status === 'busy' ? '' : label}
    </button>
  )
}
