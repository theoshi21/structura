// Organization management service
// Admins create organizations; students select one at registration.

import { createSupabaseClient } from './supabase'

/** A student organization record */
export interface Organization {
  id: string
  name: string
  description: string | null
  contactEmail: string | null
  createdAt: Date
  updatedAt: Date
}

/** Input for creating a new organization */
export interface CreateOrganizationInput {
  name: string
  description?: string
  contactEmail?: string
}

/**
 * Maps a raw database row to the Organization interface.
 */
function mapOrg(row: Record<string, unknown>): Organization {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    contactEmail: (row.contact_email as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

/**
 * Returns all organizations, ordered alphabetically by name.
 * Used to populate the registration dropdown.
 */
export async function listOrganizations(): Promise<Organization[]> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, description, contact_email, created_at, updated_at')
    .order('name', { ascending: true })

  if (error) throw new Error(`Failed to list organizations: ${error.message}`)
  return (data ?? []).map(mapOrg)
}

/**
 * Returns a single organization by ID, or null if not found.
 * @param id - Organization's unique identifier
 */
export async function getOrganizationById(id: string): Promise<Organization | null> {
  if (!id) throw new Error('Organization ID is required')

  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, description, contact_email, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return mapOrg(data)
}

/**
 * Creates a new organization. Admin only.
 * @param input - Organization name, optional description and contact email
 * @returns Promise resolving to the created Organization
 * @throws Error if name is missing or already exists
 */
export async function createOrganization(input: CreateOrganizationInput): Promise<Organization> {
  if (!input.name?.trim()) throw new Error('Organization name is required')

  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      contact_email: input.contactEmail?.trim() ?? null,
    })
    .select('id, name, description, contact_email, created_at, updated_at')
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('An organization with that name already exists')
    throw new Error(`Failed to create organization: ${error.message}`)
  }

  return mapOrg(data)
}

/**
 * Deletes an organization by ID. Admin only.
 * @param id - Organization's unique identifier
 */
export async function deleteOrganization(id: string): Promise<void> {
  if (!id) throw new Error('Organization ID is required')

  const supabase = createSupabaseClient()

  const { error } = await supabase.from('organizations').delete().eq('id', id)

  if (error) throw new Error(`Failed to delete organization: ${error.message}`)
}
