import React, { useState, useEffect } from 'react';
import { 
  FiAlertTriangle, FiCheckCircle, FiRadio, FiBattery, 
  FiDownload, FiFileText, FiFilter, FiTool, FiWifiOff, 
  FiClock, FiShield, FiFile
} from 'react-icons/fi';

const OpsCommandCenter = () => {
  const [activeTab, setActiveTab] = useState('incidents'); // incidents, sensors, reports
  const [isExporting, setIsExporting] = useState(false);

  // --- MOCK DATA ---
  const [incidents, setIncidents] = useState([
    { id: 'INC-092', severity: 'critical', title: 'HVAC Compressor Failure', building: 'Building 5', time: '10 mins ago', status: 'open' },
    { id: 'INC-091', severity: 'critical', title: 'Main Water Line Pressure Drop', building: 'Building 3', time: '1 hr ago', status: 'investigating' },
    { id: 'INC-090', severity: 'warning', title: 'Occupancy Sensor Disconnected', building: 'Library', time: '2 hrs ago', status: 'open' },
  ]);

  const sensors = [
    { id: 'SN-HV-501', type: 'HVAC Monitor', building: 'Building 5', battery: 12, signal: 'offline', status: 'critical' },
    { id: 'SN-WT-302', type: 'Flow Meter', building: 'Building 3', battery: 45, signal: 'weak', status: 'warning' },
    { id: 'SN-LT-109', type: 'Light Level', building: 'Building 1', battery: 89, signal: 'strong', status: 'good' },
    { id: 'SN-AQ-704', type: 'Air Quality', building: 'Library', battery: 92, signal: 'strong', status: 'good' },
    { id: 'SN-HV-502', type: 'HVAC Monitor', building: 'Building 5', battery: 8, signal: 'weak', status: 'critical' },
    { id: 'SN-OC-201', type: 'Occupancy', building: 'Building 2', battery: 100, signal: 'strong', status: 'good' },
  ];

  // --- ACTIONS ---
  const resolveIncident = (id) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'resolved' } : inc));
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('Report generated and downloaded successfully.');
    }, 1500);
  };

  // --- RENDER HELPERS ---
  const getSeverityBadge = (severity) => {
    const styles = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      good: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[severity]}`}>{severity}</span>;
  };

  return (
    <div className="h-full w-full bg-gray-900 flex flex-col font-sans text-gray-200">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50 bg-gray-800/30 shrink-0">
        <h1 className="text-2xl font-bold text-white flex items-center">
          <FiShield className="mr-3 text-blue-500" />
          Operations & Incident Command
        </h1>
        <p className="text-sm text-gray-400 mt-1">Manage physical infrastructure, monitor IoT health, and generate compliance reports.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex px-6 border-b border-gray-700/50 shrink-0 bg-gray-800/10">
        {[
          { id: 'incidents', label: 'Incident Command', icon: <FiAlertTriangle />, count: incidents.filter(i => i.status !== 'resolved').length },
          { id: 'sensors', label: 'IoT Sensor Fleet', icon: <FiRadio />, count: sensors.filter(s => s.status === 'critical').length },
          { id: 'reports', label: 'Automated Reporting', icon: <FiFileText /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-medium transition-colors ${
              activeTab === tab.id 
                ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] text-white ${activeTab === tab.id ? 'bg-blue-500' : 'bg-gray-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-900/50">
        
        {/* TAB 1: INCIDENT COMMAND CENTER */}
        {activeTab === 'incidents' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Active Alarms</h2>
              <button className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-md">
                <FiFilter /> <span>Filter</span>
              </button>
            </div>

            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Severity</th>
                    <th className="px-6 py-4">Incident Details</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {incidents.map(inc => (
                    <tr key={inc.id} className={`hover:bg-gray-800/80 transition-colors ${inc.status === 'resolved' ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">{getSeverityBadge(inc.severity)}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-200">{inc.title}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{inc.id}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{inc.building}</td>
                      <td className="px-6 py-4 text-gray-400 flex items-center"><FiClock className="mr-1.5" /> {inc.time}</td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-gray-300">{inc.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inc.status !== 'resolved' ? (
                          <button 
                            onClick={() => resolveIncident(inc.id)}
                            className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded flex items-center ml-auto transition-colors"
                          >
                            <FiTool className="mr-1.5" /> Resolve
                          </button>
                        ) : (
                          <span className="text-emerald-500 flex items-center justify-end text-xs"><FiCheckCircle className="mr-1" /> Cleared</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SENSOR HEALTH MAP */}
        {activeTab === 'sensors' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Sensors</p>
                <p className="text-2xl font-bold text-white">1,204 <span className="text-sm font-normal text-emerald-400 ml-2">98% Online</span></p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Critical Battery ({`< 15%`})</p>
                <p className="text-2xl font-bold text-red-100 flex items-center"><FiBattery className="mr-2 text-red-500" /> 14</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">Connection Lost</p>
                <p className="text-2xl font-bold text-amber-100 flex items-center"><FiWifiOff className="mr-2 text-amber-500" /> 3</p>
              </div>
            </div>

            <h2 className="text-lg font-bold mb-4">IoT Node Fleet Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sensors.map(sensor => (
                <div key={sensor.id} className="bg-gray-800/30 border border-gray-700/50 p-4 rounded-xl hover:bg-gray-800/80 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-sm text-gray-200">{sensor.type}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{sensor.id} • {sensor.building}</p>
                    </div>
                    {getSeverityBadge(sensor.status)}
                  </div>
                  
                  <div className="space-y-3 mt-4">
                    {/* Battery Status */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400 flex items-center"><FiBattery className="mr-1"/> Power Level</span>
                        <span className={sensor.battery < 20 ? 'text-red-400 font-bold' : 'text-emerald-400'}>{sensor.battery}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${sensor.battery < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${sensor.battery}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Network Status */}
                    <div className="flex justify-between text-xs pt-2 border-t border-gray-700/50">
                      <span className="text-gray-400 flex items-center"><FiRadio className="mr-1"/> Signal</span>
                      <span className={`capitalize font-medium ${
                        sensor.signal === 'strong' ? 'text-emerald-400' : 
                        sensor.signal === 'weak' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {sensor.signal}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AUTOMATED REPORTING */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Report Generator Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                <h2 className="text-lg font-bold mb-1">Generate Compliance Report</h2>
                <p className="text-xs text-gray-400 mb-6">Create formatted reports for regulatory bodies and stakeholders.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Report Template</label>
                    <select className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-200">
                      <option>LEED O+M Certification Data</option>
                      <option>Monthly Carbon Footprint Summary</option>
                      <option>Facility Energy Audit (Detailed)</option>
                      <option>Water Consumption & Waste Report</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Start Date</label>
                      <input type="date" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">End Date</label>
                      <input type="date" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200" />
                    </div>
                  </div>

                  <div className="pt-4 flex space-x-3">
                    <button 
                      onClick={handleExport}
                      disabled={isExporting}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-medium flex items-center justify-center transition-all"
                    >
                      {isExporting ? (
                         <span className="flex items-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"/> Generating...</span>
                      ) : (
                        <span className="flex items-center"><FiFileText className="mr-2" /> Export PDF</span>
                      )}
                    </button>
                    <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600 py-2.5 rounded-lg font-medium flex items-center justify-center transition-all">
                      <FiDownload className="mr-2" /> Export CSV (Raw Data)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Reports History */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Recent Exports</h3>
              <div className="space-y-3">
                {[
                  { name: 'LEED_Summary_Jan2026.pdf', date: 'Feb 1, 2026', size: '2.4 MB' },
                  { name: 'Carbon_Audit_Q4.pdf', date: 'Jan 15, 2026', size: '4.1 MB' },
                  { name: 'Raw_Telemetry_Dec.csv', date: 'Jan 1, 2026', size: '18.2 MB' },
                ].map((file, i) => (
                  <div key={i} className="flex items-center p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-600 cursor-pointer transition-colors group">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-md mr-3 group-hover:bg-blue-500/20">
                      <FiFile />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-gray-200 truncate">{file.name}</p>
                      <p className="text-[10px] text-gray-500">{file.date} • {file.size}</p>
                    </div>
                    <FiDownload className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default OpsCommandCenter;