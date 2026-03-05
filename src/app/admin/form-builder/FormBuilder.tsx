'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  createFormField,
  updateFormField,
  toggleFormField,
  reorderFormFields,
} from '@/actions/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GripVertical, Plus, Pencil, Loader2 } from 'lucide-react'
import type { FormField } from '@/lib/types'

const FIELD_TYPES = [
  { value: 'text', label: 'טקסט' },
  { value: 'textarea', label: 'טקסט ארוך' },
  { value: 'url', label: 'כתובת URL' },
  { value: 'email', label: 'אימייל' },
  { value: 'date', label: 'תאריך' },
  { value: 'image', label: 'תמונה' },
  { value: 'select', label: 'רשימה נפתחת' },
] as const

interface FormBuilderProps {
  initialFields: FormField[]
}

function SortableFieldRow({
  field,
  onEdit,
  onToggleActive,
  isToggling,
}: {
  field: FormField
  onEdit: (field: FormField) => void
  onToggleActive: (id: string, current: boolean) => void
  isToggling: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-2">
        <CardContent className="flex items-center gap-3 py-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab text-muted-foreground hover:text-foreground"
            type="button"
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm">{field.field_label_he}</span>
            <span className="text-xs text-muted-foreground ms-2">({field.field_key})</span>
          </div>

          <Badge variant="secondary">{field.field_type}</Badge>

          {field.is_required && (
            <Badge variant="destructive" className="text-xs">חובה</Badge>
          )}

          <Button
            variant={field.is_active ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => onToggleActive(field.id, field.is_active)}
            disabled={isToggling}
            className="text-xs"
          >
            {field.is_active ? 'פעיל' : 'מושבת'}
          </Button>

          <Button variant="ghost" size="icon" onClick={() => onEdit(field)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function FormBuilder({ initialFields }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialFields)
  const [showModal, setShowModal] = useState(false)
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal form state
  const [formLabelHe, setFormLabelHe] = useState('')
  const [formLabelEn, setFormLabelEn] = useState('')
  const [formKey, setFormKey] = useState('')
  const [formType, setFormType] = useState('text')
  const [formRequired, setFormRequired] = useState(false)
  const [formPlaceholder, setFormPlaceholder] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function openAddModal() {
    setEditingField(null)
    setFormLabelHe('')
    setFormLabelEn('')
    setFormKey('')
    setFormType('text')
    setFormRequired(false)
    setFormPlaceholder('')
    setShowModal(true)
  }

  function openEditModal(field: FormField) {
    setEditingField(field)
    setFormLabelHe(field.field_label_he)
    setFormLabelEn(field.field_label_en)
    setFormKey(field.field_key)
    setFormType(field.field_type)
    setFormRequired(field.is_required)
    setFormPlaceholder(field.placeholder_he ?? '')
    setShowModal(true)
  }

  async function handleSave() {
    if (!formLabelHe || !formLabelEn || !formKey) {
      setError('יש למלא את כל השדות הנדרשים')
      return
    }

    setIsSaving(true)
    setError(null)

    if (editingField) {
      const result = await updateFormField(editingField.id, {
        field_label_he: formLabelHe,
        field_label_en: formLabelEn,
        field_type: formType,
        is_required: formRequired,
        placeholder_he: formPlaceholder || undefined,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setFields((prev) =>
          prev.map((f) =>
            f.id === editingField.id
              ? { ...f, field_label_he: formLabelHe, field_label_en: formLabelEn, field_type: formType, is_required: formRequired, placeholder_he: formPlaceholder || null }
              : f
          )
        )
        setShowModal(false)
      }
    } else {
      const result = await createFormField({
        form_name: 'fansub_registration',
        field_key: formKey,
        field_label_he: formLabelHe,
        field_label_en: formLabelEn,
        field_type: formType,
        is_required: formRequired,
        placeholder_he: formPlaceholder || undefined,
      })
      if (result.error) {
        setError(result.error)
      } else {
        // Reload to get new field with ID
        window.location.reload()
      }
    }
    setIsSaving(false)
  }

  async function handleToggleActive(id: string, current: boolean) {
    setIsToggling(true)
    await toggleFormField(id, current)
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, is_active: !current } : f))
    )
    setIsToggling(false)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = fields.findIndex((f) => f.id === active.id)
    const newIndex = fields.findIndex((f) => f.id === over.id)

    const newOrder = arrayMove(fields, oldIndex, newIndex)
    setFields(newOrder)

    await reorderFormFields(newOrder.map((f) => f.id))
  }

  // Auto-generate key from Hebrew label
  function handleLabelHeChange(value: string) {
    setFormLabelHe(value)
    if (!editingField) {
      setFormKey(
        value
          .replace(/[^a-zA-Z0-9\u0590-\u05FF\s]/g, '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[\u0590-\u05FF]/g, '')
          || ''
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">שדות הטופס</h2>
        <Button onClick={openAddModal} size="sm">
          <Plus className="h-4 w-4 me-1" />
          הוסף שדה
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          {fields.map((field) => (
            <SortableFieldRow
              key={field.id}
              field={field}
              onEdit={openEditModal}
              onToggleActive={handleToggleActive}
              isToggling={isToggling}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="py-6 space-y-4">
              <h3 className="text-lg font-bold">
                {editingField ? 'עריכת שדה' : 'הוספת שדה חדש'}
              </h3>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">תווית בעברית</label>
                <Input
                  value={formLabelHe}
                  onChange={(e) => handleLabelHeChange(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">תווית באנגלית</label>
                <Input
                  value={formLabelEn}
                  onChange={(e) => setFormLabelEn(e.target.value)}
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">מפתח (key)</label>
                <Input
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  dir="ltr"
                  disabled={!!editingField}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">סוג שדה</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">placeholder</label>
                <Input
                  value={formPlaceholder}
                  onChange={(e) => setFormPlaceholder(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formRequired}
                  onChange={(e) => setFormRequired(e.target.checked)}
                  className="rounded"
                />
                שדה חובה
              </label>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                  {isSaving && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
                  {editingField ? 'עדכן' : 'הוסף'}
                </Button>
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  ביטול
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
