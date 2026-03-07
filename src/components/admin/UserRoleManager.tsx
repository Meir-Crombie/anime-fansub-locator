'use client'

import { useState } from 'react'
import { assignManagerToGroup, removeManagerRole, setAdminRole, demoteAdmin } from '@/actions/admin'

interface User {
  id: string
  display_name: string | null
  role: string
}

interface Fansub {
  id: string
  name: string
  manager_uid: string | null
}

interface Props {
  users: User[]
  fansubs: Fansub[]
  currentUserId: string
}

export default function UserRoleManager({ users: initialUsers, fansubs, currentUserId }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedFansub, setSelectedFansub] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  const filtered = users.filter((u) => {
    const name = u.display_name || ''
    return name.toLowerCase().includes(search.toLowerCase())
  })

  async function handleAssignManager(userId: string) {
    const fansubId = selectedFansub[userId]
    if (!fansubId) {
      alert('יש לבחור קבוצה קודם')
      return
    }
    setLoading(userId)
    const result = await assignManagerToGroup(userId, fansubId)
    if (result?.error) {
      alert(result.error)
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: 'manager' } : u))
      )
    }
    setLoading(null)
  }

  async function handlePromoteAdmin(userId: string) {
    if (!confirm('להפוך את המשתמש הזה למנהל ראשי?')) return
    setLoading(userId)
    const result = await setAdminRole(userId)
    if (result?.error) {
      alert(result.error)
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: 'admin' } : u))
      )
    }
    setLoading(null)
  }

  async function handleDemoteAdmin(userId: string) {
    if (!confirm('להוריד את המשתמש הזה מתפקיד מנהל ראשי?')) return
    setLoading(userId)
    const result = await demoteAdmin(userId)
    if (result?.error) {
      alert(result.error)
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: 'viewer' } : u))
      )
    }
    setLoading(null)
  }

  async function handleRemoveRole(userId: string) {
    if (!confirm('להסיר את הרשאות המנהל מהמשתמש הזה?')) return
    setLoading(userId)
    const result = await removeManagerRole(userId)
    if (result?.error) {
      alert(result.error)
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: 'viewer' } : u))
      )
    }
    setLoading(null)
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="חפש משתמש..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-md border border-input bg-background
                   px-3 py-2 text-sm placeholder:text-muted-foreground"
      />

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-right px-4 py-3 font-medium">שם</th>
              <th className="text-right px-4 py-3 font-medium">תפקיד נוכחי</th>
              <th className="text-right px-4 py-3 font-medium">שייך לקבוצה</th>
              <th className="text-right px-4 py-3 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-muted-foreground">
                  לא נמצאו משתמשים
                </td>
              </tr>
            )}
            {filtered.map((user) => (
              <tr
                key={user.id}
                className="border-t hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-3">
                  {user.display_name || 'משתמש אנונימי'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium
                    ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : user.role === 'manager'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {user.role === 'admin'
                      ? 'מנהל ראשי'
                      : user.role === 'manager'
                        ? 'מנהל קבוצה'
                        : 'משתמש'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.role !== 'admin' && (
                    <select
                      value={selectedFansub[user.id] ?? ''}
                      onChange={(e) =>
                        setSelectedFansub((prev) => ({
                          ...prev,
                          [user.id]: e.target.value,
                        }))
                      }
                      className="rounded border border-input bg-background px-2 py-1 text-xs w-40"
                    >
                      <option value="">בחר קבוצה...</option>
                      {fansubs.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                          {f.manager_uid === user.id ? ' (מנהל נוכחי)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {user.role === 'viewer' && (
                      <>
                        <button
                          onClick={() => handleAssignManager(user.id)}
                          disabled={loading === user.id}
                          className="text-xs px-2 py-1 rounded bg-blue-600 text-white
                                     hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {loading === user.id ? '...' : 'הגדר כמנהל קבוצה'}
                        </button>
                        <button
                          onClick={() => handlePromoteAdmin(user.id)}
                          disabled={loading === user.id}
                          className="text-xs px-2 py-1 rounded bg-red-600 text-white
                                     hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {loading === user.id ? '...' : 'הגדר כמנהל ראשי'}
                        </button>
                      </>
                    )}
                    {user.role === 'manager' && (
                      <>
                        <button
                          onClick={() => handleRemoveRole(user.id)}
                          disabled={loading === user.id}
                          className="text-xs px-2 py-1 rounded bg-destructive text-destructive-foreground
                                     hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                        >
                          {loading === user.id ? '...' : 'הסר הרשאות'}
                        </button>
                        <button
                          onClick={() => handlePromoteAdmin(user.id)}
                          disabled={loading === user.id}
                          className="text-xs px-2 py-1 rounded bg-red-600 text-white
                                     hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {loading === user.id ? '...' : 'הגדר כמנהל ראשי'}
                        </button>
                      </>
                    )}
                    {user.role === 'admin' && user.id !== currentUserId && (
                      <button
                        onClick={() => handleDemoteAdmin(user.id)}
                        disabled={loading === user.id}
                        className="text-xs px-2 py-1 rounded bg-destructive text-destructive-foreground
                                   hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                      >
                        {loading === user.id ? '...' : 'הסר הרשאות מנהל'}
                      </button>
                    )}
                    {user.role === 'admin' && user.id === currentUserId && (
                      <span className="text-xs text-muted-foreground">
                        את/ה (מנהל ראשי)
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
