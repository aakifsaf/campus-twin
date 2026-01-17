// Building types and colors
export const BUILDING_TYPES = {
  academic: {
    name: 'Academic Building',
    color: '#3B82F6', // Blue
    defaultEnergy: 120
  },
  residential: {
    name: 'Residential Hall',
    color: '#10B981', // Green
    defaultEnergy: 80
  },
  administrative: {
    name: 'Administration',
    color: '#8B5CF6', // Purple
    defaultEnergy: 100
  },
  library: {
    name: 'Library',
    color: '#F59E0B', // Amber
    defaultEnergy: 150
  },
  laboratory: {
    name: 'Laboratory',
    color: '#EF4444', // Red
    defaultEnergy: 200
  }
};

// Sustainability status colors
export const STATUS_COLORS = {
  good: '#10B981',    // Green
  warning: '#F59E0B', // Amber
  critical: '#EF4444', // Red
  unknown: '#6B7280'  // Gray
};

// Data types
export const DATA_TYPES = {
  energy: {
    name: 'Energy Consumption',
    unit: 'kWh',
    icon: '⚡'
  },
  water: {
    name: 'Water Usage',
    unit: 'L',
    icon: '💧'
  },
  occupancy: {
    name: 'Occupancy',
    unit: 'people',
    icon: '👥'
  },
  temperature: {
    name: 'Temperature',
    unit: '°C',
    icon: '🌡️'
  },
  co2: {
    name: 'CO2 Levels',
    unit: 'ppm',
    icon: '🌫️'
  }
};

// API endpoints
export const API_ENDPOINTS = {
  BASE: `${import.meta.env.VITE_API_BASE_URL}`,
  DATA: {
    SENSOR: '/data/sensor',
    STATS: '/data/stats',
    BUILDINGS: '/data/buildings',
    SIMULATE: '/data/simulate'
  },
  WS: `${import.meta.env.VITE_WS_URL}`
};

// Campus layout coordinates (for 3D visualization)
export const CAMPUS_LAYOUT = [
  { id: 'building_1', x: -20, z: -20, type: 'academic', floors: 6 },
  { id: 'building_2', x: 20, z: -20, type: 'residential', floors: 6 },
  { id: 'building_3', x: -20, z: 20, type: 'administrative', floors: 6 },
  { id: 'building_4', x: 20, z: 20, type: 'library', floors: 6 },
  { id: 'building_5', x: 0, z: 0, type: 'laboratory', floors: 6 },
  { id: 'building_6', x: -40, z: 0, type: 'academic', floors: 6 },
  { id: 'building_7', x: 40, z: 0, type: 'residential', floors: 6 },
  { id: 'building_8', x: 0, z: -40, type: 'administrative', floors: 6 },
  { id: 'building_9', x: 0, z: 40, type: 'library', floors: 6 },
  { id: 'building_10', x: -40, z: -40, type: 'laboratory', floors: 6 }
];

// What-If Scenarios
export const WHAT_IF_SCENARIOS = {
  solar_panels: {
    name: 'Solar Panel Installation',
    description: 'Install solar panels on building roof',
    parameters: {
      panel_area: { min: 50, max: 500, unit: 'm²', default: 200 },
      efficiency: { min: 0.15, max: 0.22, unit: '', default: 0.18 }
    }
  },
  led_lights: {
    name: 'LED Lighting Upgrade',
    description: 'Replace traditional lights with LED',
    parameters: {
      replacement_rate: { min: 0, max: 100, unit: '%', default: 100 },
      wattage_reduction: { min: 50, max: 80, unit: '%', default: 70 }
    }
  },
  water_recycling: {
    name: 'Water Recycling System',
    description: 'Install greywater recycling',
    parameters: {
      recycling_rate: { min: 0, max: 80, unit: '%', default: 50 },
      system_capacity: { min: 1000, max: 10000, unit: 'L/day', default: 5000 }
    }
  }
};