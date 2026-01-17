import { useState, useEffect } from 'react'
import { FiTrendingUp, FiTrendingDown, FiActivity, FiCalendar, FiBarChart2 } from 'react-icons/fi'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import mlService from '../../services/mlService'

const TrendPredictor = ({ selectedBuilding }) => {
  const [trendData, setTrendData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dataType, setDataType] = useState('energy')
  const [days, setDays] = useState(30)

  useEffect(() => {
    if (selectedBuilding) {
      loadTrendData()
    }
  }, [selectedBuilding, dataType, days])

  const loadTrendData = async () => {
    if (!selectedBuilding) return

    setLoading(true)
    try {
      const response = await mlService.predictTrend(
        selectedBuilding.building_id || selectedBuilding.id,
        dataType,
        days
      )
      setTrendData(response)
    } catch (error) {
      console.error('Error loading trend data:', error)
      // Use mock data
      setTrendData(mlService.generateMockTrend(
        selectedBuilding.building_id,
        dataType,
        days
      ))
    } finally {
      setLoading(false)
    }
  }

  const prepareChartData = () => {
    if (!trendData?.predictions) return []

    return trendData.predictions.map(pred => ({
      day: `Day ${pred.day}`,
      predicted: pred.value,
      change: pred.change_percentage
    }))
  }

  const getTrendIcon = () => {
    if (!trendData) return null
    
    switch(trendData.trend) {
      case 'increasing':
        return <FiTrendingUp className="text-red-500" />
      case 'decreasing':
        return <FiTrendingDown className="text-green-500" />
      default:
        return <FiActivity className="text-blue-500" />
    }
  }

  const getTrendColor = () => {
    if (!trendData) return 'text-gray-400'
    
    switch(trendData.trend) {
      case 'increasing':
        return trendData.severity === 'high' ? 'text-red-500' : 'text-yellow-500'
      case 'decreasing':
        return 'text-green-500'
      default:
        return 'text-blue-500'
    }
  }

  const getDataTypeLabel = (type) => {
    const labels = {
      energy: 'Energy Consumption',
      water: 'Water Usage',
      occupancy: 'Occupancy'
    }
    return labels[type] || type
  }

  const chartData = prepareChartData()

  return (
    <div className="glass-card p-6 h-120 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center">
          <FiTrendingUp className="mr-3 text-purple-500" />
          Trend Predictor
        </h3>
        {selectedBuilding && (
          <span className="text-sm bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
            {selectedBuilding.name || selectedBuilding.building_id}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Data Type</label>
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="energy">Energy Consumption</option>
            <option value="water">Water Usage</option>
            <option value="occupancy">Occupancy</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-2">History (Days)</label>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value={7}>7 Days</option>
            <option value={30}>30 Days</option>
            <option value={90}>90 Days</option>
          </select>
        </div>
      </div>

      {/* Current Status */}
      {trendData && (
        <div className="mb-6">
          <div className={`p-4 rounded-lg ${getTrendColor().replace('text', 'bg')}/20 border ${getTrendColor().replace('text', 'border')}/30`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="text-2xl mr-3">
                  {getTrendIcon()}
                </div>
                <div>
                  <h4 className="font-semibold capitalize">
                    {trendData.trend} Trend ({trendData.severity})
                  </h4>
                  <p className="text-sm text-gray-400">
                    {getDataTypeLabel(dataType)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{trendData.current_value?.toFixed(1)}</p>
                <p className="text-sm text-gray-400">Current</p>
              </div>
            </div>
            
            <div className="mt-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">Confidence</span>
                <span className="font-semibold">{(trendData.r_squared * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500"
                  style={{ width: `${trendData.r_squared * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="flex-1 mb-6">
        <h4 className="text-sm font-semibold text-gray-400 mb-4">7-Day Forecast</h4>
        <div className="h-64">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                <p className="text-gray-400">Analyzing trends...</p>
              </div>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="day" 
                  stroke="#94a3b8" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="#94a3b8"
                  label={{ 
                    value: dataType === 'energy' ? 'kWh' : dataType === 'water' ? 'L' : 'People',
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: '#94a3b8' }
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderColor: '#475569',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [value.toFixed(1), 'Value']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  name="Predicted" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="change" 
                  name="Change %" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FiBarChart2 className="text-3xl mx-auto mb-3" />
                <p>No trend data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {trendData?.recommendation && (
        <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
          <h5 className="text-sm font-semibold text-blue-300 mb-2 flex items-center">
            <FiCalendar className="mr-2" />
            Recommendation
          </h5>
          <p className="text-sm text-gray-300">{trendData.recommendation}</p>
          
          <div className="mt-3 flex space-x-3">
            <button className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded">
              Schedule Audit
            </button>
            <button className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded">
              View Details
            </button>
          </div>
        </div>
      )}

      {!selectedBuilding && !loading && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <FiTrendingUp className="text-3xl mx-auto mb-3" />
            <p>Select a building to analyze trends</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrendPredictor