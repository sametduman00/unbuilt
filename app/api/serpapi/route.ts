import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 })
  }

  const apiKey = process.env.SERPAPI_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'SERPAPI_KEY not configured' }, { status: 500 })
  }

  try {
    // Google Trends - interest over time (last 90 days)
    const trendsUrl = `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(query)}&date=today%203-m&api_key=${apiKey}`
    const trendsRes = await fetch(trendsUrl)
    const trendsData = await trendsRes.json()

    const interestOverTime = trendsData?.interest_over_time?.timeline_data || []

    // Son 4 hafta ortalaması vs önceki 4 hafta ortalaması
    const values = interestOverTime.map((d: any) => d.values?.[0]?.extracted_value || 0)
    const recent = values.slice(-4)
    const previous = values.slice(-8, -4)

    const recentAvg = recent.length ? recent.reduce((a: number, b: number) => a + b, 0) / recent.length : 0
    const previousAvg = previous.length ? previous.reduce((a: number, b: number) => a + b, 0) / previous.length : 0

    const trend = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0
    const currentScore = recentAvg // 0-100 arası Google Trends skoru

    // Related queries (breakout = hızla yükselen)
    const relatedQueries = trendsData?.related_queries?.rising?.slice(0, 5) || []

    return NextResponse.json({
      query,
      currentScore: Math.round(currentScore),
      trendPercent: Math.round(trend), // + ise yükseliyor, - ise düşüyor
      direction: trend > 5 ? 'rising' : trend < -5 ? 'falling' : 'stable',
      relatedQueries: relatedQueries.map((q: any) => ({
        query: q.query,
        value: q.value // "Breakout" veya % artış
      })),
      timelineData: interestOverTime.slice(-8).map((d: any) => ({
        date: d.date,
        value: d.values?.[0]?.extracted_value || 0
      }))
    })
  } catch (error) {
    console.error('SerpAPI error:', error)
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 })
  }
}
