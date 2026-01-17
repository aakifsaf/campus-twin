import { useRef, useState, useMemo } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Building = ({ position, floors = 3, color = '#3b82f6', data, isSelected, onClick }) => {
  const meshRef = useRef()
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)
  
  const width = 8 + (data.type === 'library' ? 2 : 0)
  const depth = 8 + (data.type === 'administrative' ? 2 : 0)
  const floorHeight = 3
  
  // Window texture
  const windowTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    
    // Create window pattern
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, 64, 64)
    
    ctx.fillStyle = '#0ea5e9'
    // Draw multiple windows
    for (let x = 4; x < 60; x += 12) {
      for (let y = 4; y < 60; y += 12) {
        if (Math.random() > 0.3) { // Randomly turn lights on
          ctx.fillStyle = Math.random() > 0.5 ? '#fbbf24' : '#0ea5e9'
          ctx.fillRect(x, y, 6, 8)
        }
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(4, floors * 2)
    return texture
  }, [floors])

  useFrame((state) => {
    if (meshRef.current && !isSelected) {
      // Subtle floating animation only when not selected
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.3) * 0.05
    }
    
    if (groupRef.current && isSelected) {
      // Smooth rotation when selected
      groupRef.current.rotation.y += 0.005
    }
  })

  const handleClick = (event) => {
    event.stopPropagation()
    onClick()
  }

  // Calculate roof color based on sustainability
  const roofColor = useMemo(() => {
    const score = data.sustainability_score || 50
    if (score >= 70) return '#059669' // Green roof
    if (score >= 40) return '#d97706' // Yellow roof
    return '#dc2626' // Red roof
  }, [data.sustainability_score])

  return (
    <group ref={groupRef} position={position}>
      {/* Main Building Structure */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? [1.02, 1.02, 1.02] : [1, 1, 1]}
      >
        <boxGeometry args={[width, floors * floorHeight, depth]} />
        <meshStandardMaterial
          color={color}
          roughness={0.6}
          metalness={0.2}
          map={windowTexture}
        />
      </mesh>
      
      {/* Roof */}
      <mesh 
        position={[0, floorHeight+floors, 0]} 
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width + 0.2, 1, depth + 0.2]} />
        <meshStandardMaterial 
          color={roofColor}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Building Label */}
      <Text
        position={[0, floors + floorHeight + 2.5, 0]}
        fontSize={1.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.15}
        outlineColor="black"
      >
        {data.name || data.building_id.replace('_', ' ').toUpperCase()}
      </Text>
      
      {/* Score Display */}
      <Text
        position={[0, floors + floorHeight + 1.5, 2 ]}
        fontSize={0.8}
        color="white"
        anchorX="center"
        anchorY="middle"
        rotation={[0, 0, 0]}
        outlineWidth={0.1}
        outlineColor="black"
      >
        {data.sustainability_score || '?'}/100
      </Text>
      
      {/* Energy Usage Indicator (Glowing cylinder) */}
      <mesh position={[width/2 + 0.5, 1, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 2, 6]} />
        <meshStandardMaterial 
          color={data.avg_energy > 150 ? '#ef4444' : data.avg_energy > 100 ? '#f59e0b' : '#10b981'} 
          emissive={data.avg_energy > 150 ? '#ef4444' : data.avg_energy > 100 ? '#f59e0b' : '#10b981'}
          emissiveIntensity={0.5}
          roughness={0.3}
        />
      </mesh>
      
      {/* Entrance */}
      <mesh position={[0, 1.5, depth/2 + 0.1]} castShadow>
        <boxGeometry args={[2, 3, 0.5]} />
        <meshStandardMaterial color="#92400e" roughness={0.7} />
      </mesh>
      
      {/* Selection Effects */}
      {isSelected && (
        <>
          {/* Pulsing Selection Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
            <ringGeometry args={[width/2 + 2, width/2 + 3, 32]} />
            <meshBasicMaterial 
              color={color}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Information Beam */}
          <mesh position={[0, floors + floorHeight+8, 0]}>
            <cylinderGeometry args={[0.5, 2, 10, 8]} />
            <meshBasicMaterial 
              color={color}
              transparent
              opacity={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Floating Info Panel */}
          <Text
            position={[0, floors + floorHeight + 16, 0]}
            fontSize={1.5}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.2}
            outlineColor="black"
          >
            {`${data.sustainability_score || 'N/A'} pts`}
          </Text>
          
          {/* Additional Info */}
          <Text
            position={[0, floors + floorHeight + 14, 0]}
            fontSize={1}
            color="#d1d5db"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.1}
            outlineColor="black"
          >
            {`Energy: ${data.avg_energy || 'N/A'} kWh`}
          </Text>
        </>
      )}
      
      {/* Hover Effects */}
      {hovered && !isSelected && (
        <>
          <pointLight
            position={[0, floors * floorHeight + 2, 0]}
            color={color}
            intensity={0.5}
            distance={8}
          />
          
          {/* Glow effect */}
          <mesh position={[0, floors * floorHeight / 2, 0]}>
            <boxGeometry args={[width + 0.5, floors * floorHeight + 0.5, depth + 0.5]} />
            <meshBasicMaterial 
              color={color}
              transparent
              opacity={0.1}
              wireframe
            />
          </mesh>
        </>
      )}
      
      {/* Ground Shadow (fake for performance) */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0.01, 0]}
        receiveShadow
      >
        <circleGeometry args={[width/2 + 1, 16]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent 
          opacity={0.2}
        />
      </mesh>
    </group>
  )
}

export default Building