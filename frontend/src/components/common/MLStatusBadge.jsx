import { useState, useEffect } from 'react'
import { FiCpu, FiCheckCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi'
import mlService from '../../services/mlService'

const MLStatusBadge = () => {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await mlService.getModelStatus()
      setStatus(response)
    } catch (error) {
      console.error('Error fetching ML status:', error)
    }
  }

  const refreshStatus = async () => {
    setLoading(true)
    await fetchStatus()
    setLoading(false)
  }

  if (!status) return null

  const trainedModels = Object.values(status.models).filter(m => m.is_trained).length
  const totalModels = Object.keys(status.models).length
  const allTrained = trainedModels === totalModels

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
        <FiCpu className="text-purple-400" />
        <span className="text-sm">
          ML: {trainedModels}/{totalModels} Trained
        </span>
        <div className={`w-2 h-2 rounded-full ${allTrained ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
      </div>
      
      <button
        onClick={refreshStatus}
        disabled={loading}
        className="p-1 hover:bg-gray-700 rounded transition"
        title="Refresh ML Status"
      >
        <FiRefreshCw className={`text-sm ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}

export default MLStatusBadge