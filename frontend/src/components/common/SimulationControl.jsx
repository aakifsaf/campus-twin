import React, { useState, useEffect } from 'react';
import { FiDatabase, FiPlay, FiPause, FiServer } from 'react-icons/fi';
import { dataAPI } from '../../services/api';

const SimulationControl = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [buildingsTracked, setBuildingsTracked] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial status on mount
  useEffect(() => {
    const checkStatus = async () => {
      const data = await dataAPI.getStatus();
      console.log(data)
      setIsRunning(data.is_running);
      setBuildingsTracked(data.buildings_tracked);
    };
    checkStatus();
  }, []);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const result = await dataAPI.toggleSimulation();
      setIsRunning(result.status === 'running');
    } catch (error) {
      // Handle error (maybe show a toast notification)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-md border border-gray-700/50 rounded-xl p-3 flex items-center justify-between shadow-lg w-72">
      
      {/* Status Indicator & Info */}
      <div className="flex items-center space-x-3">
        {/* Pulsing Dot */}
        <div className="relative flex h-3 w-3">
          {isRunning && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-3 w-3 transition-colors duration-300 ${
            isRunning ? 'bg-emerald-500' : 'bg-gray-500'
          }`}></span>
        </div>
        
        <div>
          <h4 className="text-xs font-bold text-gray-200 flex items-center">
            <FiDatabase className="mr-1.5 text-gray-400" /> 
            Data Stream
          </h4>
          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
            {isRunning ? 'LIVE SYNTHESIS' : 'SYSTEM PAUSED'}
          </p>
        </div>
      </div>

      {/* Action Button & Building Count */}
      <div className="flex items-center space-x-3 border-l border-gray-700 pl-3">
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Nodes</p>
          <p className="text-xs font-bold text-gray-300 flex items-center justify-center">
             <FiServer className="mr-1 text-blue-400"/> {buildingsTracked}
          </p>
        </div>
        
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`p-2 rounded-lg flex items-center justify-center transition-all ${
            isLoading ? 'opacity-50 cursor-not-allowed bg-gray-700' :
            isRunning 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
          }`}
          title={isRunning ? "Pause Simulation" : "Start Simulation"}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : isRunning ? (
            <FiPause className="text-sm" />
          ) : (
            <FiPlay className="text-sm ml-0.5" />
          )}
        </button>
      </div>
      
    </div>
  );
};

export default SimulationControl;