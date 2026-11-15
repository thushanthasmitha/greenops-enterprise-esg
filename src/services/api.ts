import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

export interface PredictionPayload {
  activityAmount: number;
  categoryIndex: number;
}

export interface PredictionResponse {
  predicted_co2e_tonnes: number;
  model_status: string;
}

export async function fetchAIEmissionPrediction(payload: PredictionPayload): Promise<PredictionResponse> {
  try {
    const response = await axios.post<PredictionResponse>(`${API_BASE_URL}/predict`, payload);
    return response.data;
  } catch (error) {
    console.error('Error connecting to Python FastAPI backend:', error);
    // Fallback calculation if backend is offline
    return {
      predicted_co2e_tonnes: payload.activityAmount * 0.0025,
      model_status: 'Fallback Mode (Backend Offline)'
    };
  }
}