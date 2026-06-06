export type UUID = string
export type Instant = string

export type ListingType = 'SALE' | 'EXCHANGE' | 'SERVICE'
export type ListingCondition = 'NEW' | 'LIKE_NEW' | 'USED'
export type ListingStatus = 'ACTIVE' | 'SOLD' | 'PAUSED' | 'REMOVED'

export interface CategoryResponse {
  id: UUID
  name: string
  slug: string
  icon: string | null
  createdAt: Instant
  updatedAt: Instant
}

export interface ListingImageResponse {
  id: UUID
  url: string
  name?: string
  key?: string
  sortOrder: number
  createdAt: Instant
}

export interface ListingDetailResponse {
  id: UUID
  sellerId: string
  title: string
  description: string
  price: string | null
  listingType: ListingType
  condition: ListingCondition | null
  status: ListingStatus
  location: string | null
  contactInfo: Record<string, string> | null
  viewCount: number
  categories: CategoryResponse[]
  images: ListingImageResponse[]
  createdAt: Instant
  updatedAt: Instant
}

export interface ListingSummaryResponse {
  id: UUID
  sellerId: string
  title: string
  price: string | null
  listingType: ListingType
  condition: ListingCondition | null
  status: ListingStatus
  location: string | null
  viewCount: number
  coverImageUrl: string | null
  categories: CategoryResponse[]
  createdAt: Instant
  updatedAt: Instant
}
