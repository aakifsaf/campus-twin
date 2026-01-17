import { useState, useEffect } from 'react'
import { FiSun, FiZap, FiDroplet, FiTrendingUp, FiDollarSign, FiWind } from 'react-icons/fi'
import { FaCalculator } from "react-icons/fa";
import { WHAT_IF_SCENARIOS } from '../../utils/constants'
import mlService from '../../services/mlService'

const WhatIfSimulator = ({ selectedBuilding }) => {
  const [activeScenario, setActiveScenario] = useState('solar_panels')
  const [parameters, setParameters] = useState({})
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [comparisonData, setComparisonData] = useState([])

  useEffect(() => {
    // Initialize parameters based on scenario
    initializeParameters()
    // Load historical comparison data
    loadComparisonData()
  }, [activeScenario])

  const initializeParameters = () => {
    const scenarioConfig = WHAT_IF_SCENARIOS[activeScenario]
    if (scenarioConfig) {
      const initialParams = {}
      Object.entries(scenarioConfig.parameters).forEach(([key, config]) => {
        initialParams[key] = config.default
      })
      setParameters(initialParams)
    }
  }

  const loadComparisonData = async () => {
    // Mock comparison data - in real app, fetch from API
    const mockData = [
      { label: 'Current', value: 100, color: '#3b82f6' },
      { label: 'Efficient', value: 70, color: '#10b981' },
      { label: 'Green Certified', value: 50, color: '#06b6d4' }
    ]
    setComparisonData(mockData)
  }

  const handleParameterChange = (param, value) => {
    setParameters(prev => ({
      ...prev,
      [param]: parseFloat(value) || 0
    }))
  }

  const runSimulation = async () => {
    if (!selectedBuilding) {
      alert('Please select a building first')
      return
    }

    setLoading(true)
    try {
      const response = await mlService.whatIfAnalysis(
        selectedBuilding.building_id || selectedBuilding.id,
        activeScenario,
        parameters
      )
      setResults(response)
    } catch (error) {
      console.error('Simulation error:', error)
      alert('Failed to run simulation. Using mock data.')
      setResults(mlService.generateMockWhatIf(
        selectedBuilding.building_id,
        activeScenario,
        parameters
      ))
    } finally {
      setLoading(false)
    }
  }

  const getScenarioIcon = (scenario) => {
    switch(scenario) {
      case 'solar_panels': return <FiSun className="text-yellow-500" />
      case 'led_lights': return <FiZap className="text-blue-500" />
      case 'water_recycling': return <FiDroplet className="text-cyan-500" />
      default: return <FaCalculator />
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toFixed(1)
  }

  const scenarioConfig = WHAT_IF_SCENARIOS[activeScenario]

  return (
    <div className="glass-card p-6 h-120 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center">
          <FaCalculator className="mr-3 text-purple-500" />
          What-If Simulator
        </h3>
        {selectedBuilding && (
          <span className="text-sm bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
            {selectedBuilding.name || selectedBuilding.building_id}
          </span>
        )}
      </div>

      {/* Scenario Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-400 mb-3">Select Scenario</h4>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(WHAT_IF_SCENARIOS).map(([key, scenario]) => (
            <button
              key={key}
              onClick={() => setActiveScenario(key)}
              className={`p-4 rounded-lg flex flex-col items-center justify-center transition ${
                activeScenario === key 
                  ? 'bg-blue-600 border-2 border-blue-500' 
                  : 'bg-gray-800 hover:bg-gray-700 border-2 border-transparent'
              }`}
            >
              <div className="text-2xl mb-2">
                {getScenarioIcon(key)}
              </div>
              <span className="text-sm font-medium">{scenario.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Description */}
      {scenarioConfig && (
        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
          <p className="text-gray-300 text-sm">{scenarioConfig.description}</p>
        </div>
      )}

      {/* Parameters */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-400 mb-3">Adjust Parameters</h4>
        <div className="space-y-4">
          {scenarioConfig && Object.entries(scenarioConfig.parameters).map(([param, config]) => (
            <div key={param}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300 capitalize">{param.replace('_', ' ')}</span>
                <span className="text-blue-400">{parameters[param]} {config.unit}</span>
              </div>
              <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.max <= 1 ? 0.01 : config.max <= 100 ? 1 : 10}
                value={parameters[param] || config.default}
                onChange={(e) => handleParameterChange(param, e.target.value)}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{config.min}{config.unit}</span>
                <span>{config.max}{config.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Run Simulation Button */}
      <button
        onClick={runSimulation}
        disabled={!selectedBuilding || loading}
        className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center mb-6 ${
          !selectedBuilding || loading
            ? 'bg-gray-700 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
        }`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Running Simulation...
          </>
        ) : (
          <>
            <FaCalculator className="mr-2" />
            Run Simulation
          </>
        )}
      </button>

      {/* Results */}
      {results && (
        <div className="flex-1 overflow-y-auto">
          <h4 className="text-sm font-semibold text-gray-400 mb-4">Simulation Results</h4>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FiTrendingUp className="text-green-500 mr-2" />
                <span className="text-sm text-gray-400">Savings</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {results.savings_percentage?.toFixed(1)}%
              </p>
            </div>
            
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FiDollarSign className="text-yellow-500 mr-2" />
                <span className="text-sm text-gray-400">Yearly Savings</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">
                ${formatNumber(results.cost_savings)}
              </p>
            </div>
            
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FiWind className="text-cyan-500 mr-2" />
                <span className="text-sm text-gray-400">CO2 Reduction</span>
              </div>
              <p className="text-2xl font-bold text-cyan-400">
                {formatNumber(results.co2_reduction_kg)} kg
              </p>
            </div>
            
            {results.payback_period_years && (
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <FaCalculator className="text-purple-500 mr-2" />
                  <span className="text-sm text-gray-400">Payback Period</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">
                  {results.payback_period_years} years
                </p>
              </div>
            )}
          </div>

          {/* Consumption Comparison */}
          <div className="mb-6">
            <h5 className="text-sm font-semibold text-gray-400 mb-3">Consumption Comparison</h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Current</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden mr-3">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                  <span className="font-bold">{results.current_consumption?.toFixed(0)} kWh</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Projected</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden mr-3">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${100 - (results.savings_percentage || 0)}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-green-400">
                    {results.projected_consumption?.toFixed(0)} kWh
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
            <h5 className="text-sm font-semibold text-blue-300 mb-2">Recommendation</h5>
            <p className="text-sm text-gray-300">
              This {activeScenario.replace('_', ' ')} scenario shows significant potential for 
              sustainability improvement. The {results.payback_period_years ? `${results.payback_period_years}-year ` : ''}
              payback period makes this a viable investment.
            </p>
            <button className="mt-3 text-sm text-blue-400 hover:text-blue-300">
              Generate Detailed Report →
            </button>
          </div>
        </div>
      )}

      {!results && (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          <div className="text-center">
            <FaCalculator className="text-3xl mx-auto mb-3" />
            <p>Run simulation to see results</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default WhatIfSimulator