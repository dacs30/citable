import axios from 'axios'

export interface ScrapeResult {
  html: string
  title: string
  url: string
  error?: string
}

export async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<ScrapeResult> {
  try {
    const response = await axios.post(
      'https://api.firecrawl.dev/v1/scrape',
      { url, formats: ['html'], onlyMainContent: false },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = response.data?.data
    return {
      html: data?.html ?? '',
      title: data?.metadata?.title ?? '',
      url,
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status
      if (status === 401) {
        return { html: '', title: '', url, error: 'Invalid Firecrawl API key' }
      }
      if (status === 402 || status === 429) {
        return { html: '', title: '', url, error: 'Firecrawl rate limit or quota exceeded' }
      }
      return {
        html: '',
        title: '',
        url,
        error: `Firecrawl error (${status}): ${err.response?.data?.message ?? err.message}`,
      }
    }
    const message = err instanceof Error ? err.message : String(err)
    return { html: '', title: '', url, error: message }
  }
}
