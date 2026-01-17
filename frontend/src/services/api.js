import axios from 'axios';
import { API_ENDPOINTS } from '../utils/constants';

// Create axios instance
const api = axios.create({
  baseURL: API_ENDPOINTS.BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Data API
export const dataAPI = {
  // Get sensor data
  getSensorData: (params = {}) => {
    return api.get(API_ENDPOINTS.DATA.SENSOR, { params });
  },
  
  // Get building statistics
  getBuildingStats: () => {
    return api.get(API_ENDPOINTS.DATA.STATS);
  },
  
  // Get buildings list
  getBuildings: () => {
    return api.get(API_ENDPOINTS.DATA.BUILDINGS);
  },
  
  // Start simulation
  startSimulation: (duration = 5, interval = 2) => {
    return api.post(API_ENDPOINTS.DATA.SIMULATE, null, {
      params: { duration_minutes: duration, interval_seconds: interval }
    });
  },
  
  // Add manual data (for testing)
  addManualData: (buildingId, dataType, value) => {
    return api.post('/data/manual-data', null, {
      params: { building_id: buildingId, data_type: dataType, value }
    });
  }
};

// Mock data for development
export const mockData = {
  getBuildingStats: () => {
    const buildings = {};
    for (let i = 1; i <= 10; i++) {
      const score = Math.random() * 100;
      buildings[`building_${i}`] = {
        building_id: `building_${i}`,
        avg_energy: 50 + Math.random() * 150,
        sustainability_score: Math.round(score),
        status: score > 70 ? 'good' : score > 40 ? 'warning' : 'critical',
        water_usage: 200 + Math.random() * 300,
        occupancy: Math.floor(Math.random() * 200),
        co2_levels: 400 + Math.random() * 400
      };
    }
    return {
      buildings: Object.values(buildings),
      timestamp: new Date().toISOString(),
      campus_avg_score: 65.5
    };
  }
};

export default api;