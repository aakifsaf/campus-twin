import { useState } from 'react'
import { FiZap, FiDroplet, FiUsers, FiThermometer, FiWind, FiSun } from 'react-icons/fi'

const MetricsPanel = () => {
  const [activeMetric, setActiveMetric] = useState('energy')
  
  const metrics = {
    energy: {
      icon: FiZap,
      name: 'Energy Consumption',
      unit: 'kWh',
      current: 15420,
      target: 12000,
      trend: 'down',
      change: -8.5,
      data: [200, 180, 220, 190, 210, 195, 205]
    },
    water: {
      icon: FiDroplet,
      name: 'Water Usage',
      unit: 'L',
      current: 45600,
      target: 40000,
      trend: 'up',
      change: 3.2,
      data: [400, 380, 420, 390, 410, 395, 405]
    },
    occupancy: {
      icon: FiUsers,
      name: 'Occupancy',
      unit: 'people',
      current: 1250,
      target: 1500,
      trend: 'stable',
      change: 0.5,
      data: [1200, 1250, 1300, 1220, 1280, 1240, 1260]
    },
    temperature: {
      icon: FiThermometer,
      name: 'Avg. Temperature',
      unit: '°C',
      current: 22.5,
      target: 21,
      trend: 'up',
      change: 1.5,
      data: [20, 21, 23, 22, 24, 23, 22]
    },
    co2: {
      icon: FiWind,
      name: 'CO2 Levels',
      unit: 'ppm',
      current: 650,
      target: 500,
      trend: 'down',
      change: -5.2,
      data: [700, 680, 650, 670, 640, 660, 650]
    }
  }

  const currentMetric = metrics[activeMetric]

  return (
    <div className="glass-card p-4">
      <h3 className="font-semibold mb-4">Detailed Metrics</h3>
      
      {/* Metric Selector */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {Object.entries(metrics).map(([key, metric]) => (
          <button
            key={key}
            onClick={() => setActiveMetric(key)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 whitespace-nowrap transition ${
              activeMetric === key 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            <metric.icon />
            <span>{metric.name}</span>
          </button>
        ))}
      </div>
      
      {/* Current Metric Details */}
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <currentMetric.icon className="text-2xl mr-3 text-blue-500" />
            <p className="text-3xl font-bold">
              {currentMetric.current.toLocaleString()} {currentMetric.unit}
            </p>
          </div>
          <p className="text-gray-400">Current {currentMetric.name.toLowerCase()}</p>
        </div>
        
        {/* Target Comparison */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Target: {currentMetric.target.toLocaleString()} {currentMetric.unit}</span>
            <span className={`${currentMetric.trend === 'down' ? 'text-green-500' : 'text-red-500'}`}>
              {currentMetric.trend === 'down' ? '↓' : '↑'} {Math.abs(currentMetric.change)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                currentMetric.current <= currentMetric.target ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ 
                width: `${Math.min(100, (currentMetric.current / currentMetric.target) * 100)}%` 
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span>
            <span>{currentMetric.target.toLocaleString()}</span>
            <span>{currentMetric.target * 2}</span>
          </div>
        </div>
        
        {/* Weekly Trend */}
        <div>
          <h4 className="font-medium mb-3">Weekly Trend</h4>
          <div className="h-24 flex items-end space-x-1">
            {currentMetric.data.map((value, index) => {
              const maxValue = Math.max(...currentMetric.data)
              const height = (value / maxValue) * 100
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className={`w-full rounded-t ${
                      currentMetric.trend === 'down' ? 'bg-green-500/70' :
                      currentMetric.trend === 'up' ? 'bg-red-500/70' :
                      'bg-yellow-500/70'
                    }`}
                    style={{ height: `${height}%` }}
                  ></div>
                  <span className="text-xs text-gray-400 mt-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Suggestions */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center">
            <FiSun className="mr-2 text-yellow-500" />
            Sustainability Tips
          </h4>
          <ul className="text-sm text-gray-300 space-y-2">
            {activeMetric === 'energy' && (
              <>
                <li>• Switch to LED lighting (Save up to 80% energy)</li>
                <li>• Install motion sensors in low-traffic areas</li>
                <li>• Optimize HVAC scheduling</li>
              </>
            )}
            {activeMetric === 'water' && (
              <>
                <li>• Install low-flow faucets and showerheads</li>
                <li>• Implement rainwater harvesting system</li>
                <li>• Fix leaks promptly</li>
              </>
            )}
            {activeMetric === 'co2' && (
              <>
                <li>• Increase indoor plants for natural air purification</li>
                <li>• Improve ventilation systems</li>
                <li>• Monitor high-traffic areas</li>
              </>
            )}
            <li className="pt-2 border-t border-gray-700">
              <button className="text-blue-400 hover:text-blue-300">
                View all recommendations →
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default MetricsPanel