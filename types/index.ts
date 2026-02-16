export interface Analysis {
  id: string
  url: string
  domain: string
  overall_score: number | null
  scraper_type: 'playwright' | 'firecrawl'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message: string | null
  created_at: string
}

export interface PageScore {
  id: string
  analysis_id: string
  url: string
  score: number | null
  scores_breakdown: GeoScoreBreakdown | null
  raw_content: string | null
  created_at: string
}

export interface GeoFactor {
  score: number
  maxScore: number
  details: string
  label: string
}

export interface GeoScoreBreakdown {
  schemaMarkup: GeoFactor      // maxScore: 20
  contentStructure: GeoFactor   // maxScore: 15
  metaTags: GeoFactor           // maxScore: 10
  faqContent: GeoFactor         // maxScore: 10
  authorEEAT: GeoFactor         // maxScore: 10
  contentFreshness: GeoFactor   // maxScore: 5
  internalLinking: GeoFactor    // maxScore: 5
  imageAltText: GeoFactor       // maxScore: 5
  aiCrawlability: GeoFactor     // maxScore: 10
  answerForwardWriting: GeoFactor // maxScore: 10
}

export interface AnalysisWithPages extends Analysis {
  page_scores: PageScore[]
}

export type { ContentPreview, SchemaEntry, HeadingEntry } from '@/lib/content-preview'

export interface AnalyzeRequest {
  url: string
  scraper_type?: 'playwright' | 'firecrawl'
}

export interface AnalyzeResponse {
  analysis: Analysis
  error?: string
}
