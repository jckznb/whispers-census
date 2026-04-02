import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '../supabaseClient'
import { CLASS_COLORS } from '../utils/constants'

/**
 * Historical popularity trend chart.
 * Shows how class/race popularity has shifted across snapshots over time.
 * Phase 2+ feature — requires multiple snapshots in demographics_snapshot.
 */
export function TrendChart({ context, groupBy = 'class', topN = 5 }) {
  const [chartData, setChartData] = useState([])
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!context) return

    async function fetchTrend() {
      setLoading(true)

      const { data: rows } = await supabase
        .from('demographics_snapshot')
        .select(`
          snapshot_date, count,
          classes ( name ),
          races ( name )
        `)
        .eq('context', context)
        .order('snapshot_date', { ascending: true })

      if (!rows?.length) {
        setChartData([])
        setLoading(false)
        return
      }

      // Group by date, then by class/race
      const byDate = new Map()
      const totals = new Map()  // name -> total count across all dates

      for (const row of rows) {
        const name = groupBy === 'class' ? row.classes?.name : row.races?.name
        if (!name) continue

        const date = row.snapshot_date
        if (!byDate.has(date)) byDate.set(date, {})
        const dateMap = byDate.get(date)
        dateMap[name] = (dateMap[name] || 0) + row.count
        totals.set(name, (totals.get(name) || 0) + row.count)
      }

      // Pick top N by total count
      const topKeys = [...totals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([name]) => name)
      setKeys(topKeys)

      // Build chart data: compute percentages per date
      const points = []
      for (const [date, nameCounts] of byDate) {
        const total = Object.values(nameCounts).reduce((s, v) => s + v, 0)
        const point = { date }
        for (const key of topKeys) {
          point[key] = total > 0 ? +((nameCounts[key] || 0) / total * 100).toFixed(2) : 0
        }
        points.push(point)
      }

      setChartData(points)
      setLoading(false)
    }

    fetchTrend()
  }, [context, groupBy, topN])

  if (loading) {
    return <div className="text-void-500 text-sm text-center py-8">Loading...</div>
  }

  if (chartData.length < 2) {
    return (
      <div className="text-void-500 text-sm text-center py-8">
        Trend data requires at least two snapshots.
        <br />
        <span className="text-xs">Run another crawl after the weekly reset.</span>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fill: '#7c6fa0', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#2d1f4a' }}
        />
        <YAxis
          tickFormatter={v => `${v}%`}
          tick={{ fill: '#7c6fa0', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#1a0a30', border: '1px solid #3d1a6e', borderRadius: 8 }}
          labelStyle={{ color: '#c8b8e8' }}
          formatter={(val, name) => [`${val}%`, name]}
        />
        <Legend
          wrapperStyle={{ paddingTop: 8 }}
          formatter={name => (
            <span style={{ color: groupBy === 'class' ? CLASS_COLORS[name] : '#c8b8e8', fontSize: 12 }}>
              {name}
            </span>
          )}
        />
        {keys.map(key => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={groupBy === 'class' ? CLASS_COLORS[key] : '#9b4cc4'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
