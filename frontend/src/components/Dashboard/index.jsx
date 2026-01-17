import { useState } from 'react'
import { FiBarChart2, FiTrendingUp, FiTrendingDown, FiCalendar } from 'react-icons/fi'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const Dashboard = ({ stats }) => {
  const [timeRange, setTimeRange] = useState('24h')
  
  // Prepare chart data
  const energyData = stats.map(building => ({
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
    good: stats.filter(b => b.status === 'good').length,
    warning: stats.filter(b => b.status === 'warning').length,
    critical: stats.filter(b => b.status === 'critical').length
  }

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="space-y-4">
        {/* Time Range Selector */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Campus Analytics Dashboard</h2>
          <div className="flex space-x-2">
            {['24h', '7d', '30d', '90d'].map((range) => (
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
                  {Math.round(stats.reduce((sum, b) => sum + (b.avg_energy || 0), 0) / stats.length) || 0} kWh
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
                  {Math.max(...stats.map(b => b.occupancy || 0))} people
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
                  {Math.round(stats.reduce((sum, b) => sum + (b.avg_energy || 0) * 0.233, 0))} kg CO₂
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

        {/* Charts Row 2 */}
        <div className="grid grid-cols-3 gap-4">
          {/* Status Distribution */}
          <div className="glass-card p-4">
            <h3 className="font-semibold mb-4">Building Status Distribution</h3>
            <div className="h-48 flex items-center justify-center">
              <div className="relative w-32 h-32">
                {/* Pie chart simulation */}
                <div className="absolute inset-0 rounded-full border-8 border-green-500"
                  style={{ clipPath: `circle(50% at 50% 50%)` }}>
                </div>
                <div className="absolute inset-0 rounded-full border-8 border-yellow-500"
                  style={{ 
                    clipPath: `circle(50% at 50% 50%)`,
                    transform: `rotate(${statusDistribution.good / stats.length * 360}deg)`
                  }}>
                </div>
                <div className="absolute inset-0 rounded-full border-8 border-red-500"
                  style={{ 
                    clipPath: `circle(50% at 50% 50%)`,
                    transform: `rotate(${(statusDistribution.good + statusDistribution.warning) / stats.length * 360}deg)`
                  }}>
                </div>
              </div>
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              <div className="text-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mx-auto mb-1"></div>
                <span className="text-sm">Good</span>
                <p className="font-bold">{statusDistribution.good}</p>
              </div>
              <div className="text-center">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mx-auto mb-1"></div>
                <span className="text-sm">Warning</span>
                <p className="font-bold">{statusDistribution.warning}</p>
              </div>
              <div className="text-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mx-auto mb-1"></div>
                <span className="text-sm">Critical</span>
                <p className="font-bold">{statusDistribution.critical}</p>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="glass-card p-4 col-span-2">
            <h3 className="font-semibold mb-4">Top Performing Buildings</h3>
            <div className="space-y-3">
              {stats
                .sort((a, b) => (b.sustainability_score || 0) - (a.sustainability_score || 0))
                .slice(0, 5)
                .map((building, index) => (
                  <div key={building.building_id} className="flex items-center justify-between p-3 hover:bg-gray-800/50 rounded">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded flex items-center justify-center mr-3 ${
                        index === 0 ? 'bg-yellow-500/20' :
                        index === 1 ? 'bg-gray-500/20' :
                        index === 2 ? 'bg-orange-500/20' :
                        'bg-gray-700/20'
                      }`}>
                        <span className={`font-bold ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          index === 2 ? 'text-orange-500' :
                          'text-gray-500'
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{building.name || building.building_id}</p>
                        <p className="text-sm text-gray-400">
                          Energy: {building.avg_energy?.toFixed(1)} kWh
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${
                        building.status === 'good' ? 'text-green-500' :
                        building.status === 'warning' ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {building.sustainability_score || 0}
                      </p>
                      <p className="text-xs text-gray-400">Score</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard