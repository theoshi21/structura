// ChecklistTemplateService and ChecklistService
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5

import { createSupabaseClient } from './supabase'
import {
  ChecklistTemplate,
  ChecklistTemplateItem,
  Checklist,
  ChecklistItem,
  CreateTemplateInput,
  UpdateTemplateInput,
} from '@/types'

// ─── Mappers ─────────────────────────────────────────────────────────────────

/**
 * Maps a raw database row to a ChecklistTemplateItem interface.
 */
function mapTemplateItem(row: Record<string, unknown>): ChecklistTemplateItem {
  return {
    id: row.id as string,
    templateId: row.template_id as string,
    description: row.description as string,
    orderIndex: row.order_index as number,
    createdAt: new Date(row.created_at as string),
  }
}

/**
 * Maps a raw database row to a ChecklistTemplate interface.
 */
function mapTemplate(row: Record<string, unknown>, items: ChecklistTemplateItem[] = []): ChecklistTemplate {
  return {
    id: row.id as string,
    name: row.name as string,
    items,
    createdBy: (row.created_by as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

/**
 * Maps a raw database row to a ChecklistItem interface.
 */
function mapChecklistItem(row: Record<string, unknown>): ChecklistItem {
  return {
    id: row.id as string,
    checklistId: row.checklist_id as string,
    description: row.description as string,
    isCompleted: row.is_completed as boolean,
    completedAt: row.completed_at ? new Date(row.completed_at as string) : null,
    completedBy: (row.completed_by as string) ?? null,
    orderIndex: row.order_index as number,
    createdAt: new Date(row.created_at as string),
  }
}

/**
 * Maps a raw database row to a Checklist interface.
 */
function mapChecklist(row: Record<string, unknown>, items: ChecklistItem[] = []): Checklist {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    createdFromTemplate: (row.created_from_template as string) ?? null,
    items,
    createdAt: new Date(row.created_at as string),
  }
}

// ─── ChecklistTemplateService ─────────────────────────────────────────────────

/**
 * Creates a new checklist template with the given name and items.
 * @param input - Template name and array of item descriptions
 * @param userId - ID of the admin creating the template
 * @returns Promise resolving to the created ChecklistTemplate
 * @throws Error if name is missing or DB insert fails
 */
export async function createTemplate(
  input: CreateTemplateInput,
  userId: string
): Promise<ChecklistTemplate> {
  if (!input.name) throw new Error('Template name is required')
  if (!userId) throw new Error('User ID is required')

  const supabase = createSupabaseClient()

  const { data: template, error: templateError } = await supabase
    .from('checklist_templates')
    .insert({ name: input.name, created_by: userId })
    .select('id, name, created_by, created_at, updated_at')
    .single()

  if (templateError) {
    throw new Error(`Failed to create template: ${templateError.message}`)
  }

  // Insert items in order
  const items: ChecklistTemplateItem[] = []
  if (input.items && input.items.length > 0) {
    const itemRows = input.items.map((description, index) => ({
      template_id: template.id,
      description,
      order_index: index,
    }))

    const { data: insertedItems, error: itemsError } = await supabase
      .from('checklist_template_items')
      .insert(itemRows)
      .select('id, template_id, description, order_index, created_at')

    if (itemsError) {
      throw new Error(`Failed to create template items: ${itemsError.message}`)
    }

    items.push(...insertedItems.map(mapTemplateItem))
  }

  return mapTemplate(template, items)
}

/**
 * Returns a single checklist template by ID, including its items.
 * @param id - Template's unique identifier
 * @returns Promise resolving to the template or null if not found
 */
export async function getTemplateById(id: string): Promise<ChecklistTemplate | null> {
  if (!id) throw new Error('Template ID is required')

  const supabase = createSupabaseClient()

  const { data: template, error } = await supabase
    .from('checklist_templates')
    .select('id, name, created_by, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error || !template) return null

  const { data: itemRows } = await supabase
    .from('checklist_template_items')
    .select('id, template_id, description, order_index, created_at')
    .eq('template_id', id)
    .order('order_index', { ascending: true })

  return mapTemplate(template, (itemRows ?? []).map(mapTemplateItem))
}

/**
 * Lists all checklist templates with their items.
 * @returns Promise resolving to an array of ChecklistTemplate records
 */
export async function listTemplates(): Promise<ChecklistTemplate[]> {
  const supabase = createSupabaseClient()

  const { data: templates, error } = await supabase
    .from('checklist_templates')
    .select('id, name, created_by, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to list templates: ${error.message}`)

  const { data: allItems } = await supabase
    .from('checklist_template_items')
    .select('id, template_id, description, order_index, created_at')
    .order('order_index', { ascending: true })

  const itemsByTemplate = new Map<string, ChecklistTemplateItem[]>()
  for (const item of allItems ?? []) {
    const mapped = mapTemplateItem(item)
    const existing = itemsByTemplate.get(item.template_id) ?? []
    itemsByTemplate.set(item.template_id, [...existing, mapped])
  }

  return templates.map((t) => mapTemplate(t, itemsByTemplate.get(t.id) ?? []))
}

/**
 * Updates a checklist template's name and/or items.
 * Replaces all items when items array is provided.
 * @param id - Template's unique identifier
 * @param data - Fields to update
 * @param userId - ID of the user performing the update
 * @returns Promise resolving to the updated ChecklistTemplate
 * @throws Error if template not found or update fails
 */
export async function updateTemplate(
  id: string,
  data: UpdateTemplateInput,
  userId: string
): Promise<ChecklistTemplate> {
  if (!id) throw new Error('Template ID is required')
  if (!userId) throw new Error('User ID is required')

  const supabase = createSupabaseClient()

  if (data.name !== undefined) {
    const { error } = await supabase
      .from('checklist_templates')
      .update({ name: data.name, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new Error(`Failed to update template: ${error.message}`)
  }

  // Replace items if provided
  if (data.items !== undefined) {
    await supabase.from('checklist_template_items').delete().eq('template_id', id)

    if (data.items.length > 0) {
      const itemRows = data.items.map((description, index) => ({
        template_id: id,
        description,
        order_index: index,
      }))
      const { error: itemsError } = await supabase
        .from('checklist_template_items')
        .insert(itemRows)

      if (itemsError) throw new Error(`Failed to update template items: ${itemsError.message}`)
    }
  }

  const updated = await getTemplateById(id)
  if (!updated) throw new Error('Template not found')
  return updated
}

/**
 * Deletes a checklist template and all its items (cascade).
 * @param id - Template's unique identifier
 * @param userId - ID of the user performing the deletion
 * @returns Promise that resolves when deletion is complete
 * @throws Error if template not found or deletion fails
 */
export async function deleteTemplate(id: string, userId: string): Promise<void> {
  if (!id) throw new Error('Template ID is required')
  if (!userId) throw new Error('User ID is required')

  const supabase = createSupabaseClient()

  const { error } = await supabase.from('checklist_templates').delete().eq('id', id)

  if (error) throw new Error(`Failed to delete template: ${error.message}`)
}

// ─── ChecklistService ─────────────────────────────────────────────────────────

/**
 * Creates a checklist for an event by copying all items from a template.
 * @param eventId - The event to attach the checklist to
 * @param templateId - The template to copy items from
 * @param userId - ID of the user creating the checklist
 * @returns Promise resolving to the created Checklist
 * @throws Error if template not found or DB insert fails
 */
export async function createChecklistFromTemplate(
  eventId: string,
  templateId: string,
  userId: string
): Promise<Checklist> {
  if (!eventId) throw new Error('Event ID is required')
  if (!templateId) throw new Error('Template ID is required')
  if (!userId) throw new Error('User ID is required')

  const template = await getTemplateById(templateId)
  if (!template) throw new Error('Template not found')

  const supabase = createSupabaseClient()

  const { data: checklist, error: checklistError } = await supabase
    .from('checklists')
    .insert({ event_id: eventId, created_from_template: templateId })
    .select('id, event_id, created_from_template, created_at')
    .single()

  if (checklistError) {
    throw new Error(`Failed to create checklist: ${checklistError.message}`)
  }

  // Copy template items to the event checklist
  const items: ChecklistItem[] = []
  if (template.items.length > 0) {
    const itemRows = template.items.map((item) => ({
      checklist_id: checklist.id,
      description: item.description,
      order_index: item.orderIndex,
      is_completed: false,
    }))

    const { data: insertedItems, error: itemsError } = await supabase
      .from('checklist_items')
      .insert(itemRows)
      .select('id, checklist_id, description, is_completed, completed_at, completed_by, order_index, created_at')

    if (itemsError) throw new Error(`Failed to copy template items: ${itemsError.message}`)

    items.push(...insertedItems.map(mapChecklistItem))
  }

  return mapChecklist(checklist, items)
}

/**
 * Creates a custom checklist for an event with the given item descriptions.
 * @param eventId - The event to attach the checklist to
 * @param itemDescriptions - Array of item description strings
 * @param userId - ID of the user creating the checklist
 * @returns Promise resolving to the created Checklist
 * @throws Error if DB insert fails
 */
export async function createCustomChecklist(
  eventId: string,
  itemDescriptions: string[],
  userId: string
): Promise<Checklist> {
  if (!eventId) throw new Error('Event ID is required')
  if (!userId) throw new Error('User ID is required')

  const supabase = createSupabaseClient()

  const { data: checklist, error: checklistError } = await supabase
    .from('checklists')
    .insert({ event_id: eventId, created_from_template: null })
    .select('id, event_id, created_from_template, created_at')
    .single()

  if (checklistError) {
    throw new Error(`Failed to create checklist: ${checklistError.message}`)
  }

  const items: ChecklistItem[] = []
  if (itemDescriptions.length > 0) {
    const itemRows = itemDescriptions.map((description, index) => ({
      checklist_id: checklist.id,
      description,
      order_index: index,
      is_completed: false,
    }))

    const { data: insertedItems, error: itemsError } = await supabase
      .from('checklist_items')
      .insert(itemRows)
      .select('id, checklist_id, description, is_completed, completed_at, completed_by, order_index, created_at')

    if (itemsError) throw new Error(`Failed to create checklist items: ${itemsError.message}`)

    items.push(...insertedItems.map(mapChecklistItem))
  }

  return mapChecklist(checklist, items)
}

/**
 * Returns the checklist for a given event, including all items.
 * Uses a single joined query to avoid two sequential round-trips.
 * @param eventId - The event's unique identifier
 * @returns Promise resolving to the Checklist or null if none exists
 */
export async function getChecklistByEvent(eventId: string): Promise<Checklist | null> {
  if (!eventId) throw new Error('Event ID is required')

  const supabase = createSupabaseClient()

  // Fetch checklist and its items in one round-trip via a nested select
  const { data: checklist, error } = await supabase
    .from('checklists')
    .select(`
      id, event_id, created_from_template, created_at,
      checklist_items (
        id, checklist_id, description, is_completed,
        completed_at, completed_by, order_index, created_at
      )
    `)
    .eq('event_id', eventId)
    .order('order_index', { ascending: true, referencedTable: 'checklist_items' })
    .single()

  if (error || !checklist) return null

  const items = ((checklist as any).checklist_items ?? []).map(mapChecklistItem)
  return mapChecklist(checklist, items)
}

/**
 * Returns all checklists for a given list of event IDs, including items.
 * Uses a single query instead of one query per event, eliminating the N+1 problem.
 * @param eventIds - Array of event IDs to fetch checklists for
 * @returns Promise resolving to an array of Checklists
 */
export async function getChecklistsByEventIds(eventIds: string[]): Promise<Checklist[]> {
  if (!eventIds.length) return []

  const supabase = createSupabaseClient()

  const { data: rows, error } = await supabase
    .from('checklists')
    .select(`
      id, event_id, created_from_template, created_at,
      checklist_items (
        id, checklist_id, description, is_completed,
        completed_at, completed_by, order_index, created_at
      )
    `)
    .in('event_id', eventIds)
    .order('order_index', { ascending: true, referencedTable: 'checklist_items' })

  if (error) throw new Error(`Failed to list checklists: ${error.message}`)

  return (rows ?? []).map((row) => {
    const items = ((row as any).checklist_items ?? []).map(mapChecklistItem)
    return mapChecklist(row, items)
  })
}

/**
 * Adds a new item to an existing checklist.
 * @param checklistId - The checklist's unique identifier
 * @param description - Description of the new item
 * @param userId - ID of the user adding the item
 * @returns Promise resolving to the created ChecklistItem
 * @throws Error if DB insert fails
 */
export async function addChecklistItem(
  checklistId: string,
  description: string,
  userId: string
): Promise<ChecklistItem> {
  if (!checklistId) throw new Error('Checklist ID is required')
  if (!description) throw new Error('Item description is required')
  if (!userId) throw new Error('User ID is required')

  const supabase = createSupabaseClient()

  // Determine next order index
  const { data: existing } = await supabase
    .from('checklist_items')
    .select('order_index')
    .eq('checklist_id', checklistId)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0

  const { data: item, error } = await supabase
    .from('checklist_items')
    .insert({ checklist_id: checklistId, description, order_index: nextIndex, is_completed: false })
    .select('id, checklist_id, description, is_completed, completed_at, completed_by, order_index, created_at')
    .single()

  if (error) throw new Error(`Failed to add checklist item: ${error.message}`)

  return mapChecklistItem(item)
}

/**
 * Removes an item from a checklist.
 * @param itemId - The checklist item's unique identifier
 * @param userId - ID of the user removing the item
 * @returns Promise that resolves when deletion is complete
 * @throws Error if item not found or deletion fails
 */
export async function removeChecklistItem(itemId: string, userId: string): Promise<void> {
  if (!itemId) throw new Error('Item ID is required')
  if (!userId) throw new Error('User ID is required')

  const supabase = createSupabaseClient()

  const { error } = await supabase.from('checklist_items').delete().eq('id', itemId)

  if (error) throw new Error(`Failed to remove checklist item: ${error.message}`)
}

/**
 * Toggles a checklist item's completion status.
 * Records the timestamp and user when marking complete; clears them when unchecking.
 * @param itemId - The checklist item's unique identifier
 * @param userId - ID of the user toggling the item
 * @returns Promise resolving to the updated ChecklistItem
 * @throws Error if item not found or update fails
 */
export async function toggleChecklistItem(itemId: string, userId: string): Promise<ChecklistItem> {
  if (!itemId) throw new Error('Item ID is required')
  if (!userId) throw new Error('User ID is required')

  const supabase = createSupabaseClient()

  // Fetch current state
  const { data: current, error: fetchError } = await supabase
    .from('checklist_items')
    .select('id, checklist_id, description, is_completed, completed_at, completed_by, order_index, created_at')
    .eq('id', itemId)
    .single()

  if (fetchError || !current) throw new Error('Checklist item not found')

  const nowCompleted = !current.is_completed
  const updates = nowCompleted
    ? { is_completed: true, completed_at: new Date().toISOString(), completed_by: userId }
    : { is_completed: false, completed_at: null, completed_by: null }

  const { data: updated, error: updateError } = await supabase
    .from('checklist_items')
    .update(updates)
    .eq('id', itemId)
    .select('id, checklist_id, description, is_completed, completed_at, completed_by, order_index, created_at')
    .single()

  if (updateError) throw new Error(`Failed to toggle checklist item: ${updateError.message}`)

  return mapChecklistItem(updated)
}

/**
 * Calculates the completion percentage for a checklist.
 * Returns 0 if the checklist has no items.
 * @param checklistId - The checklist's unique identifier
 * @returns Promise resolving to a number between 0 and 100
 */
export async function getCompletionPercentage(checklistId: string): Promise<number> {
  if (!checklistId) throw new Error('Checklist ID is required')

  const supabase = createSupabaseClient()

  const { data: items, error } = await supabase
    .from('checklist_items')
    .select('is_completed')
    .eq('checklist_id', checklistId)

  if (error) throw new Error(`Failed to get checklist items: ${error.message}`)
  if (!items || items.length === 0) return 0

  const completed = items.filter((i) => i.is_completed).length
  return Math.round((completed / items.length) * 100)
}
