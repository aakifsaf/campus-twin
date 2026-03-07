import { useState, useEffect } from 'react'
import { 
  FiTrendingUp, FiActivity, FiBarChart2, FiAlertCircle, 
  FiSettings, FiSun, FiDroplet
} from 'react-icons/fi'
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import mlService from '../../services/mlService'

const AIPredictions = ({ selectedBuilding }) => {
  const [trendData, setTrendData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dataType, setDataType] = useState('energy')
  
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [peakForecast, setPeakForecast] = useState(null)

  useEffect(() => {
    if (selectedBuilding) {
      loadAllData()
    }
  }, [selectedBuilding, dataType])

  const loadAllData = async () => {
    setLoading(true)
    
    // Extract building ID safely
    const buildingId = selectedBuilding.building_id || selectedBuilding.id || 'building_1'

    try {
      // Execute all ML API calls concurrently for maximum speed
      const [trendRes, maintenanceRes, anomaliesRes] = await Promise.all([
        mlService.makePrediction(buildingId, dataType, 24, true),
        mlService.getPredictiveMaintenance(buildingId),
        mlService.getAnomalies(buildingId)
      ])

      // 1. Set Trend & Peak Load Data
      if (trendRes.chart_data) {
        setTrendData(trendRes.chart_data)
      }
      
      if (trendRes.peak_forecast) {
        // Map the string 'icon_type' from the backend to the actual React component
        const iconType = trendRes.peak_forecast.icon_type;
        const peakIcon = iconType === 'energy' 
          ? <FiSun className="text-yellow-400"/> 
          : <FiDroplet className="text-cyan-400"/>;
        
        setPeakForecast({ ...trendRes.peak_forecast, icon: peakIcon })
      } else {
        setPeakForecast(null)
      }

      // 2. Set Predictive Maintenance
      if (maintenanceRes.alerts) {
        setMaintenanceAlerts(maintenanceRes.alerts)
      }

      // 3. Set Anomaly Detection
      if (anomaliesRes.anomalies) {
        setAnomalies(anomaliesRes.anomalies)
      }

    } catch (error) {
      console.error("Error fetching AI insights:", error)
      // Note: mlService handles falling back to mock data, 
      // but we catch here just in case a larger network error occurs.
    } finally {
      setLoading(false)
    }
  }

  const getDataTypeLabel = (type) => {
    const labels = { energy: 'Energy Demand', water: 'Water Flow', occupancy: 'Foot Traffic' }
    return labels[type] || type
  }

  return (
    <div className="glass-card p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h3 className="text-xl font-bold flex items-center text-gray-100">
          <FiActivity className="mr-3 text-purple-500" />
          AI Forecast & Diagnostics
        </h3>
        {selectedBuilding ? (
          <span className="text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full">
            {selectedBuilding.name || selectedBuilding.building_id}
          </span>
        ) : (
          <span className="text-xs text-gray-500">No Building Selected</span>
        )}
      </div>

      {!selectedBuilding ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <FiBarChart2 className="text-4xl mx-auto mb-3 opacity-50" />
            <p>Select a building to view AI insights</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Controls & Peak Forecast Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Metric</label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 text-gray-200"
              >
                <option value="energy">Energy Consumption</option>
                <option value="water">Water Usage</option>
                <option value="occupancy">Occupancy</option>
              </select>
            </div>

            {/* Feature 1: Peak Load Forecasting */}
            {peakForecast && (
              <div className="md:col-span-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 p-4 rounded-xl border border-orange-500/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center">
                    <FiTrendingUp className="mr-2" /> Upcoming Peak Load
                  </h4>
                  <p className="text-xl font-bold text-white mt-1">{peakForecast.value} <span className="text-sm font-normal text-gray-400">at {peakForecast.time}</span></p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center">
                    {peakForecast.icon} <span className="ml-1.5">{peakForecast.reason}</span>
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <FiAlertCircle className="text-2xl text-orange-400" />
                </div>
              </div>
            )}
          </div>

          {/* Chart Area */}
          <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
            <h4 className="text-sm font-semibold text-gray-300 mb-4">24-Hour Predictive Model</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickMargin={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  <Area type="monotone" dataKey="predicted" name="AI Forecast" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorPredicted)" />
                  <Line type="monotone" dataKey="baseline" name="Historical Avg" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Diagnostics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Feature 2: Predictive Maintenance */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                <FiSettings className="mr-2" /> Predictive Maintenance
              </h4>
              <div className="space-y-3">
                {maintenanceAlerts.map(alert => (
                  <div key={alert.id} className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-bold text-gray-200">{alert.equipment}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                        alert.status === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        Fails in {alert.eta}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{alert.issue}</p>
                    
                    {/* Health Bar */}
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-gray-500 w-12">Health</span>
                      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${alert.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} 
                          style={{ width: `${alert.health}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">{alert.health}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature 3: Anomaly Detection */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                <FiActivity className="mr-2" /> Detected Anomalies
              </h4>
              <div className="space-y-3">
                {anomalies.map(anomaly => (
                  <div key={anomaly.id} className="bg-blue-500/5 p-3 rounded-lg border border-blue-500/20 border-l-2 border-l-blue-500">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-blue-400">{anomaly.event}</span>
                      <span className="text-[10px] font-mono text-gray-500">{anomaly.time}</span>
                    </div>
                    <p className="text-xs text-gray-300 mb-3">{anomaly.insight}</p>
                    <button className="text-xs w-full py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded transition-colors border border-blue-500/30">
                      {anomaly.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  )
}

export default AIPredictions