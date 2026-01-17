import { useState, useEffect } from 'react'
import { FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiBell, FiX } from 'react-icons/fi'
import webSocketService from '../../services/websocket'
import mlService from '../../services/mlService'

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

    // Load historical anomalies
    loadHistoricalAlerts()

    return () => {
      unsubscribe()
    }
  }, [])

  const loadHistoricalAlerts = async () => {
    // Mock historical alerts - in real app, fetch from API
    const mockAlerts = [
      {
        id: 1,
        type: 'energy',
        severity: 'critical',
        building: 'building_1',
        data_type: 'energy',
        message: 'Energy spike detected: 450 kWh (250% above average)',
        value: 450,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        acknowledged: true
      },
      {
        id: 2,
        type: 'water',
        severity: 'warning',
        building: 'building_3',
        data_type: 'water',
        message: 'Unusual water flow pattern detected',
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
        message: 'Low occupancy during peak hours',
        value: 25,
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        acknowledged: true
      }
    ]

    setAlerts(mockAlerts)
  }

  const addAlert = (alert) => {
    setAlerts(prev => [alert, ...prev.slice(0, 49)]) // Keep max 50 alerts
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

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'critical': return <FiAlertTriangle className="text-red-500" />
      case 'warning': return <FiAlertCircle className="text-yellow-500" />
      case 'info': return <FiCheckCircle className="text-blue-500" />
      default: return <FiBell />
    }
  }

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'bg-red-500/20 border-red-500/30'
      case 'warning': return 'bg-yellow-500/20 border-yellow-500/30'
      case 'info': return 'bg-blue-500/20 border-blue-500/30'
      default: return 'bg-gray-500/20 border-gray-500/30'
    }
  }

  const getBuildingName = (buildingId) => {
    const building = buildings.find(b => b.building_id === buildingId)
    return building?.name || buildingId
  }

  const formatValue = (value, dataType) => {
    const units = {
      energy: 'kWh',
      water: 'L',
      occupancy: 'people',
      temperature: '°C',
      co2: 'ppm'
    }
    return `${value?.toFixed(1) || 'N/A'} ${units[dataType] || ''}`
  }

  const filteredAlerts = alerts.filter(alert => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'unacknowledged') return !alert.acknowledged
    return alert.severity === activeFilter
  })

  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length
  const warningCount = alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FiBell className="text-xl text-purple-500 mr-2" />
          <h3 className="font-semibold">Anomaly Alerts</h3>
          {(criticalCount > 0 || warningCount > 0) && (
            <div className="ml-3 flex space-x-2">
              {criticalCount > 0 && (
                <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs">
                  {criticalCount} Critical
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">
                  {warningCount} Warning
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-gray-400 hover:text-white"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-4">
        {['all', 'critical', 'warning', 'info', 'unacknowledged'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1 rounded-full text-sm capitalize ${
              activeFilter === filter
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className={`space-y-3 ${expanded ? 'max-h-96' : 'max-h-64'} overflow-y-auto`}>
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiCheckCircle className="text-3xl mx-auto mb-3 text-green-500" />
            <p>No alerts found</p>
            <p className="text-sm mt-1">All systems operating normally</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)} ${
                alert.acknowledged ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="mt-1 mr-3">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="font-medium text-sm">
                        {getBuildingName(alert.building)}
                      </span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-xs text-gray-400 capitalize">
                        {alert.data_type}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{alert.message}</p>
                    <div className="flex items-center text-xs text-gray-400">
                      <span className="mr-4">
                        Value: <span className="font-semibold">{formatValue(alert.value, alert.data_type)}</span>
                      </span>
                      <span>
                        {new Date(alert.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-2">
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded"
                    >
                      Ack
                    </button>
                  )}
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-gray-400 hover:text-white"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-4 pt-4 border-t border-gray-700">
        <button
          onClick={() => {
            setAlerts(prev => prev.map(alert => ({ ...alert, acknowledged: true })))
          }}
          className="text-sm text-gray-400 hover:text-white"
        >
          Acknowledge All
        </button>
        <button
          onClick={() => {
            // In real app, this would trigger anomaly detection
            alert('Manual anomaly check initiated')
          }}
          className="text-sm px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded"
        >
          Run Detection
        </button>
      </div>
    </div>
  )
}

export default AnomalyAlerts