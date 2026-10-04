import { BadgeCheck } from 'lucide-react'
import { SkillCard } from '../components/SkillCard'
import { skills } from '../data/skills'
import { useRouter } from '../lib/router'
import { Button } from '../ui/Button'

export function AuthorPage({ author }: { author: string }) {
  const { navigate } = useRouter()
  const owned = skills.filter((skill) => skill.author === author)
  const verified = owned.length > 0 && owned.every((skill) => skill.verified)

  if (owned.length === 0) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-16">
        <h1 className="text-[32px] font-medium tracking-tight">No hay skills de ese autor</h1>
        <Button className="mt-6" variant="secondary" onClick={() => navigate('/explorar')}>
          Volver a explorar
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10">
      <p className="text-[14px] text-mute">Autor</p>
      <div className="mt-2 flex items-center gap-2">
        <h1 className="text-[40px] font-medium tracking-tight">{author}</h1>
        {verified ? <BadgeCheck className="text-accent" aria-label="Verificado" /> : null}
      </div>
      <p className="mt-2 text-[15px] text-mute">
        {owned.length} {owned.length === 1 ? 'skill' : 'skills'} en el catálogo.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {owned.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
    </div>
  )
}
