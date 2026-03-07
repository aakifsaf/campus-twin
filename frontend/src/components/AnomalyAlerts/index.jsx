import { useState, useEffect } from 'react'
import { 
  FiAlertTriangle, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiBell, 
  FiX, 
  FiCheck, 
  FiChevronDown, 
  FiChevronUp,
  FiActivity
} from 'react-icons/fi'
import webSocketService from '../../services/websocket'

const AnomalyAlerts = ({ buildings }) => {
  const [alerts, setAlerts] = useState([])
  const [expanded, setExpanded] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    // Subscribe to WebSocket anomaly alerts
    const unsubscribe = webSocketService.subscribe('anomaly', (data) => {
      addAlert({
        id: Date.now(),
        type: 'realtime',
        severity: data.severity > 70 ? 'critical' : data.severity > 40 ? 'warning' : 'info',
        building: data.building_id,
        data_type: data.data_type,
        message: data.description,
        value: data.value,
        timestamp: new Date().toISOString(),
        acknowledged: false
      })
    })

    loadHistoricalAlerts()

    return () => {
      unsubscribe()
    }
  }, [])

  const loadHistoricalAlerts = async () => {
    // Mock historical alerts
    const mockAlerts = [
      {
        id: 1,
        type: 'energy',
        severity: 'critical',
        building: 'building_1',
        data_type: 'energy',
        message: 'Energy spike detected: 250% above historical average.',
        value: 450,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        acknowledged: false
      },
      {
        id: 2,
        type: 'water',
        severity: 'warning',
        building: 'building_3',
        data_type: 'water',
        message: 'Unusual continuous water flow pattern detected.',
        value: 620,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        acknowledged: false
      },
      {
        id: 3,
        type: 'occupancy',
        severity: 'info',
        building: 'building_5',
        data_type: 'occupancy',
        message: 'Occupancy levels significantly below baseline.',
        value: 25,
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        acknowledged: true
      }
    ]
    setAlerts(mockAlerts)
  }

  const addAlert = (alert) => {
    setAlerts(prev => [alert, ...prev.slice(0, 49)])
  }

  const acknowledgeAlert = (id) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, acknowledged: true } : alert
      )
    )
  }

  const dismissAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

  const getSeverityConfig = (severity, acknowledged) => {
    const opacity = acknowledged ? 'opacity-50 grayscale hover:grayscale-0' : 'opacity-100';
    
    switch(severity) {
      case 'critical': 
        return {
          icon: <FiAlertTriangle className="text-red-400" />,
          cardClass: `bg-red-500/5 border border-red-500/20 border-l-4 border-l-red-500 hover:bg-red-500/10 ${opacity}`,
          textClass: 'text-red-400',
          badgeClass: 'bg-red-500/20 text-red-300'
        }
      case 'warning': 
        return {
          icon: <FiAlertCircle className="text-amber-400" />,
          cardClass: `bg-amber-500/5 border border-amber-500/20 border-l-4 border-l-amber-500 hover:bg-amber-500/10 ${opacity}`,
          textClass: 'text-amber-400',
          badgeClass: 'bg-amber-500/20 text-amber-300'
        }
      case 'info': 
        return {
          icon: <FiActivity className="text-blue-400" />,
          cardClass: `bg-blue-500/5 border border-blue-500/20 border-l-4 border-l-blue-500 hover:bg-blue-500/10 ${opacity}`,
          textClass: 'text-blue-400',
          badgeClass: 'bg-blue-500/20 text-blue-300'
        }
      default: 
        return {
          icon: <FiBell className="text-gray-400" />,
          cardClass: `bg-gray-800 border border-gray-700 hover:bg-gray-700 ${opacity}`,
          textClass: 'text-gray-400',
          badgeClass: 'bg-gray-700 text-gray-300'
        }
    }
  }

  const getBuildingName = (buildingId) => {
    const building = buildings?.find(b => b.building_id === buildingId)
    return building?.name || buildingId.replace('_', ' ').toUpperCase()
  }

  const formatValue = (value, dataType) => {
    const units = { energy: 'kWh', water: 'L', occupancy: 'ppl', temperature: '°C', co2: 'ppm' }
    return `${value?.toFixed(0) || '0'} ${units[dataType] || ''}`
  }

  // Derived state for counts
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length
  const warningCount = alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length

  const filteredAlerts = alerts.filter(alert => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'unacknowledged') return !alert.acknowledged
    return alert.severity === activeFilter
  })

  return (
    <div className="bg-gray-900/60 backdrop-blur-md border border-gray-700/50 rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 flex items-center justify-between bg-gray-800/30">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <FiBell className="text-xl text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-100 tracking-wide">System Alerts</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              {unacknowledgedCount} Actionable Event{unacknowledgedCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Header Badges */}
          {(criticalCount > 0 || warningCount > 0) && (
            <div className="flex space-x-2">
              {criticalCount > 0 && (
                <span className="flex items-center px-2 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded-md text-xs font-semibold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5"></span>
                  {criticalCount} Critical
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center px-2 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-md text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>
                  {warningCount} Warning
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pt-4 pb-2 flex space-x-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'all', label: 'All', count: alerts.length },
          { id: 'unacknowledged', label: 'Unread', count: unacknowledgedCount },
          { id: 'critical', label: 'Critical', count: alerts.filter(a => a.severity === 'critical').length },
          { id: 'warning', label: 'Warning', count: alerts.filter(a => a.severity === 'warning').length }
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`whitespace-nowrap flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeFilter === filter.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }`}
          >
            {filter.label}
            <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${
              activeFilter === filter.id ? 'bg-white/20' : 'bg-gray-900'
            }`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className={`p-4 space-y-3 overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out ${
        expanded ? 'max-h-[500px]' : 'max-h-[280px]'
      }`}>
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <FiCheckCircle className="text-3xl text-emerald-500" />
            </div>
            <p className="text-gray-200 font-medium">All systems operational</p>
            <p className="text-xs text-gray-500 mt-1">No {activeFilter !== 'all' ? activeFilter : ''} anomalies detected.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const config = getSeverityConfig(alert.severity, alert.acknowledged);
            
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl shadow-sm transition-all duration-300 ${config.cardClass}`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className={`mt-0.5 text-lg ${alert.acknowledged ? 'text-gray-500' : ''}`}>
                    {config.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold text-sm ${alert.acknowledged ? 'text-gray-400' : 'text-gray-200'}`}>
                          {getBuildingName(alert.building)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${config.badgeClass}`}>
                          {alert.data_type}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <p className={`text-xs mb-3 ${alert.acknowledged ? 'text-gray-500' : 'text-gray-300'}`}>
                      {alert.message}
                    </p>
                    
                    {/* Bottom Row: Value & Actions */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/30">
                      <div className="text-xs text-gray-400">
                        Recorded Value: <span className="font-mono font-bold text-gray-200">{formatValue(alert.value, alert.data_type)}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        {!alert.acknowledged ? (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="flex items-center space-x-1 px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/20 rounded-md text-xs transition-colors"
                          >
                            <FiCheck /> <span>Acknowledge</span>
                          </button>
                        ) : (
                          <span className="flex items-center text-[10px] text-gray-500 uppercase tracking-wider px-2">
                            <FiCheckCircle className="mr-1" /> Acknowledged
                          </span>
                        )}
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Dismiss"
                        >
                          <FiX />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-700/50 bg-gray-800/30 flex justify-between items-center">
        <button
          onClick={() => {
            setAlerts(prev => prev.map(alert => ({ ...alert, acknowledged: true })))
          }}
          disabled={unacknowledgedCount === 0}
          className={`text-xs font-medium transition-colors ${
            unacknowledgedCount === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'
          }`}
        >
          Acknowledge All
        </button>
        <button
          onClick={() => alert('Manual ML anomaly check initiated')}
          className="flex items-center space-x-2 text-xs font-bold px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg shadow-lg shadow-purple-500/20 transition-all active:scale-95"
        >
          <FiActivity />
          <span>Run AI Diagnostic</span>
        </button>
      </div>
    </div>
  )
}

export default AnomalyAlerts