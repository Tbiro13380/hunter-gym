import { useState } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import type { TemplateExercise } from '../../lib/types'

const MUSCLE_GROUPS = [
  'Peito', 'Costas', 'Ombro', 'Bíceps', 'Tríceps',
  'Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha',
  'Abdômen', 'Trapézio', 'Core',
]

type ExerciseFormModalProps = {
  open: boolean
  onClose: () => void
  onSave: (exercise: TemplateExercise) => void
  initial?: TemplateExercise | null
}

type FormState = {
  name: string
  muscleGroup: string
  minReps: string
  maxReps: string
  restSeconds: string
  defaultSets: string
}

const EMPTY_FORM: FormState = {
  name: '',
  muscleGroup: 'Peito',
  minReps: '8',
  maxReps: '12',
  restSeconds: '90',
  defaultSets: '3',
}

export default function ExerciseFormModal({ open, onClose, onSave, initial }: ExerciseFormModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          name: initial.name,
          muscleGroup: initial.muscleGroup,
          minReps: String(initial.minReps),
          maxReps: String(initial.maxReps),
          restSeconds: String(initial.restSeconds),
          defaultSets: String(initial.defaultSets),
        }
      : EMPTY_FORM
  )
  const [errors, setErrors] = useState<Partial<FormState>>({})

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function validate(): boolean {
    const errs: Partial<FormState> = {}
    if (!form.name.trim()) errs.name = 'Nome obrigatório'
    if (!form.muscleGroup) errs.muscleGroup = 'Grupo muscular obrigatório'
    const min = parseInt(form.minReps)
    const max = parseInt(form.maxReps)
    if (isNaN(min) || min < 1) errs.minReps = 'Mín inválido'
    if (isNaN(max) || max < min) errs.maxReps = 'Máx deve ser ≥ mín'
    const rest = parseInt(form.restSeconds)
    if (isNaN(rest) || rest < 10) errs.restSeconds = 'Descanso mínimo 10s'
    const sets = parseInt(form.defaultSets)
    if (isNaN(sets) || sets < 1 || sets > 10) errs.defaultSets = 'Entre 1 e 10 séries'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSave() {
    if (!validate()) return
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      muscleGroup: form.muscleGroup,
      minReps: parseInt(form.minReps),
      maxReps: parseInt(form.maxReps),
      restSeconds: parseInt(form.restSeconds),
      defaultSets: parseInt(form.defaultSets),
    })
    setForm(EMPTY_FORM)
    onClose()
  }

  // Reset form when opening fresh (no initial)
  function handleOpen() {
    if (!initial) setForm(EMPTY_FORM)
    setErrors({})
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Editar Exercício' : 'Novo Exercício'}
      size="md"
    >
      <div className="flex flex-col gap-4" onFocus={handleOpen}>
        {/* Name */}
        <Input
          label="Nome do exercício"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Ex: Supino Reto"
          error={errors.name}
          autoFocus
        />

        {/* Muscle Group */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
            Grupo Muscular
          </label>
          <div className="flex flex-wrap gap-2">
            {MUSCLE_GROUPS.map((mg) => (
              <button
                key={mg}
                type="button"
                onClick={() => set('muscleGroup', mg)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                  form.muscleGroup === mg
                    ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-[#a855f7]'
                    : 'bg-[#1a1a26] border-[#2a2a3a] text-[#64748b] hover:border-[#64748b]'
                }`}
              >
                {mg}
              </button>
            ))}
          </div>
          {errors.muscleGroup && <p className="text-[#ef4444] text-xs">{errors.muscleGroup}</p>}
        </div>

        {/* Reps range */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Reps mínimas"
            type="number"
            min={1}
            max={50}
            value={form.minReps}
            onChange={(e) => set('minReps', e.target.value)}
            error={errors.minReps}
          />
          <Input
            label="Reps máximas"
            type="number"
            min={1}
            max={50}
            value={form.maxReps}
            onChange={(e) => set('maxReps', e.target.value)}
            error={errors.maxReps}
          />
        </div>

        {/* Rest + Sets */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Descanso (seg)"
            type="number"
            min={10}
            max={600}
            value={form.restSeconds}
            onChange={(e) => set('restSeconds', e.target.value)}
            hint="Segundos entre séries"
            error={errors.restSeconds}
          />
          <Input
            label="Séries padrão"
            type="number"
            min={1}
            max={10}
            value={form.defaultSets}
            onChange={(e) => set('defaultSets', e.target.value)}
            error={errors.defaultSets}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" fullWidth onClick={handleSave}>
            {initial ? 'Salvar' : 'Adicionar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
