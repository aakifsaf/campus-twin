import React, { useMemo, useState, useEffect } from 'react';
import { 
  FiX, FiActivity, FiDroplet, FiZap, FiThermometer, 
  FiWind, FiAlertCircle, FiChevronRight, FiChevronLeft 
} from 'react-icons/fi';

const BuildingDashboard = ({ building, onClose }) => {
  const [isHidden, setIsHidden] = useState(false);

  // Automatically reveal the dashboard if a new building is selected
  useEffect(() => {
    if (building) {
      setIsHidden(false);
    }
  }, [building?.building_id]);

  // Generate mock floor data based on the building's floor count
  const floorData = useMemo(() => {
    if (!building) return [];
    const floors = building.floors || 3;
    const departments = ['Chemistry Labs', 'Computer Science', 'Admin Offices', 'Library', 'Cafeteria', 'Lecture Halls'];
    
    return Array.from({ length: floors }).map((_, i) => ({
      level: floors - i, // Top floor first
      department: departments[i % departments.length],
      energyPct: Math.floor(Math.random() * 40) + 10, // Random 10-50%
      waterPct: Math.floor(Math.random() * 40) + 10,
    }));
  }, [building?.building_id, building?.floors]);

  if (!building) return null;

  // Mock System Status
  const systems = {
    hvac: building.status === 'critical' ? 'Warning' : 'Optimal',
    lighting: building.status === 'warning' ? 'Inefficient' : 'Eco-Mode',
    temp: 22 + (Math.random() * 4 - 2).toFixed(1), // 20-24C
  };

  return (
    <div 
      className={`absolute top-0 right-0 w-96 h-full bg-gray-900 border-l border-gray-700 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out z-50 ${
        isHidden ? 'translate-x-full' : 'translate-x-0'
      }`}
    >
      
      {/* Hide/Show Toggle Tab */}
      <button
        onClick={() => setIsHidden(!isHidden)}
        className="absolute top-1/2 -left-8 transform -translate-y-1/2 bg-gray-900 hover:bg-gray-800 border-y border-l border-gray-700 text-gray-400 hover:text-white p-1.5 rounded-l-md shadow-[-4px_0_15px_rgba(0,0,0,0.3)] transition-colors z-50 flex items-center justify-center"
        title={isHidden ? "Reveal Dashboard" : "Hide Dashboard"}
      >
        {isHidden ? <FiChevronLeft className="text-xl" /> : <FiChevronRight className="text-xl" />}
      </button>

      {/* Header */}
      <div className="p-5 border-b border-gray-700 bg-gray-800/50 flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <h2 className="text-xl font-bold text-white tracking-wide">
              {building.building_id}
            </h2>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
              building.status === 'good' ? 'bg-emerald-500/20 text-emerald-400' :
              building.status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {building.status}
            </span>
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">{building.type} • 3 Floors</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors border border-gray-700"
          title="Close Dashboard completely"
        >
          <FiX className="text-lg" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
            <div className="flex items-center space-x-2 text-blue-400 mb-1">
              <FiZap /> <span className="text-xs font-semibold">Energy Use</span>
            </div>
            <p className="text-xl font-mono text-white">{building.avg_energy?.toFixed(0)} <span className="text-xs text-gray-500">kWh</span></p>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
            <div className="flex items-center space-x-2 text-cyan-400 mb-1">
              <FiDroplet /> <span className="text-xs font-semibold">Water Use</span>
            </div>
            <p className="text-xl font-mono text-white">{building.water_usage?.toFixed(0) || 1200} <span className="text-xs text-gray-500">L</span></p>
          </div>
        </div>

        {/* Floor-by-Floor Analysis */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center">
            <FiActivity className="mr-2 text-blue-500" /> Floor-by-Floor Breakdown
          </h3>
          <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-4 space-y-4">
            {floorData.map((floor) => (
              <div key={floor.level} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">Floor {floor.level}: <span className="text-gray-500">{floor.department}</span></span>
                  <span className="text-gray-400 font-mono">{floor.energyPct}%</span>
                </div>
                {/* Visual Bar */}
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden flex">
                  <div className="bg-blue-500 h-full" style={{ width: `${floor.energyPct}%` }} title="Energy"></div>
                  <div className="bg-cyan-500 h-full opacity-50" style={{ width: `${floor.waterPct}%` }} title="Water"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HVAC & Lighting Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center">
            <FiThermometer className="mr-2 text-orange-500" /> Core Systems
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {/* HVAC Card */}
            <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <FiWind className={systems.hvac === 'Optimal' ? 'text-emerald-400' : 'text-amber-400'} />
                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                  systems.hvac === 'Optimal' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>{systems.hvac}</span>
              </div>
              <p className="text-xs text-gray-400">HVAC Status</p>
              <p className="text-lg font-mono text-white">{systems.temp}°C</p>
            </div>

            {/* Lighting Card */}
            <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <FiZap className={systems.lighting === 'Eco-Mode' ? 'text-emerald-400' : 'text-amber-400'} />
                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                  systems.lighting === 'Eco-Mode' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>{systems.lighting}</span>
              </div>
              <p className="text-xs text-gray-400">Lighting</p>
              <p className="text-sm font-medium text-white mt-1">Smart Active</p>
            </div>
          </div>

          {/* Smart Insights / Anomalies */}
          {(systems.hvac !== 'Optimal' || systems.lighting !== 'Eco-Mode') && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start space-x-3">
              <FiAlertCircle className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-400 mb-1">System Anomaly Detected</p>
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  {systems.hvac !== 'Optimal' && "AC is running at high capacity while Floor 2 windows are open. "}
                  {systems.lighting !== 'Eco-Mode' && "Lights remain active in vacant lecture halls on Floor 1."}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BuildingDashboard;