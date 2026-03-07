import { useState, useEffect } from 'react'
import { FiBarChart2, FiTrendingUp, FiTrendingDown, FiCalendar } from 'react-icons/fi'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { dataAPI } from '../../services/api'
const Dashboard = ({ stats }) => {
  const [timeRange, setTimeRange] = useState('24h')
  const [filterstats, setfilterStats] = useState(stats)
  
  const getHoursFromRange = (range) => {
    switch (range) {
      case '24h': return 24;
      case '7d': return 168; // 7 * 24
      case '30d': return 720; // 30 * 24
      default: return 24;
    }
  }
const fetchfilterData = async (currentRange) => {
      try {
        const hours = getHoursFromRange(currentRange);
        
        const data = await dataAPI.getBuildingStats({ hours }) 
        
        const buildings = data.buildings || data.data || [] 
        console.log("Filter data:",buildings)
        setfilterStats(buildings)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    
  useEffect(() => {
    fetchfilterData(timeRange)
  }, [timeRange])
  // Prepare chart data
  const energyData = filterstats.map(building => ({
    name: building.name || building.building_id,
    energy: building.avg_energy || 0,
    score: building.sustainability_score || 0,
    status: building.status
  })).sort((a, b) => b.energy - a.energy)

  const timeSeriesData = [
    { hour: '00:00', energy: 120, water: 300 },
    { hour: '04:00', energy: 80, water: 150 },
    { hour: '08:00', energy: 200, water: 450 },
    { hour: '12:00', energy: 220, water: 400 },
    { hour: '16:00', energy: 180, water: 350 },
    { hour: '20:00', energy: 150, water: 250 },
    { hour: '23:00', energy: 100, water: 200 },
  ]

  const statusDistribution = {
    good: filterstats.filter(b => b.status === 'good').length,
    warning: filterstats.filter(b => b.status === 'warning').length,
    critical: filterstats.filter(b => b.status === 'critical').length
  }

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="space-y-4">
        {/* Time Range Selector */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Campus Analytics Dashboard</h2>
          <div className="flex space-x-2">
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg text-sm ${timeRange === range ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg. Energy Consumption</p>
                <p className="text-2xl font-bold">
                  {Math.round(filterstats.reduce((sum, b) => sum + (b.avg_energy || 0), 0) / filterstats.length) || 0} kWh
                </p>
              </div>
              <FiTrendingDown className="text-red-500 text-2xl" />
            </div>
            <p className="text-green-400 text-sm mt-2">↓ 5% from last week</p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Peak Occupancy</p>
                <p className="text-2xl font-bold">
                  {Math.max(...filterstats.map(b => b.occupancy || 0))} people
                </p>
              </div>
              <FiTrendingUp className="text-green-500 text-2xl" />
            </div>
            <p className="text-yellow-400 text-sm mt-2">↑ 12% from last week</p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Carbon Footprint</p>
                <p className="text-2xl font-bold">
                  {Math.round(filterstats.reduce((sum, b) => sum + (b.avg_energy || 0) * 0.233, 0))} kg CO₂
                </p>
              </div>
              <FiBarChart2 className="text-blue-500 text-2xl" />
            </div>
            <p className="text-green-400 text-sm mt-2">↓ 8% from last month</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-2 gap-4">
          {/* Energy Consumption by Building */}
          <div className="glass-card p-4">
            <h3 className="font-semibold mb-4">Energy Consumption by Building</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={energyData.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }}
                    labelStyle={{ color: '#cbd5e1' }}
                  />
                  <Legend />
                  <Bar dataKey="energy" name="Energy (kWh)" fill="#3b82f6" />
                  <Bar dataKey="score" name="Score" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Pattern */}
          <div className="glass-card p-4">
            <h3 className="font-semibold mb-4">Daily Consumption Pattern</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hour" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }}
                    labelStyle={{ color: '#cbd5e1' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="energy" 
                    name="Energy (kWh)" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="water" 
                    name="Water (L)" 
                    stroke="#0ea5e9" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard