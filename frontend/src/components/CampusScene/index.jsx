import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, PerspectiveCamera, PerformanceMonitor, Line } from '@react-three/drei'
import { Suspense, useMemo, useState } from 'react'
import * as THREE from 'three'
import Building from './Building'
import { CAMPUS_LAYOUT } from '../../utils/constants'

const CampusScene = ({ buildings, onBuildingSelect, selectedBuilding }) => {
  // Enhanced State Management
  const [heatmapMode, setHeatmapMode] = useState('status') // 'status', 'thermal', 'occupancy'
  const [xRayMode, setXRayMode] = useState(false)

  // Merge building data with layout
  const buildingData = useMemo(() => {
    return CAMPUS_LAYOUT.map(layout => {
      const building = buildings?.find(b => b.building_id === layout.id) || {}
      return {
        ...layout,
        ...building,
        sustainability_score: building.sustainability_score || 50,
        status: building.status || 'unknown',
        avg_energy: building.avg_energy || Math.floor(Math.random() * 200) + 50, // Fallback mock
        occupancy: building.occupancy || Math.floor(Math.random() * 300), // Fallback mock
        connections: CAMPUS_LAYOUT
          .filter(b => Math.random() > 0.6 && b.id !== layout.id)
          .map(b => ({ x: b.x, z: b.z }))
      }
    })
  }, [buildings])

  // Dynamic Heatmap Color Engine
  const getBuildingColor = (building) => {
    if (heatmapMode === 'thermal') {
      const energy = building.avg_energy;
      if (energy > 200) return '#ef4444'; // Red (High Heat/Loss)
      if (energy > 150) return '#f97316'; // Orange
      if (energy > 100) return '#eab308'; // Yellow
      return '#3b82f6'; // Blue (Cool/Efficient)
    } 
    
    if (heatmapMode === 'occupancy') {
      const occ = building.occupancy;
      if (occ > 200) return '#9333ea'; // Deep Purple (Dense)
      if (occ > 100) return '#d946ef'; // Fuchsia
      if (occ > 50) return '#f472b6';  // Pink
      return '#cbd5e1'; // Slate (Empty)
    }

    // Default 'status' mode
    switch(building.status) {
      case 'good': return '#10B981'
      case 'warning': return '#F59E0B'
      case 'critical': return '#EF4444'
      default: return '#10B981'
    }
  }

  return (
    <div className="h-full w-full relative">
      {/* Loading overlay */}
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Rendering Digital Twin...</p>
          </div>
        </div>
      }>
        <Canvas shadows performance={{ min: 0.5 }}>
          <PerformanceMonitor onDecline={() => {}} flipflops={3} />
          <color attach="background" args={['#0f172a']} />
          
          {/* Adaptive Camera */}
          <PerspectiveCamera 
            makeDefault 
            position={[60, 45, 60]} 
            fov={45}
            near={1}
            far={300}
          />
          
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={25}
            maxDistance={150}
            minPolarAngle={0}
            maxPolarAngle={xRayMode ? Math.PI / 1.5 : Math.PI / 2.1} // Allow looking "up" from underground in X-Ray
            dampingFactor={0.1}
          />
          
          {/* Lighting */}
          <ambientLight intensity={xRayMode ? 0.8 : 0.3} />
          <directionalLight
            position={[60, 80, 40]}
            intensity={0.6}
            castShadow={!xRayMode}
            shadow-mapSize={[1024, 1024]}
          />
          
          <Environment preset="city" background={false} />
          
          {/* Ground Plane (Transforms during X-Ray) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
            <planeGeometry args={[200, 200, 40, 40]} />
            <meshStandardMaterial 
              color={xRayMode ? "#0ea5e9" : "#1e293b"} 
              roughness={xRayMode ? 0 : 0.8}
              transparent={xRayMode}
              opacity={xRayMode ? 0.05 : 1}
              wireframe={xRayMode} // Turns into a cool holographic grid
            />
          </mesh>
          
          {/* Hide roads in X-Ray mode */}
          {!xRayMode && [-40, 0, 40].map((x) => (
            <mesh key={`road-x-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.05, 0]} receiveShadow>
              <planeGeometry args={[8, 200]} />
              <meshStandardMaterial color="#334155" roughness={0.7} />
            </mesh>
          ))}
          {!xRayMode && [-40, 0, 40].map((z) => (
            <mesh key={`road-z-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, z]} receiveShadow>
              <planeGeometry args={[200, 8]} />
              <meshStandardMaterial color="#334155" roughness={0.7} />
            </mesh>
          ))}
          
          {/* Buildings */}
          {buildingData.map((building) => (
            <Building
              key={building.id}
              position={[building.x, 0, building.z]}
              floors={building.floors}
              color={getBuildingColor(building)}
              data={building}
              isSelected={selectedBuilding?.building_id === building.building_id}
              onClick={() => onBuildingSelect(building)}
            />
          ))}

          {/* Underground Utility Infrastructure */}
          <UtilityInfrastructure buildings={buildingData} visible={xRayMode} />
          
        </Canvas>
      </Suspense>

      {/* --- UI OVERLAYS --- */}
      
      {/* 1. Enhanced System Controls */}
      <div className="absolute top-4 left-4 p-4 rounded-xl border border-gray-700 bg-gray-900/80 backdrop-blur-md shadow-xl w-64 text-white z-10">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-700 pb-2">
          System Controls
        </h3>

        <div className="space-y-5">
          {/* Heatmap Toggles */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-medium">Data Heatmaps</label>
            <div className="grid grid-cols-1 gap-1.5 bg-gray-800/50 p-1.5 rounded-lg border border-gray-700/50">
              <button
                onClick={() => setHeatmapMode('status')}
                className={`w-full py-1.5 text-xs rounded transition-all ${heatmapMode === 'status' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
              >
                Default (Health Status)
              </button>
              <button
                onClick={() => setHeatmapMode('thermal')}
                className={`w-full py-1.5 text-xs rounded transition-all flex items-center justify-center space-x-2 ${heatmapMode === 'thermal' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
              >
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                <span>Thermal (Energy)</span>
              </button>
              <button
                onClick={() => setHeatmapMode('occupancy')}
                className={`w-full py-1.5 text-xs rounded transition-all flex items-center justify-center space-x-2 ${heatmapMode === 'occupancy' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span>Occupancy Density</span>
              </button>
            </div>
          </div>

          {/* X-Ray Infrastructure Toggle */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-medium">Infrastructure View</label>
            <button
              onClick={() => setXRayMode(!xRayMode)}
              className={`w-full py-2 px-3 text-xs font-bold rounded-lg border transition-all flex items-center justify-between ${
                xRayMode 
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <span>X-Ray Mode</span>
              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${xRayMode ? 'bg-cyan-500' : 'bg-gray-600'}`}>
                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${xRayMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Dynamic Legend */}
      <div className="absolute top-4 right-4 glass-card p-4 rounded-xl border border-gray-700 bg-gray-900/80 backdrop-blur-md shadow-xl w-48 z-10 text-white">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
          {heatmapMode === 'thermal' ? 'Thermal Signature' : heatmapMode === 'occupancy' ? 'Occupancy Density' : 'Sustainability Status'}
        </p>
        
        <div className="space-y-2">
          {heatmapMode === 'thermal' && (
            <>
              <LegendItem color="bg-red-500" label="High Loss (>200 kWh)" />
              <LegendItem color="bg-orange-500" label="Elevated (150-200)" />
              <LegendItem color="bg-yellow-500" label="Moderate (100-150)" />
              <LegendItem color="bg-blue-500" label="Efficient (<100 kWh)" />
            </>
          )}
          {heatmapMode === 'occupancy' && (
            <>
              <LegendItem color="bg-purple-600" label="Max Capacity" />
              <LegendItem color="bg-fuchsia-500" label="High Density" />
              <LegendItem color="bg-pink-400" label="Moderate" />
              <LegendItem color="bg-slate-300" label="Low / Vacant" />
            </>
          )}
          {heatmapMode === 'status' && (
            <>
              <LegendItem color="bg-emerald-500" label="Optimal (70-100)" />
              <LegendItem color="bg-amber-500" label="Warning (40-69)" />
              <LegendItem color="bg-red-500" label="Critical (<40)" />
            </>
          )}
        </div>

        {/* X-Ray Legend Addition */}
        {xRayMode && (
          <div className="mt-4 pt-3 border-t border-gray-700 space-y-2 animate-in fade-in">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Underground Utilities</p>
             <LegendItem color="bg-cyan-400" label="Water Mains" />
             <LegendItem color="bg-yellow-400" label="Electric Grid" />
             <LegendItem color="bg-green-400" label="Fiber Optic Data" />
          </div>
        )}
      </div>

    </div>
  )
}

// Helper for UI
const LegendItem = ({ color, label }) => (
  <div className="flex items-center">
    <div className={`w-3 h-3 rounded-sm ${color} mr-2 shadow-lg`}></div>
    <span className="text-xs text-gray-300">{label}</span>
  </div>
)

// Sub-component to render underground pipes and wires
const UtilityInfrastructure = ({ buildings, visible }) => {
  if (!visible) return null;

  return (
    <group position={[0, 0, 0]}>
      {buildings.map((building, i) => (
        building.connections?.map((conn, j) => {
          const start = new THREE.Vector3(building.x, 0, building.z);
          const end = new THREE.Vector3(conn.x, 0, conn.z);
          
          return (
            <group key={`pipe-${i}-${j}`}>
              {/* Vertical drops into the ground from the buildings */}
              <Line points={[[start.x, 0, start.z], [start.x, -3, start.z]]} color="#334155" lineWidth={2} />
              <Line points={[[end.x, 0, end.z], [end.x, -3, end.z]]} color="#334155" lineWidth={2} />

              {/* Water Pipe (Cyan, deepest) */}
              <Line 
                points={[[start.x + 1, -4, start.z], [end.x + 1, -4, end.z]]} 
                color="#22d3ee" 
                lineWidth={4} 
                transparent opacity={0.8}
              />
              {/* Electric Grid (Yellow, mid-level) */}
              <Line 
                points={[[start.x, -3, start.z + 1], [end.x, -3, end.z + 1]]} 
                color="#facc15" 
                lineWidth={3} 
                transparent opacity={0.9}
              />
              {/* Fiber Data (Green, highest) */}
              <Line 
                points={[[start.x - 1, -2, start.z - 1], [end.x - 1, -2, end.z - 1]]} 
                color="#4ade80" 
                lineWidth={2} 
                transparent opacity={0.9}
              />
            </group>
          )
        })
      ))}
      
      {/* Central Hub Connector (Visual flair) */}
      <mesh position={[0, -3.5, 0]}>
        <cylinderGeometry args={[4, 4, 3, 16]} />
        <meshStandardMaterial color="#334155" wireframe />
      </mesh>
    </group>
  );
};

export default CampusScene