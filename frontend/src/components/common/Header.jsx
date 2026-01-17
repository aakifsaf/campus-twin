import { FiMenu, FiGrid, FiMap, FiSettings, FiBell } from 'react-icons/fi'
import { TbBuildingEstate } from 'react-icons/tb'
import MLStatusBadge from './MLStatusBadge'

const Header = ({ connected, onSimulate, activeView, onViewChange }) => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side: Logo and Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <TbBuildingEstate className="text-3xl text-blue-500" />
            <div>
              <h1 className="text-xl font-bold text-white">Smart Campus Digital Twin</h1>
              <p className="text-sm text-gray-400">Real-time Sustainability Monitoring</p>
            </div>
          </div>
          
          {/* Connection Status Badge */}
          <div className={`px-3 py-1 rounded-full text-sm flex items-center ${connected ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
            {connected ? 'Live' : 'Offline'}
          </div>
          <MLStatusBadge />
        </div>
        
        {/* Center: View Toggle */}
        <div className="flex items-center space-x-2 bg-gray-900 rounded-lg p-1">
          <button
            onClick={() => onViewChange('dashboard')}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 transition ${activeView === 'dashboard' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <FiGrid />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => onViewChange('3d')}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 transition ${activeView === '3d' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <FiMap />
            <span>3D Campus</span>
          </button>
        </div>
        
        {/* Right side: Actions */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onSimulate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition flex items-center space-x-2"
          >
            <FiGrid />
            <span>Start Simulation</span>
          </button>
          
          <button className="p-2 hover:bg-gray-700 rounded-lg transition relative">
            <FiBell className="text-xl" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <button className="p-2 hover:bg-gray-700 rounded-lg transition">
            <FiSettings className="text-xl" />
          </button>
          
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
        </div>
      </div>
    </header>
  )
}

export default Header