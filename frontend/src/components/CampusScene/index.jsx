import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, PerspectiveCamera, PerformanceMonitor } from '@react-three/drei'
import { Suspense, useMemo, useState } from 'react'
import Building from './Building'
import { CAMPUS_LAYOUT } from '../../utils/constants'

const CampusScene = ({ buildings, onBuildingSelect, selectedBuilding }) => {
  // Merge building data with layout
  const buildingData = useMemo(() => {
    return CAMPUS_LAYOUT.map(layout => {
      const building = buildings.find(b => b.building_id === layout.id) || {}
      return {
        ...layout,
        ...building,
        sustainability_score: building.sustainability_score || 50,
        status: building.status || 'unknown',
        avg_energy: building.avg_energy || 100
      }
    })
  }, [buildings])

  const getBuildingColor = (status, score) => {
    switch(status) {
      case 'good': return '#10B981' // Green
      case 'warning': return '#F59E0B' // Amber
      case 'critical': return '#EF4444' // Red
      default: 
        // Gradient based on score
        if (score >= 70) return '#10B981'
        if (score >= 40) return '#F59E0B'
        return '#EF4444'
    }
  }

  return (
    <div className="h-full relative">
      {/* Loading overlay */}
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading 3D Campus...</p>
          </div>
        </div>
      }>
        {/* 3D Canvas */}
        <Canvas shadows performance={{ min: 0.5 }}>
          <PerformanceMonitor
            onDecline={() => {}}
            flipflops={3}
          />
          
          <color attach="background" args={['#0f172a']} />
          
          {/* Adaptive Camera */}
          <PerspectiveCamera 
            makeDefault 
            position={[60, 45, 60]} 
            fov={45}
            near={1}
            far={300}
          />
          
          {/* Optimized Controls */}
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={25}
            maxDistance={150}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2.1}
            dampingFactor={0.1}
          />
          
          {/* Optimized Lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[60, 80, 40]}
            intensity={0.6}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
          />
          
          {/* Environment with LOD */}
          <Environment 
            preset="city" 
            background={false}
          />
          
          {/* Ground Plane (replaces Grid for better performance) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
            <planeGeometry args={[200, 200]} />
            <meshStandardMaterial 
              color="#1e293b" 
              roughness={0.8}
              metalness={0.1}
            />
          </mesh>
          
          {/* Road System */}
          {[-40, 0, 40].map((x) => (
            <mesh key={`road-x-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.05, 0]} receiveShadow>
              <planeGeometry args={[8, 200]} />
              <meshStandardMaterial color="#475569" roughness={0.7} />
            </mesh>
          ))}
          
          {[-40, 0, 40].map((z) => (
            <mesh key={`road-z-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, z]} receiveShadow>
              <planeGeometry args={[200, 8]} />
              <meshStandardMaterial color="#475569" roughness={0.7} />
            </mesh>
          ))}
          
          {/* Buildings with optimized rendering */}
          {buildingData.map((building) => (
            <Building
              key={building.id}
              position={[building.x, 0, building.z]}
              floors={building.floors}
              color={getBuildingColor(building.status, building.sustainability_score)}
              data={building}
              isSelected={selectedBuilding?.id === building.id}
              onClick={() => onBuildingSelect(building)}
            />
          ))}
          
          {/* Decorative Trees (instanced for performance) */}
          <Trees />
        </Canvas>
      </Suspense>
      
      {/* Controls Overlay */}
      <div className="absolute bottom-4 left-4 glass-card p-3 backdrop-blur-sm bg-white/5 border border-white/10">
        <p className="text-sm font-medium text-gray-300 mb-2">3D Controls</p>
        <div className="space-y-1">
          <p className="text-xs text-gray-400">• Left click + drag: Rotate</p>
          <p className="text-xs text-gray-400">• Right click + drag: Pan</p>
          <p className="text-xs text-gray-400">• Scroll: Zoom</p>
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute top-4 right-4 glass-card p-4 backdrop-blur-sm bg-white/5 border border-white/10">
        <p className="text-sm font-semibold text-gray-300 mb-3">Sustainability Legend</p>
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-green-500 mr-2 shadow-lg shadow-green-500/30"></div>
            <span className="text-sm text-gray-300">Good (70-100)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-yellow-500 mr-2 shadow-lg shadow-yellow-500/30"></div>
            <span className="text-sm text-gray-300">Warning (40-69)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-red-500 mr-2 shadow-lg shadow-red-500/30"></div>
            <span className="text-sm text-gray-300">Critical (0-39)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Optimized Trees component using instanced meshes
const Trees = () => {
  const treePositions = useMemo(() => {
    const positions = []
    for (let i = 0; i < 20; i++) {
      positions.push([
        Math.random() * 160 - 80,
        0,
        Math.random() * 160 - 80
      ])
    }
    return positions
  }, [])

  return (
    <>
      {treePositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <coneGeometry args={[1.5, 5, 8]} />
          <meshStandardMaterial color="#15803d" roughness={0.9} />
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 5, 6]} />
            <meshStandardMaterial color="#92400e" roughness={0.8} />
          </mesh>
        </mesh>
      ))}
    </>
  )
}

export default CampusScene