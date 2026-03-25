import { useState } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import type { Dungeon } from '../../lib/types'

type CreateDungeonModalProps = {
  open: boolean
  onClose: () => void
  onSave: (dungeon: Dungeon) => void
  createdBy: string
  creatorName: string
}

const DIFFICULTIES = [1, 2, 3, 4, 5] as const
const DIFFICULTY_LABELS = { 1: 'Fácil', 2: 'Normal', 3: 'Difícil', 4: 'Épico', 5: 'Lendário' }
const DIFFICULTY_COLORS = {
  1: 'text-[#22c55e] border-[#22c55e]/40 bg-[#22c55e]/10',
  2: 'text-[#06b6d4] border-[#06b6d4]/40 bg-[#06b6d4]/10',
  3: 'text-[#f59e0b] border-[#f59e0b]/40 bg-[#f59e0b]/10',
  4: 'text-[#ef4444] border-[#ef4444]/40 bg-[#ef4444]/10',
  5: 'text-[#a855f7] border-[#a855f7]/40 bg-[#a855f7]/10',
}

type FormState = {
  name: string
  description: string
  objective: string
  difficulty: 1 | 2 | 3 | 4 | 5
  titleReward: string
  xpReward: string
  deadlineDays: string
}

const INITIAL: FormState = {
  name: '',
  description: '',
  objective: '',
  difficulty: 3,
  titleReward: '',
  xpReward: '300',
  deadlineDays: '7',
}

export default function CreateDungeonModal({
  open,
  onClose,
  onSave,
  createdBy,
  creatorName,
}: CreateDungeonModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) errs.name = 'Nome obrigatório'
    if (!form.objective.trim()) errs.objective = 'Objetivo obrigatório'
    if (!form.titleReward.trim()) errs.titleReward = 'Título de recompensa obrigatório'
    const xp = parseInt(form.xpReward)
    if (isNaN(xp) || xp < 50) errs.xpReward = 'XP mínimo: 50'
    const days = parseInt(form.deadlineDays)
    if (isNaN(days) || days < 1 || days > 90) errs.deadlineDays = 'Entre 1 e 90 dias'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + parseInt(form.deadlineDays))

    const dungeon: Dungeon = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      description: form.description.trim(),
      difficulty: form.difficulty,
      objective: form.objective.trim(),
      titleReward: form.titleReward.trim(),
      xpReward: parseInt(form.xpReward),
      deadlineAt: deadline.toISOString(),
      createdBy,
      participants: [{ userId: createdBy, userName: creatorName, completed: false }],
    }

    onSave(dungeon)
    setForm(INITIAL)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Criar Dungeon" size="md">
      <div className="flex flex-col gap-4">
        <Input
          label="Nome da dungeon"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Ex: Desafio das 100 Repetições"
          error={errors.name}
          autoFocus
        />

        <Input
          label="Descrição (opcional)"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Descrição da dungeon..."
        />

        <Input
          label="Objetivo"
          value={form.objective}
          onChange={(e) => set('objective', e.target.value)}
          placeholder="Ex: Complete 5 treinos em 7 dias"
          error={errors.objective}
          hint="Descreva o que é preciso fazer para concluir"
        />

        {/* Difficulty */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
            Dificuldade
          </label>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => set('difficulty', d)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all font-display ${
                  form.difficulty === d
                    ? DIFFICULTY_COLORS[d]
                    : 'bg-[#1a1a26] border-[#2a2a3a] text-[#64748b] hover:border-[#64748b]'
                }`}
              >
                ★{d}
                <span className="block text-[9px] font-body font-normal opacity-70 mt-0.5">
                  {DIFFICULTY_LABELS[d]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Título de recompensa"
            value={form.titleReward}
            onChange={(e) => set('titleReward', e.target.value)}
            placeholder="Ex: Dungeon Clearer"
            error={errors.titleReward}
          />
          <Input
            label="XP de recompensa"
            type="number"
            min={50}
            max={5000}
            value={form.xpReward}
            onChange={(e) => set('xpReward', e.target.value)}
            error={errors.xpReward}
          />
        </div>

        <Input
          label="Prazo (dias)"
          type="number"
          min={1}
          max={90}
          value={form.deadlineDays}
          onChange={(e) => set('deadlineDays', e.target.value)}
          hint={`Expira em ${form.deadlineDays} dia(s) a partir de hoje`}
          error={errors.deadlineDays}
        />

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button variant="primary" fullWidth onClick={handleSave}>Criar Dungeon</Button>
        </div>
      </div>
    </Modal>
  )
}
