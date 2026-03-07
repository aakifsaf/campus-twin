import { useState, useMemo } from 'react'
import { FiSearch, FiFilter, FiX, FiCheck } from 'react-icons/fi' 
import { TbBuilding } from 'react-icons/tb'

const Sidebar = ({ stats, selectedBuilding, onBuildingSelect }) => {
  // 1. State for Search and Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'good', 'warning', 'critical'

  // 2. Filtering Logic
  const filteredBuildings = useMemo(() => {
    return stats.filter((building) => {
      // Check search match
      const searchString = `${building.name || ''} ${building.building_id || ''} ${building.type || ''}`.toLowerCase()
      const matchesSearch = searchString.includes(searchQuery.toLowerCase())

      // Check status match
      const matchesStatus = statusFilter === 'all' || building.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [stats, searchQuery, statusFilter])

  const getStatusColor = (status) => {
    switch(status) {
      case 'good': return 'bg-emerald-500'
      case 'warning': return 'bg-amber-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status) => {
    switch(status) {
      case 'good': return 'Optimal'
      case 'warning': return 'Warning'
      case 'critical': return 'Critical'
      default: return 'Unknown'
    }
  }

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full z-20">
      
      {/* Search and Filter Section */}
      <div className="p-4 border-b border-gray-700 shrink-0 bg-gray-800">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search buildings..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-8 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-200 placeholder-gray-500 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <FiX />
            </button>
          )}
        </div>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`mt-3 w-full flex items-center justify-center space-x-2 text-sm py-1.5 rounded-md transition-colors ${
            showFilters || statusFilter !== 'all' 
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700 border border-transparent'
          }`}
        >
          <FiFilter />
          <span>{statusFilter !== 'all' ? `Filtered: ${getStatusText(statusFilter)}` : 'Filter Buildings'}</span>
        </button>

        {/* Expandable Filter Menu */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-700/50 animate-in slide-in-from-top-2 fade-in duration-200">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">By Status</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'good', label: 'Optimal', color: 'emerald' },
                { id: 'warning', label: 'Warning', color: 'amber' },
                { id: 'critical', label: 'Critical', color: 'red' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`flex items-center justify-center px-2 py-1.5 rounded text-xs font-medium transition-all ${
                    statusFilter === filter.id 
                      ? filter.id === 'all' 
                        ? 'bg-blue-500 text-white' 
                        : `bg-${filter.color}-500/20 text-${filter.color}-400 border border-${filter.color}-500/50`
                      : 'bg-gray-900 text-gray-400 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  {statusFilter === filter.id && filter.id !== 'all' && <FiCheck className="mr-1" />}
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Buildings List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-400">
            RESULTS ({filteredBuildings.length})
          </h3>
          
          {selectedBuilding && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onBuildingSelect(null);
              }}
              className="flex items-center space-x-1 text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20"
            >
              <FiX />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          {filteredBuildings.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              No buildings match your criteria.
            </div>
          ) : (
            filteredBuildings.map((building) => (
              <div
                key={building.building_id}
                onClick={() => onBuildingSelect(building)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 group border ${
                  selectedBuilding?.building_id === building.building_id 
                    ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                    : 'bg-gray-800/50 hover:bg-gray-700 border-transparent hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center overflow-hidden">
                    <div className={`p-2 rounded-lg mr-3 shrink-0 ${selectedBuilding?.building_id === building.building_id ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                      <TbBuilding className="text-lg" />
                    </div>
                    <div className="truncate pr-2">
                      <p className="font-medium text-gray-200 text-sm truncate">{building.name || building.building_id}</p>
                      <p className="text-xs text-gray-400 truncate">
                        Energy: <span className="text-gray-300">{building.avg_energy?.toFixed(0)} kWh</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      building.status === 'good' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      building.status === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {getStatusText(building.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Dynamic Summary based on Filters */}
      <div className="p-4 border-t border-gray-700 shrink-0 bg-gray-800">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Filtered Summary</h4>
        <div className="space-y-1.5 bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Total Shown</span>
            <span className="font-mono text-white">{filteredBuildings.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Avg. Score</span>
            <span className={`font-mono font-bold ${filteredBuildings.length > 0 ? 'text-white' : 'text-gray-600'}`}>
              {filteredBuildings.length > 0 
                ? Math.round(filteredBuildings.reduce((sum, b) => sum + (b.sustainability_score || 0), 0) / filteredBuildings.length)
                : 0}/100
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar