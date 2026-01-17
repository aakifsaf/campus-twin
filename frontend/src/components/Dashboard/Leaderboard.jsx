import { FiAward, FiTrendingUp, FiTrendingDown } from 'react-icons/fi'

const Leaderboard = ({ stats }) => {
  const sortedBuildings = [...stats]
    .sort((a, b) => (b.sustainability_score || 0) - (a.sustainability_score || 0))
    .slice(0, 10)

  const getRankColor = (rank) => {
    switch(rank) {
      case 1: return 'text-yellow-500'
      case 2: return 'text-gray-400'
      case 3: return 'text-orange-500'
      default: return 'text-gray-500'
    }
  }

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return '🏅'
    }
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center">
          <FiAward className="mr-2 text-yellow-500" />
          Sustainability Leaderboard
        </h3>
        <span className="text-sm text-gray-400">Top 10</span>
      </div>

      <div className="space-y-3">
        {sortedBuildings.map((building, index) => (
          <div 
            key={building.building_id} 
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition"
          >
            <div className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                index === 0 ? 'bg-yellow-500/20' :
                index === 1 ? 'bg-gray-500/20' :
                index === 2 ? 'bg-orange-500/20' :
                'bg-gray-700/20'
              }`}>
                <span className={`font-bold ${getRankColor(index + 1)}`}>
                  {getRankIcon(index + 1)}
                </span>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="font-medium truncate max-w-[120px]">
                    {building.name || building.building_id}
                  </p>
                  <span className={`text-sm px-2 py-1 rounded ${
                    building.status === 'good' ? 'bg-green-500/20 text-green-300' :
                    building.status === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {building.status || 'unknown'}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Score</span>
                    <span>{building.sustainability_score || 0}/100</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        building.status === 'good' ? 'bg-green-500' :
                        building.status === 'warning' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${(building.sustainability_score || 0)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ml-4 text-right">
              <p className="text-lg font-bold">{building.sustainability_score || 0}</p>
              <div className="flex items-center justify-end text-xs text-gray-400">
                <FiTrendingUp className="mr-1 text-green-500" />
                <span>+{Math.floor(Math.random() * 5) + 1}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span>Excellent (80-100)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span>Good (60-79)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span>Needs Attention</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard