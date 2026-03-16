export type UserRole = 'VIEWER' | 'ARTIST' | 'CUSTOMER' | 'ADMIN'

export type GigStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'

export interface JwtPayload {
  userId: string
  role: UserRole
  iat?: number
  exp?: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
