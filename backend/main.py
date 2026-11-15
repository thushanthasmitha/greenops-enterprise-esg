from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from sklearn.ensemble import RandomForestRegressor

app = FastAPI(title="GreenOps AI ML Backend")

# Enable CORS for React Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simulated trained Random Forest Model for Carbon Emission Forecasting
X_train = np.array([[1000, 1], [5000, 2], [10000, 3], [20000, 1], [50000, 2]])
y_train = np.array([2.5, 12.0, 45.0, 50.0, 120.0])

model = RandomForestRegressor(n_estimators=50, random_state=42)
model.fit(X_train, y_train)

class PredictionRequest(BaseModel):
    activityAmount: float
    categoryIndex: int

@app.post("/predict")
def predict_emission(data: PredictionRequest):
    prediction = model.predict([[data.activityAmount, data.categoryIndex]])
    return {
        "predicted_co2e_tonnes": round(float(prediction[0]), 3),
        "model_status": "RandomForestRegressor Active"
    }

@app.get("/")
def root():
    return {"message": "GreenOps FastAPI Backend is running successfully!"}