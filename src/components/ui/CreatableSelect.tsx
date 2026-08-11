import { useState } from 'react'

interface CreatableSelectProps {
  label: string
  value: string
  options: { id: string; name: string }[]
  onChange: (name: string) => void
  onCreate: (name: string) => Promise<{ id: string; name: string }>
  required?: boolean
}

export function CreatableSelect({ label, value, options, onChange, onCreate, required }: CreatableSelectProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const handleAdd = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    const created = await onCreate(trimmed)
    onChange(created.name)
    setNewName('')
    setAdding(false)
  }

  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {adding ? (
        <div className="flex gap-2">
          <input
            autoFocus
            className="input"
            placeholder={`Yeni ${label.toLocaleLowerCase('tr-TR')}`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          />
          <button type="button" className="btn-secondary shrink-0" onClick={handleAdd}>
            Ekle
          </button>
          <button type="button" className="btn-ghost shrink-0" onClick={() => setAdding(false)}>
            Vazgeç
          </button>
        </div>
      ) : (
        <select
          className="input"
          value={value}
          onChange={(e) => {
            if (e.target.value === '__new__') {
              setAdding(true)
            } else {
              onChange(e.target.value)
            }
          }}
        >
          <option value="" disabled>
            Seçiniz
          </option>
          {options.map((o) => (
            <option key={o.id} value={o.name}>
              {o.name}
            </option>
          ))}
          <option value="__new__">+ Yeni ekle…</option>
        </select>
      )}
    </div>
  )
}
