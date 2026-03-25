import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'

import { useWorkoutStore } from '../store/workoutStore'
import type { WorkoutTemplate, TemplateExercise } from '../lib/types'
import TemplateCard from '../components/workout/TemplateCard'
import SortableExerciseItem from '../components/workout/SortableExerciseItem'
import ExerciseFormModal from '../components/workout/ExerciseFormModal'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const LABELS = ['A', 'B', 'C', 'D']

type TemplateFormState = {
  label: string
  name: string
}

export default function WorkoutSetup() {
  const navigate = useNavigate()
  const { templates, addTemplate, updateTemplate, deleteTemplate, reorderExercises, startSession } =
    useWorkoutStore()

  // Template CRUD modal state
  const [templateModal, setTemplateModal] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    template: WorkoutTemplate | null
  }>({ open: false, mode: 'create', template: null })

  // Exercise edit state — which template is being edited
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null)

  // Exercise form modal
  const [exerciseModal, setExerciseModal] = useState<{
    open: boolean
    exercise: TemplateExercise | null
  }>({ open: false, exercise: null })

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Template form state
  const [templateForm, setTemplateForm] = useState<TemplateFormState>({ label: 'A', name: '' })
  const [templateFormError, setTemplateFormError] = useState('')

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  // ── Template modal helpers ──────────────────────────────────────────────

  function openCreateTemplate() {
    setTemplateForm({ label: getNextLabel(), name: '' })
    setTemplateFormError('')
    setTemplateModal({ open: true, mode: 'create', template: null })
  }

  function openEditTemplate(template: WorkoutTemplate) {
    setTemplateForm({ label: template.label, name: template.name })
    setTemplateFormError('')
    setTemplateModal({ open: true, mode: 'edit', template })
  }

  function getNextLabel(): string {
    const used = templates.map((t) => t.label)
    return LABELS.find((l) => !used.includes(l)) ?? 'A'
  }

  function handleSaveTemplate() {
    if (!templateForm.name.trim()) {
      setTemplateFormError('Nome do treino obrigatório')
      return
    }
    if (templateModal.mode === 'create') {
      addTemplate({
        id: crypto.randomUUID(),
        label: templateForm.label,
        name: templateForm.name.trim(),
        exercises: [],
      })
    } else if (templateModal.template) {
      updateTemplate(templateModal.template.id, {
        ...templateModal.template,
        label: templateForm.label,
        name: templateForm.name.trim(),
      })
      // Keep editing view in sync
      if (editingTemplate?.id === templateModal.template.id) {
        setEditingTemplate((prev) =>
          prev ? { ...prev, label: templateForm.label, name: templateForm.name.trim() } : prev
        )
      }
    }
    setTemplateModal({ open: false, mode: 'create', template: null })
  }

  // ── Exercise helpers ──────────────────────────────────────────────────

  function handleSaveExercise(exercise: TemplateExercise) {
    if (!editingTemplate) return
    const isEdit = editingTemplate.exercises.some((e) => e.id === exercise.id)
    const newExercises = isEdit
      ? editingTemplate.exercises.map((e) => (e.id === exercise.id ? exercise : e))
      : [...editingTemplate.exercises, exercise]

    updateTemplate(editingTemplate.id, { ...editingTemplate, exercises: newExercises })
    setEditingTemplate({ ...editingTemplate, exercises: newExercises })
  }

  function handleDeleteExercise(exerciseId: string) {
    if (!editingTemplate) return
    const newExercises = editingTemplate.exercises.filter((e) => e.id !== exerciseId)
    updateTemplate(editingTemplate.id, { ...editingTemplate, exercises: newExercises })
    setEditingTemplate({ ...editingTemplate, exercises: newExercises })
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!editingTemplate) return
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = editingTemplate.exercises.findIndex((e) => e.id === active.id)
    const newIndex = editingTemplate.exercises.findIndex((e) => e.id === over.id)
    const reordered = arrayMove(editingTemplate.exercises, oldIndex, newIndex)

    reorderExercises(editingTemplate.id, reordered)
    setEditingTemplate({ ...editingTemplate, exercises: reordered })
  }

  // ── Start workout ─────────────────────────────────────────────────────

  function handleStart(template: WorkoutTemplate) {
    if (template.exercises.length === 0) return
    startSession(template)
    navigate('/treino/ativo')
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (editingTemplate) {
    return (
      <ExerciseListView
        template={editingTemplate}
        onBack={() => setEditingTemplate(null)}
        onAddExercise={() => setExerciseModal({ open: true, exercise: null })}
        onEditExercise={(ex) => setExerciseModal({ open: true, exercise: ex })}
        onDeleteExercise={handleDeleteExercise}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        onEditTemplate={() => openEditTemplate(editingTemplate)}
        onStartWorkout={() => handleStart(editingTemplate)}
        exerciseModal={exerciseModal}
        onCloseExerciseModal={() => setExerciseModal({ open: false, exercise: null })}
        onSaveExercise={handleSaveExercise}
      />
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-display text-2xl font-bold text-white tracking-wide">Meu Split</h1>
        <p className="text-[#64748b] text-sm mt-1">Configure seus dias de treino</p>
      </div>

      {/* Template list */}
      <div className="px-4 flex flex-col gap-4 flex-1">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1a1a26] flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-[#64748b]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-[#64748b] text-sm">Nenhum treino cadastrado</p>
            <p className="text-[#2a2a3a] text-xs mt-1">Crie o seu primeiro split</p>
          </div>
        ) : (
          templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => setEditingTemplate(template)}
              onDelete={() => setDeleteConfirm(template.id)}
              onStart={() => handleStart(template)}
            />
          ))
        )}

        {/* Add template button */}
        {templates.length < 8 && (
          <button
            onClick={openCreateTemplate}
            className="flex items-center justify-center gap-2 border border-dashed border-[#2a2a3a] hover:border-[#7c3aed]/50 rounded-2xl py-4 text-[#64748b] hover:text-[#a855f7] transition-all duration-200 group"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">Novo Treino</span>
          </button>
        )}
      </div>

      {/* Template create/edit modal */}
      <TemplateFormModal
        open={templateModal.open}
        mode={templateModal.mode}
        form={templateForm}
        error={templateFormError}
        onChange={(f) => { setTemplateForm(f); setTemplateFormError('') }}
        onClose={() => setTemplateModal({ open: false, mode: 'create', template: null })}
        onSave={handleSaveTemplate}
      />

      {/* Delete confirm modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Excluir Treino" size="sm">
        <p className="text-[#64748b] text-sm mb-5">
          Tem certeza que deseja excluir este treino? Essa ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setDeleteConfirm(null)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              if (deleteConfirm) deleteTemplate(deleteConfirm)
              setDeleteConfirm(null)
            }}
          >
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

type ExerciseListViewProps = {
  template: WorkoutTemplate
  onBack: () => void
  onAddExercise: () => void
  onEditExercise: (ex: TemplateExercise) => void
  onDeleteExercise: (id: string) => void
  onDragEnd: (event: DragEndEvent) => void
  sensors: ReturnType<typeof useSensors>
  onEditTemplate: () => void
  onStartWorkout: () => void
  exerciseModal: { open: boolean; exercise: TemplateExercise | null }
  onCloseExerciseModal: () => void
  onSaveExercise: (ex: TemplateExercise) => void
}

function ExerciseListView({
  template,
  onBack,
  onAddExercise,
  onEditExercise,
  onDeleteExercise,
  onDragEnd,
  sensors,
  onEditTemplate,
  onStartWorkout,
  exerciseModal,
  onCloseExerciseModal,
  onSaveExercise,
}: ExerciseListViewProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-[#1a1a26] text-[#64748b] hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-[#a855f7] text-lg">{template.label}</span>
            <h1 className="font-semibold text-white text-lg">{template.name}</h1>
          </div>
          <p className="text-[#64748b] text-xs">{template.exercises.length} exercícios</p>
        </div>
        <button
          onClick={onEditTemplate}
          className="p-2 rounded-xl bg-[#1a1a26] text-[#64748b] hover:text-[#a855f7] transition-colors"
          aria-label="Editar nome"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {/* DnD exercise list */}
      <div className="flex-1 px-4 pb-4">
        {template.exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-[#64748b] text-sm">Nenhum exercício ainda</p>
            <p className="text-[#2a2a3a] text-xs mt-1">Adicione o primeiro exercício</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={template.exercises.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {template.exercises.map((ex) => (
                  <SortableExerciseItem
                    key={ex.id}
                    exercise={ex}
                    onEdit={() => onEditExercise(ex)}
                    onDelete={() => onDeleteExercise(ex.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Add exercise */}
        <button
          onClick={onAddExercise}
          className="mt-3 flex items-center justify-center gap-2 w-full border border-dashed border-[#2a2a3a] hover:border-[#7c3aed]/50 rounded-xl py-3 text-[#64748b] hover:text-[#a855f7] transition-all duration-200"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">Adicionar Exercício</span>
        </button>
      </div>

      {/* Start workout sticky footer */}
      {template.exercises.length > 0 && (
        <div className="px-4 pb-6 pt-2 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent">
          <button
            onClick={onStartWorkout}
            className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold py-4 rounded-xl transition-all duration-200 font-display tracking-wider hover:shadow-[0_0_24px_rgba(124,58,237,0.5)] active:scale-95 flex items-center justify-center gap-2 text-base"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M8 5v14l11-7z" />
            </svg>
            INICIAR TREINO {template.label}
          </button>
        </div>
      )}

      {/* Exercise form modal */}
      <ExerciseFormModal
        open={exerciseModal.open}
        onClose={onCloseExerciseModal}
        onSave={onSaveExercise}
        initial={exerciseModal.exercise}
        key={exerciseModal.exercise?.id ?? 'new'}
      />
    </div>
  )
}

// ── Template form modal ───────────────────────────────────────────────────────

type TemplateFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  form: TemplateFormState
  error: string
  onChange: (form: TemplateFormState) => void
  onClose: () => void
  onSave: () => void
}

function TemplateFormModal({ open, mode, form, error, onChange, onClose, onSave }: TemplateFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={mode === 'create' ? 'Novo Treino' : 'Editar Treino'} size="sm">
      <div className="flex flex-col gap-4">
        {/* Label picker */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Label</label>
          <div className="flex gap-2">
            {LABELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onChange({ ...form, label: l })}
                className={`w-10 h-10 rounded-xl font-display font-bold text-base border transition-all ${
                  form.label === l
                    ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-[#a855f7]'
                    : 'bg-[#1a1a26] border-[#2a2a3a] text-[#64748b] hover:border-[#64748b]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <Input
          label="Nome do treino"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="Ex: Push, Pull, Legs, Upper..."
          error={error}
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') onSave() }}
        />

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button variant="primary" fullWidth onClick={onSave}>
            {mode === 'create' ? 'Criar' : 'Salvar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
