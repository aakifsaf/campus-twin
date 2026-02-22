import { useState, useEffect } from 'react'
import { FiActivity, FiZap, FiDroplet, FiUsers, FiThermometer, FiWind } from 'react-icons/fi'
import { TbBuildingSkyscraper } from 'react-icons/tb'
import Header from './components/common/Header'
import Sidebar from './components/common/Sidebar'
import CampusScene from './components/CampusScene'
import Dashboard from './components/Dashboard'
import Leaderboard from './components/Dashboard/Leaderboard'
import MetricsPanel from './components/Dashboard/MetricsPanel'
import { dataAPI } from './services/api'
import webSocketService from './services/websocket'
import { STATUS_COLORS, DATA_TYPES } from './utils/constants'
import WhatIfSimulator from './components/WhatIfSimulator'
import AnomalyAlerts from './components/AnomalyAlerts'
import TrendPredictor from './components/TrendPredictor'
import mlService from './services/mlService'

function App() {
  const [stats, setStats] = useState([])
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [mlStatus, setMlStatus] = useState({})
  const [activeView, setActiveView] = useState('dashboard') // 'dashboard' or '3d'
  const [campusMetrics, setCampusMetrics] = useState({
    totalEnergy: 0,
    totalWater: 0,
    avgScore: 0,
    buildingCount: 0
  })

  useEffect(() => {
    // Initialize WebSocket connection
    webSocketService.connect()
    
    // Subscribe to WebSocket updates
    const unsubscribe = webSocketService.subscribe('stats_update', (data) => {
      const buildings = Object.values(data.buildings || {})
      setStats(buildings)
      calculateCampusMetrics(buildings)
      setConnected(true)
    })
    
    // Subscribe to connection status
    webSocketService.subscribe('connection', (data) => {
      setConnected(data.status === 'connected')
    })
    
    // Subscribe to building selection from 3D view
    webSocketService.subscribe('building_selected', (data) => {
      setSelectedBuilding(data)
    })
    
    // Fetch initial data
    fetchData()
    
    return () => {
      unsubscribe()
      webSocketService.disconnect()
    }
  }, [])

  useEffect(() => {
  const fetchMlStatus = async () => {
    try {
      const status = await mlService.getModelStatus()
      setMlStatus(status)
    } catch (error) {
      console.error('Error fetching ML status:', error)
    }
  }
  fetchMlStatus()
}, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await dataAPI.getBuildingStats()
      const buildings = data.buildings || []
      setStats(buildings)
      calculateCampusMetrics(buildings)
    } catch (error) {
      console.error('Error fetching data:', error)
      // Use mock data as fallback
      const mockData = generateMockData()
      setStats(mockData)
      calculateCampusMetrics(mockData)
    } finally {
      setLoading(false)
    }
  }

  const calculateCampusMetrics = (buildings) => {
    const totalEnergy = buildings.reduce((sum, b) => sum + (b.avg_energy || 0), 0)
    const totalWater = buildings.reduce((sum, b) => sum + (b.water_usage || 0), 0)
    const avgScore = buildings.reduce((sum, b) => sum + (b.sustainability_score || 0), 0) / buildings.length
    const buildingCount = buildings.length
    
    setCampusMetrics({
      totalEnergy: Math.round(totalEnergy),
      totalWater: Math.round(totalWater),
      avgScore: Math.round(avgScore),
      buildingCount
    })
  }

  const generateMockData = () => {
    const buildings = []
    for (let i = 1; i <= 10; i++) {
      const score = Math.random() * 100
      buildings.push({
        building_id: `building_${i}`,
        name: `Building ${i}`,
        avg_energy: 50 + Math.random() * 150,
        sustainability_score: Math.round(score),
        status: score > 70 ? 'good' : score > 40 ? 'warning' : 'critical',
        water_usage: 200 + Math.random() * 300,
        occupancy: Math.floor(Math.random() * 200),
        co2_levels: 400 + Math.random() * 400,
        temperature: 20 + Math.random() * 8
      })
    }
    return buildings
  }

  const startSimulation = async () => {
    try {
      await dataAPI.startSimulation(5, 2)
      alert('Simulation started for 5 minutes! Real-time data will flow.')
    } catch (error) {
      console.error('Error starting simulation:', error)
      alert('Failed to start simulation. Check backend connection.')
    }
  }

  const handleBuildingSelect = (building) => {
    setSelectedBuilding(building)
    // Send WebSocket message
    webSocketService.send({
      type: 'building_selected',
      building_id: building.building_id
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin-slow rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-200 mb-2">Initializing Digital Twin</h2>
          <p className="text-gray-400">Loading campus sustainability data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <Header 
        connected={connected}
        onSimulate={startSimulation}
        activeView={activeView}
        onViewChange={setActiveView}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          stats={stats}
          selectedBuilding={selectedBuilding}
          onBuildingSelect={handleBuildingSelect}
        />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Campus Metrics Quick View */}
          <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-700">
            <div className="glass-card p-4">
              <div className="flex items-center">
                <FiZap className="text-yellow-500 text-xl mr-3" />
                <div>
                  <p className="text-gray-400 text-sm">Energy Usage</p>
                  <p className="text-xl font-bold">{campusMetrics.totalEnergy} kWh</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4">
              <div className="flex items-center">
                <FiDroplet className="text-blue-500 text-xl mr-3" />
                <div>
                  <p className="text-gray-400 text-sm">Water Usage</p>
                  <p className="text-xl font-bold">{campusMetrics.totalWater} L</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4">
              <div className="flex items-center">
                <FiActivity className="text-green-500 text-xl mr-3" />
                <div>
                  <p className="text-gray-400 text-sm">Avg. Score</p>
                  <p className="text-xl font-bold">{campusMetrics.avgScore}/100</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4">
              <div className="flex items-center">
                <TbBuildingSkyscraper className="text-purple-500 text-xl mr-3" />
                <div>
                  <p className="text-gray-400 text-sm">Buildings</p>
                  <p className="text-xl font-bold">{campusMetrics.buildingCount}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main View Area */}
          <div className="flex-1 overflow-hidden p-4">
            {activeView === '3d' ? (
              <div className="h-full rounded-xl overflow-hidden border border-gray-700">
                <CampusScene 
                  buildings={stats}
                  onBuildingSelect={handleBuildingSelect}
                  selectedBuilding={selectedBuilding}
                />
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* Selected Building Info */}
                {selectedBuilding && (
                  <div className="glass-card p-4 mb-4">
                    <h3 className="text-lg font-semibold mb-2">Selected Building: {selectedBuilding.name || selectedBuilding.building_id}</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-gray-400">Sustainability Score</p>
                        <p className={`text-2xl font-bold ${selectedBuilding.status === 'good' ? 'text-green-500' : selectedBuilding.status === 'warning' ? 'text-yellow-500' : 'text-red-500'}`}>
                          {selectedBuilding.sustainability_score}/100
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400">Energy Usage</p>
                        <p className="text-2xl font-bold">{selectedBuilding.avg_energy?.toFixed(1)} kWh</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400">Occupancy</p>
                        <p className="text-2xl font-bold">{selectedBuilding.occupancy || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400">Status</p>
                        <span className={`px-3 py-1 rounded-full text-sm ${selectedBuilding.status === 'good' ? 'bg-green-500/20 text-green-300' : selectedBuilding.status === 'warning' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                          {selectedBuilding.status || 'unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Dashboard Grid */}
                <div className="h-full flex flex-col">
                  {/* Add tabs */}
                  <div className="flex space-x-1 border-b border-gray-700 mb-4">
                    {['overview', 'predictions', 'what-if'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium capitalize ${
                          activeTab === tab
                            ? 'border-b-2 border-blue-500 text-blue-400'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  {activeTab === 'overview' && (
                    <div className={`flex-1 grid grid-cols-3 gap-4 overflow-hidden ${selectedBuilding? 'mb-32': 'mb-0'}`}>
                      <div className="col-span-2 overflow-y-auto">
                        <Dashboard stats={stats} />
                      </div>
                      <div className="space-y-4 overflow-y-auto">
                        <Leaderboard stats={stats} />
                        <AnomalyAlerts buildings={stats} />
                      </div>
                    </div>
                  )}

                  {activeTab === 'predictions' && (
                    <div className={`flex-1 grid grid-cols-3 gap-4 overflow-hidden ${selectedBuilding? 'mb-32': 'mb-0'}`}>
                      <div className="col-span-2 overflow-y-auto">
                        <TrendPredictor selectedBuilding={selectedBuilding} />
                      </div>
                      <div className="space-y-4 overflow-y-auto">
                        <MetricsPanel />
                        {/* Add prediction controls here */}
                      </div>
                    </div>
                  )}

                  {activeTab === 'what-if' && (
                    <div className={`flex-1 overflow-y-auto ${selectedBuilding? 'mb-32': 'mb-0'}`}>
                      <WhatIfSimulator selectedBuilding={selectedBuilding} />
                    </div>
                  )}

                  {activeTab === 'analytics' && (
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      {/* Advanced analytics components */}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Connection Status */}
      <div className={`px-4 py-2 text-sm ${connected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
        <div className="flex items-center justify-between">
          <span>
            {connected ? '✅ Connected to real-time data stream' : '⚠️ Disconnected - Using mock data'}
          </span>
          <button 
            onClick={fetchData}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  )
}

export default App