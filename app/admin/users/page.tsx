'use client'

import { useState, useEffect } from 'react'
import FilterTabs from '@/components/FilterTabs'
import Badge from '@/components/Badge'
import Button from '@/components/Button'
import Select from '@/components/Select'
import Pagination from '@/components/Pagination'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'
import { User, Role } from '@/types'
import type { Organization } from '@/lib/organizations'

/** Number of users shown per page */
const PAGE_SIZE = 10

/** Tab definitions for the users filter */
const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Organizer', value: 'organizer' },
  { label: 'Officer', value: 'officer' },
  { label: 'Admin', value: 'admin' },
]

/** Role options for the edit modal */
const roleOptions = [
  { value: 'organizer', label: 'Organizer' },
  { value: 'officer', label: 'Officer' },
  { value: 'admin', label: 'Admin' },
]

/** Skeleton row for loading state */
function SkeletonRow() {
  return (
    <tr className="border-b border-light-gray/20">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 bg-surface-raised rounded animate-pulse" style={{ width: `${60 + i * 8}%` }} />
        </td>
      ))}
    </tr>
  )
}

/**
 * User Management page for the admin portal.
 * Displays a filterable table of all users with role editing, toast feedback,
 * confirm dialog for role changes, and client-side validation.
 */
export default function AdminUsersPage() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('all')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<Role>('organizer')
  const [updating, setUpdating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [page, setPage] = useState(1)

  // Organizations state
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [orgsLoading, setOrgsLoading] = useState(true)
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgDesc, setNewOrgDesc] = useState('')
  const [creatingOrg, setCreatingOrg] = useState(false)
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null)

  /** Fetch users from API */
  useEffect(() => {
    fetchUsers()
  }, [])

  /** Fetch organizations from API */
  useEffect(() => {
    fetchOrgs()
  }, [])

  /** Fetches all users from the API */
  async function fetchUsers() {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch users')
      }

      setUsers(result.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  /** Fetches all organizations from the API */
  async function fetchOrgs() {
    try {
      setOrgsLoading(true)
      const res = await fetch('/api/organizations')
      const json = await res.json()
      if (json.success) setOrgs(json.data)
    } catch {
      // silently ignore
    } finally {
      setOrgsLoading(false)
    }
  }

  /** Creates a new organization */
  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault()
    if (!newOrgName.trim()) return

    setCreatingOrg(true)
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOrgName.trim(), description: newOrgDesc.trim() || undefined }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to create organization')

      setOrgs((prev) => [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewOrgName('')
      setNewOrgDesc('')
      setShowCreateOrg(false)
      toast.success(`Organization "${json.data.name}" created.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setCreatingOrg(false)
    }
  }

  /** Deletes an organization after confirmation */
  async function handleDeleteOrg(id: string, name: string) {
    try {
      const res = await fetch(`/api/organizations/${id}`, { method: 'DELETE' })
      const json = await res.json()

      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to delete organization')

      setOrgs((prev) => prev.filter((o) => o.id !== id))
      toast.success(`Organization "${name}" deleted.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete organization')
    } finally {
      setDeletingOrgId(null)
    }
  }

  /** Opens the edit modal for a user */
  function handleEditClick(user: User) {
    setEditingUser(user)
    setNewRole(user.role)
  }

  /** Closes the edit modal and resets state */
  function handleCancelEdit() {
    setEditingUser(null)
    setNewRole('organizer')
    setShowConfirm(false)
  }

  /** Validates and shows the confirm dialog before updating role */
  function handleRoleUpdateRequest() {
    if (!editingUser) return
    if (newRole === editingUser.role) {
      toast.info('No change — the selected role is the same as the current role.')
      return
    }
    setShowConfirm(true)
  }

  /** Performs the role update after confirmation */
  async function handleConfirmRoleUpdate() {
    if (!editingUser) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/users/${editingUser.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to update role')
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? result.data : u))
      )

      toast.success(`Role updated to ${newRole} for ${editingUser.username}.`)
      handleCancelEdit()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
      setShowConfirm(false)
    } finally {
      setUpdating(false)
    }
  }

  /** Filter users by role tab; 'all' shows every row */
  const filtered = activeTab === 'all' ? users : users.filter((u) => u.role === activeTab)
  const pagedUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  /** Get user initials from username */
  function getInitials(username: string): string {
    return username.charAt(0).toUpperCase()
  }

  /** Capitalize role for display */
  function capitalizeRole(role: Role): string {
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-off-white">Users</h1>
        <Button variant="primary" size="sm" onClick={() => toast.info('Add User coming soon.')}>
          + Add User
        </Button>
      </div>

      {/* Filter tabs */}
      <FilterTabs tabs={tabs} active={activeTab} onChange={(tab) => { setActiveTab(tab); setPage(1) }} />

      {/* Users table */}
      <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-surface">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-light-gray/30 bg-surface-raised">
              {['Name', 'Email', 'Role', 'Status', 'Action'].map((col) => (
                <th
                  key={col}
                  className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-mid-gray"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-mid-gray">
                  No users found.
                </td>
              </tr>
            ) : (
              pagedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-light-gray/20 last:border-0 hover:bg-surface-raised transition-colors"
                >
                  {/* Name with avatar */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white font-body">
                          {getInitials(user.username)}
                        </span>
                      </div>
                      <span className="text-off-white font-medium">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-mid-gray">{user.email}</td>
                  <td className="px-5 py-3.5 text-off-white">{capitalizeRole(user.role)}</td>
                  <td className="px-5 py-3.5">
                    <Badge label="Active" color="green" />
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="text-accent hover:underline font-medium"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={Math.ceil(filtered.length / PAGE_SIZE)}
        onChange={setPage}
      />

      {/* Edit Role Modal */}
      {editingUser && !showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-heading text-2xl text-off-white mb-4">Edit User Role</h2>

            <div className="mb-4">
              <p className="text-sm text-mid-gray mb-1">
                User: <span className="font-medium text-off-white">{editingUser.username}</span>
              </p>
              <p className="text-sm text-mid-gray mb-4">
                Email: <span className="font-medium text-off-white">{editingUser.email}</span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-off-white mb-2">
                New Role
              </label>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Role)}
                options={roleOptions}
              />
              {newRole === editingUser.role && (
                <p className="mt-1.5 text-xs text-mid-gray">
                  This is the user's current role. Select a different role to make a change.
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRoleUpdateRequest}
                disabled={updating || newRole === editingUser.role}
              >
                Update Role
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm role change dialog */}
      {showConfirm && editingUser && (
        <ConfirmDialog
          title="Change User Role?"
          message={`This will change ${editingUser.username}\u2019s role from ${editingUser.role} to ${newRole}. Their permissions will update immediately.`}
          confirmLabel="Yes, Update Role"
          loading={updating}
          onConfirm={handleConfirmRoleUpdate}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* ── Organizations ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-4">
        <h2 className="font-heading text-xl text-off-white">Organizations</h2>
        <button
          onClick={() => setShowCreateOrg(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Create Organization
        </button>
      </div>

      <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-surface">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-light-gray/30 bg-surface-raised">
              {['Name', 'Description', 'Action'].map((col) => (
                <th key={col} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-mid-gray">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orgsLoading ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-mid-gray">Loading…</td>
              </tr>
            ) : orgs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-mid-gray">
                  No organizations yet. Create one so students can register.
                </td>
              </tr>
            ) : (
              orgs.map((org) => (
                <tr key={org.id} className="border-b border-light-gray/20 last:border-0 hover:bg-surface-raised transition-colors">
                  <td className="px-5 py-3.5 text-off-white font-medium">{org.name}</td>
                  <td className="px-5 py-3.5 text-mid-gray">{org.description ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setDeletingOrgId(org.id)}
                      className="text-red-400 hover:underline font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Organization modal */}
      {showCreateOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-light-gray/30 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-light-gray/20">
              <h2 className="font-heading text-xl text-off-white">Create Organization</h2>
              <button onClick={() => setShowCreateOrg(false)} className="text-mid-gray hover:text-off-white text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleCreateOrg}>
              <div className="px-6 py-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
                    Organization Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="e.g. Computer Science Society"
                    required
                    className="w-full bg-surface-raised border border-light-gray/30 rounded-lg px-4 py-2.5 text-sm text-off-white placeholder-mid-gray/60 outline-none focus:ring-2 focus:ring-accent/50 transition"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
                    Description <span className="text-mid-gray font-normal normal-case">(optional)</span>
                  </label>
                  <textarea
                    value={newOrgDesc}
                    onChange={(e) => setNewOrgDesc(e.target.value)}
                    placeholder="Brief description of the organization"
                    rows={2}
                    className="w-full bg-surface-raised border border-light-gray/30 rounded-lg px-4 py-2.5 text-sm text-off-white placeholder-mid-gray/60 outline-none focus:ring-2 focus:ring-accent/50 transition resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-light-gray/20">
                <button type="button" onClick={() => setShowCreateOrg(false)} className="px-4 py-2 text-sm text-mid-gray hover:text-off-white transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingOrg || !newOrgName.trim()}
                  className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creatingOrg ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete organization dialog */}
      {deletingOrgId && (
        <ConfirmDialog
          title="Delete Organization?"
          message={`Are you sure you want to delete "${orgs.find((o) => o.id === deletingOrgId)?.name}"? Students registered under this organization will keep their account but lose the org association.`}
          confirmLabel="Delete"
          loading={false}
          onConfirm={() => {
            const org = orgs.find((o) => o.id === deletingOrgId)
            if (org) handleDeleteOrg(org.id, org.name)
          }}
          onCancel={() => setDeletingOrgId(null)}
        />
      )}
    </div>
  )
}
