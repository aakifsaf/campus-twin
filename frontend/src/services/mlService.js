import api, { dataAPI } from './api'

class MLService {
  constructor() {
    this.baseURL = '/predict'
  }

  // prediction with ML
  async makePrediction(buildingId, dataType, hoursAhead = 24, includeAnomaly = true) {
    try {
      const response = await api.post(`${this.baseURL}/`, {
        building_id: buildingId,
        data_type: dataType,
        hours_ahead: hoursAhead,
        include_anomaly: includeAnomaly
      })
      
      return response
    } catch (error) {
      console.error('Prediction error:', error)
      // Return mock prediction for development
      return this.generateMockPrediction(buildingId, dataType, hoursAhead)
    }
  }

  // What-if analysis
  async whatIfAnalysis(buildingId, scenario, parameters) {
    try {
      const response = await api.post(`${this.baseURL}/what-if`, 
        parameters,
      {
        params:{ building_id: buildingId, scenario: scenario} 
      })
      
      return response
    } catch (error) {
      console.error('What-if analysis error:', error)
      return this.generateMockWhatIf(buildingId, scenario, parameters)
    }
  }

  // Trend prediction
  async predictTrend(buildingId, dataType = 'energy', days = 30) {
    try {
      const response = await api.get(`${this.baseURL}/predict-trend`, {
        params: { building_id: buildingId, data_type: dataType, days }
      })
      
      return response
    } catch (error) {
      console.error('Trend prediction error:', error)
      return this.generateMockTrend(buildingId, dataType, days)
    }
  }

  // Train ML models
  async trainModels(dataType = 'all', buildingIds = null, hours = 168) {
    try {
      const response = await api.post(`${this.baseURL}/train-model`, {
        data_type: dataType,
        building_ids: buildingIds,
        hours: hours
      })
      
      return response
    } catch (error) {
      console.error('Training error:', error)
      return { message: 'Training initiated (mock)' }
    }
  }

  // Get model status
  async getModelStatus() {
    try {
      const response = await api.get(`${this.baseURL}/model-status`)
      return response
    } catch (error) {
      console.error('Model status error:', error)
      return this.generateMockModelStatus()
    }
  }

  // Mock data generators for development
  generateMockPrediction(buildingId, dataType, hoursAhead) {
    const predictions = []
    const baseValue = dataType === 'energy' ? 150 : dataType === 'water' ? 300 : 100
    
    for (let i = 1; i <= hoursAhead; i++) {
      const hourOfDay = (new Date().getHours() + i) % 24
      let multiplier = 1.0
      
      if (hourOfDay >= 8 && hourOfDay <= 18) {
        multiplier = 1.5 + Math.sin((hourOfDay - 8) * Math.PI / 10) * 0.3
      } else {
        multiplier = 0.5 + Math.sin(hourOfDay * Math.PI / 12) * 0.2
      }
      
      const value = baseValue * multiplier * (0.95 + Math.random() * 0.1)
      const confidence = 0.9 - (i * 0.01)
      
      predictions.push({
        hour: i,
        timestamp: new Date(Date.now() + i * 3600000).toISOString(),
        value: parseFloat(value.toFixed(2)),
        confidence: parseFloat(confidence.toFixed(3))
      })
    }

    // Generate mock anomalies
    const anomalies = Math.random() > 0.7 ? [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        value: baseValue * 3,
        type: 'high',
        severity: 75,
        confidence: 0.85,
        description: 'Energy spike detected'
      }
    ] : null

    return {
      building_id: buildingId,
      data_type: dataType,
      predictions: predictions,
      confidence: 0.85,
      anomalies: anomalies
    }
  }

  generateMockWhatIf(buildingId, scenario, parameters) {
    const baseResults = {
      building_id: buildingId,
      scenario: scenario,
      parameters: parameters,
      current_consumption: 150,
      projected_consumption: 120,
      savings_percentage: 20.0,
      co2_reduction_kg: 1250.5,
      cost_savings: 1500.75
    }

    switch(scenario) {
      case 'solar_panels':
        return {
          ...baseResults,
          payback_period_years: 4.5,
          estimated_yearly_generation: 45000,
          roof_space_required: '200 m²'
        }
      case 'led_lights':
        return {
          ...baseResults,
          payback_period_years: 2.1,
          bulbs_replaced: 500,
          yearly_energy_saving: 25000
        }
      case 'water_recycling':
        return {
          ...baseResults,
          current_water_usage: 45600,
          projected_water_usage: 27360,
          water_savings_percentage: 40.0,
          payback_period_years: 3.8
        }
      default:
        return baseResults
    }
  }

  generateMockTrend(buildingId, dataType, days) {
    const trend = Math.random() > 0.5 ? 'increasing' : 'decreasing'
    const severity = Math.random() > 0.7 ? 'high' : 'moderate'
    
    const predictions = []
    for (let i = 1; i <= 7; i++) {
      predictions.push({
        day: i,
        value: 150 + (trend === 'increasing' ? i * 5 : -i * 3),
        change_percentage: trend === 'increasing' ? i * 0.5 : -i * 0.3
      })
    }

    return {
      building_id: buildingId,
      data_type: dataType,
      historical_points: days * 24,
      current_value: 152.3,
      trend: trend,
      severity: severity,
      slope: trend === 'increasing' ? 0.45 : -0.32,
      r_squared: 0.78,
      predictions: predictions,
      recommendation: this.getMockRecommendation(trend, severity, dataType)
    }
  }

  getMockRecommendation(trend, severity, dataType) {
    const recommendations = {
      energy: {
        increasing: {
          high: 'Immediate action required: Conduct energy audit and implement conservation measures',
          moderate: 'Monitor closely: Consider upgrading to energy-efficient equipment',
          low: 'Normal seasonal variation observed'
        },
        decreasing: 'Excellent: Continue current conservation practices',
        stable: 'Maintain current operations and monitoring'
      },
      water: {
        increasing: 'Check for leaks and review water usage patterns',
        decreasing: 'Good water conservation practices in place',
        stable: 'Water usage is consistent'
      }
    }

    return recommendations[dataType]?.[trend]?.[severity] || 
           recommendations[dataType]?.[trend] || 
           'Continue monitoring and analysis'
  }

  generateMockModelStatus() {
    return {
      models: {
        energy_predictor: {
          is_trained: true,
          type: 'LSTM/RandomForest',
          sequence_length: 24,
          prediction_horizon: 24,
          accuracy: 0.87
        },
        water_predictor: {
          is_trained: true,
          type: 'LSTM/RandomForest',
          sequence_length: 24,
          prediction_horizon: 24,
          accuracy: 0.82
        },
        occupancy_predictor: {
          is_trained: false,
          type: 'LSTM/RandomForest',
          sequence_length: 24,
          prediction_horizon: 24,
          accuracy: 0.0
        },
        anomaly_detector: {
          is_trained: true,
          type: 'RandomForest',
          features: ['mean', 'std', 'min', 'max', 'trend', 'seasonality'],
          contamination: 0.1,
          accuracy: 0.91
        }
      },
      last_updated: new Date().toISOString(),
      models_directory: 'models/'
    }
  }

  // Batch predictions for multiple buildings
  async batchPredict(buildingIds, dataType = 'energy', hoursAhead = 24) {
    const predictions = []
    
    for (const buildingId of buildingIds) {
      try {
        const prediction = await this.makePrediction(buildingId, dataType, hoursAhead)
        predictions.push({
          building_id: buildingId,
          prediction: prediction
        })
      } catch (error) {
        console.error(`Batch prediction failed for ${buildingId}:`, error)
      }
    }
    
    return predictions
  }

  // Calculate sustainability score based on predictions
  calculateSustainabilityScore(predictions, historicalData) {
    if (!predictions || predictions.length === 0) return 0
    
    const avgPrediction = predictions.reduce((sum, p) => sum + p.value, 0) / predictions.length
    const avgHistorical = historicalData.reduce((sum, h) => sum + h.value, 0) / historicalData.length
    
    // Lower predicted consumption = higher score
    const consumptionRatio = avgPrediction / Math.max(avgHistorical, 1)
    const baseScore = 100 * Math.max(0, 1 - consumptionRatio)
    
    // Adjust for prediction confidence
    const avgConfidence = predictions.reduce((sum, p) => sum + (p.confidence || 0.5), 0) / predictions.length
    const finalScore = baseScore * avgConfidence
    
    return Math.min(100, Math.max(0, finalScore))
  }
}

// Create singleton instance
const mlService = new MLService()
export default mlService