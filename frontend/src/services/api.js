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
  getBuildingStats: (params) => {
    return api.get(API_ENDPOINTS.DATA.STATS, { params }); 
  },
  
  // Get buildings list
  getBuildings: () => {
    return api.get(API_ENDPOINTS.DATA.BUILDINGS);
  },
  
  getStatus: async () => {
      const response = await api.get(API_ENDPOINTS.DATA.SIMULATION_STATUS);
      return response
  },

  toggleSimulation: async () => {
      const response = await api.post(API_ENDPOINTS.DATA.TOGGLE_SIMULATION);
      return response
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