import { FiSearch, FiFilter, FiX } from 'react-icons/fi' 
import { TbBuilding } from 'react-icons/tb'

const Sidebar = ({ stats, selectedBuilding, onBuildingSelect }) => {
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'good': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status) => {
    switch(status) {
      case 'good': return 'Good'
      case 'warning': return 'Warning'
      case 'critical': return 'Critical'
      default: return 'Unknown'
    }
  }

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
      {/* Search and Filter */}
      <div className="p-4 border-b border-gray-700 shrink-0">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search buildings..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-200 placeholder-gray-500"
          />
        </div>
        <button className="mt-3 w-full flex items-center justify-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors">
          <FiFilter />
          <span>Filter Buildings</span>
        </button>
      </div>
      
      {/* Buildings List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* Header with Clear Button */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-400">CAMPUS BUILDINGS</h3>
          
          {selectedBuilding && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onBuildingSelect(null); // Clear the selection
              }}
              className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20"
            >
              <FiX />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          {stats.map((building) => (
            <div
              key={building.building_id}
              onClick={() => onBuildingSelect(building)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 group border ${
                selectedBuilding?.building_id === building.building_id 
                  ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                  : 'bg-gray-800/50 hover:bg-gray-700 border-transparent hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${selectedBuilding?.building_id === building.building_id ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                    <TbBuilding className="text-lg" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-200 text-sm">{building.name || building.building_id}</p>
                    <p className="text-xs text-gray-400">
                      Energy: <span className="text-gray-300">{building.avg_energy?.toFixed(1)} kWh</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                    building.status === 'good' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    building.status === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {getStatusText(building.status)}
                  </span>
                </div>
              </div>
              
              {/* Detailed stats only show when selected */}
              {selectedBuilding?.building_id === building.building_id && (
                <div className="mt-3 pt-3 border-t border-gray-700/50 animate-in fade-in slide-in-from-top-2 duration-300">
                   {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Sustainability Score</span>
                      <span className="text-white">{building.sustainability_score || 0}/100</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          building.status === 'good' ? 'bg-emerald-500' :
                          building.status === 'warning' ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(building.sustainability_score || 0)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-gray-900/40 rounded border border-gray-700/50">
                      <p className="text-gray-500 mb-1">Water</p>
                      <p className="font-semibold text-blue-300">{building.water_usage?.toFixed(0) || 0}L</p>
                    </div>
                    <div className="text-center p-2 bg-gray-900/40 rounded border border-gray-700/50">
                      <p className="text-gray-500 mb-1">Occupancy</p>
                      <p className="font-semibold text-purple-300">{building.occupancy || 0}</p>
                    </div>
                    <div className="text-center p-2 bg-gray-900/40 rounded border border-gray-700/50">
                      <p className="text-gray-500 mb-1">CO₂</p>
                      <p className="font-semibold text-orange-300">{building.co2_levels?.toFixed(0) || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Campus Summary */}
      <div className="p-4 border-t border-gray-700 shrink-0 bg-gray-800">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Campus Summary</h4>
        <div className="space-y-2 bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Buildings</span>
            <span className="font-medium text-white">{stats.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Avg. Score</span>
            <span className="font-medium text-white">
              {Math.round(stats.reduce((sum, b) => sum + (b.sustainability_score || 0), 0) / (stats.length || 1))}/100
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar