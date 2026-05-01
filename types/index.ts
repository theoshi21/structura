// TypeScript types and interfaces
// Requirements: 3.4, 9.4

// ============================================================
// User Types
// ============================================================

/**
 * User role types for role-based access control
 */
export type Role = 'organizer' | 'officer' | 'admin'

/**
 * User account with authentication credentials and role
 */
export interface User {
  id: string
  email: string
  username: string
  role: Role
  organizationName: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Input for creating a new user
 */
export interface CreateUserInput {
  email: string
  username: string
  password: string
  role: Role
}

/**
 * Session data stored in encrypted cookie
 */
export interface SessionData {
  userId: string
  role: Role
  createdAt: number
  expiresAt: number
}

// ============================================================
// Organization Types
// ============================================================

/**
 * Organization metadata (single record per deployment)
 */
export interface Organization {
  id: string
  name: string
  description: string | null
  contactEmail: string | null
  createdAt: Date
  updatedAt: Date
}

// ============================================================
// Event Types
// ============================================================

/**
 * Event lifecycle status
 */
export type EventStatus = 'proposed' | 'approved' | 'completed' | 'cancelled'

/**
 * Event proposal with associated data
 */
export interface Event {
  id: string
  name: string
  description: string | null
  eventDate: Date
  location: string | null
  status: EventStatus
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Input for creating a new event
 */
export interface CreateEventInput {
  name: string
  description?: string
  eventDate: Date
  location?: string
}

/**
 * Input for updating an event
 */
export interface UpdateEventInput {
  name?: string
  description?: string
  eventDate?: Date
  location?: string
  status?: EventStatus
}

/**
 * Filters for querying events
 */
export interface EventFilters {
  status?: EventStatus
  createdBy?: string
  dateFrom?: Date
  dateTo?: Date
}

// ============================================================
// Document Types
// ============================================================

/**
 * Document type categories
 */
export type DocumentType = 'permit' | 'contract' | 'promotional' | 'receipt' | 'financial'

/**
 * Document file associated with an event
 */
export interface Document {
  id: string
  eventId: string
  fileName: string
  filePath: string
  fileSize: number
  fileType: string
  documentType: DocumentType
  uploadedBy: string | null
  uploadedAt: Date
}

/**
 * Input for uploading a document
 */
export interface UploadDocumentInput {
  eventId: string
  file: File
  documentType: DocumentType
}

// ============================================================
// Checklist Types
// ============================================================

/**
 * Reusable checklist template
 */
export interface ChecklistTemplate {
  id: string
  name: string
  items: ChecklistTemplateItem[]
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Item within a checklist template
 */
export interface ChecklistTemplateItem {
  id: string
  templateId: string
  description: string
  orderIndex: number
  createdAt: Date
}

/**
 * Event-specific checklist
 */
export interface Checklist {
  id: string
  eventId: string
  createdFromTemplate: string | null
  items: ChecklistItem[]
  createdAt: Date
}

/**
 * Individual task within a checklist
 */
export interface ChecklistItem {
  id: string
  checklistId: string
  description: string
  isCompleted: boolean
  completedAt: Date | null
  completedBy: string | null
  orderIndex: number
  createdAt: Date
}

/**
 * Input for creating a checklist template
 */
export interface CreateTemplateInput {
  name: string
  items: string[]
}

/**
 * Input for updating a checklist template
 */
export interface UpdateTemplateInput {
  name?: string
  items?: string[]
}

// ============================================================
// Budget Types
// ============================================================

/**
 * Organizational budget (one record per organization)
 */
export interface Budget {
  id: string
  organizationId: string
  totalFunds: number
  updatedBy: string | null
  updatedAt: Date
}

/**
 * Fund allocation to a specific event
 */
export interface Allocation {
  id: string
  eventId: string
  organizationId: string
  amount: number
  allocatedBy: string | null
  allocatedAt: Date
}

/**
 * Actual spending recorded against an event
 */
export interface Expenditure {
  id: string
  eventId: string
  amount: number
  description: string
  documentId: string | null
  recordedBy: string | null
  recordedAt: Date
}

/**
 * Input for allocating funds to an event
 */
export interface AllocateFundsInput {
  eventId: string
  amount: number
}

/**
 * Input for recording an expenditure
 */
export interface RecordExpenditureInput {
  eventId: string
  amount: number
  description: string
  documentId: string
}

/**
 * Budget summary for display — scoped to one organization
 */
export interface BudgetSummary {
  organizationId: string
  organizationName: string
  totalFunds: number
  allocatedFunds: number
  availableFunds: number
}

/**
 * Event financial summary
 */
export interface EventFinancialSummary {
  eventId: string
  allocatedAmount: number
  totalSpent: number
  remainingFunds: number
}

// ============================================================
// Audit Trail Types
// ============================================================

/**
 * Audit action types
 */
export type AuditAction = 
  | 'user_created'
  | 'user_role_updated'
  | 'event_created'
  | 'event_updated'
  | 'event_status_changed'
  | 'event_deleted'
  | 'document_uploaded'
  | 'document_deleted'
  | 'funds_allocated'
  | 'expenditure_recorded'
  | 'checklist_created'
  | 'checklist_item_completed'

/**
 * Audit log entry for tracking critical operations
 */
export interface AuditEntry {
  id: string
  action: AuditAction
  entityType: string
  entityId: string
  userId: string | null
  details: Record<string, any> | null
  createdAt: Date
}

/**
 * Input for creating an audit log entry
 */
export interface CreateAuditEntryInput {
  action: AuditAction
  entityType: string
  entityId: string
  userId: string
  details?: Record<string, any>
}

// ============================================================
// API Response Types
// ============================================================

/**
 * Standard API success response
 */
export interface ApiResponse<T> {
  success: true
  data: T
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: {
      field: string
      message: string
    }[]
  }
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ============================================================
// Utility Types
// ============================================================

/**
 * Make all properties optional (for partial updates)
 */
export type PartialUpdate<T> = Partial<T>

/**
 * Omit timestamp fields (for input types)
 */
export type OmitTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt'>

/**
 * Database record with timestamps
 */
export interface WithTimestamps {
  createdAt: Date
  updatedAt: Date
}

