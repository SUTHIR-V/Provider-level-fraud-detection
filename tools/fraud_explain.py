import pandas as pd
import joblib
import shap
import numpy as np
import cohere
import sys
import json

# -------------------------
# Load provider-level input (single provider in file)
# -------------------------
input_df = pd.read_csv("/content/provider_level_input.csv")

if "Provider" in input_df.columns:
    provider = input_df["Provider"].iloc[0]
    features_df = input_df.drop(columns=["Provider"])
else:
    provider = "Provider_0"
    features_df = input_df

# -------------------------
# Load trained LightGBM model
# -------------------------
lgb_model = joblib.load("/content/lightgbm_fraud_final.pkl")

# -------------------------
# Predictions
# -------------------------
fraud_prob = lgb_model.predict_proba(features_df)[:, 1][0]
fraud_pred = lgb_model.predict(features_df)[0]
pred_label = "Fraud" if fraud_pred == 1 else "Not Fraud"

# -------------------------
# SHAP Explanation
# -------------------------
explainer = shap.TreeExplainer(lgb_model)
shap_values = explainer.shap_values(features_df)

# Handle binary case
if isinstance(shap_values, list):
    shap_values = shap_values[1]  # take positive class

# Extract top features
shap_importance = np.abs(shap_values[0]).argsort()[::-1]
top_features = []
for feat_idx in shap_importance[:5]:
    feat_name = features_df.columns[feat_idx]
    feat_value = features_df.iloc[0, feat_idx]
    shap_contrib = shap_values[0][feat_idx]
    top_features.append({
        "feature": feat_name,
        "value": float(feat_value),
        "impact": float(shap_contrib)
    })

# -------------------------
# Cohere Setup
# -------------------------
import os

co = cohere.Client(os.getenv("COHERE_API_KEY"))

prompt = f"""
The fraud detection model predicted **{pred_label}**
for Provider: {provider} with probability {fraud_prob:.2f}.

The top factors influencing this prediction were:
{top_features}

Please explain the result as **3–5 short, high-impact bullet points**
that a business stakeholder or auditor can quickly understand.
Keep each point concise (max 1 sentence).
"""

# Use Cohere Chat API
response = co.chat(
    model="command-r",
    message=prompt,
    temperature=0.5,
)

# -------------------------
# Final Output
# -------------------------
result = {
    "provider": provider,
    "prediction": pred_label,
    "probability": round(float(fraud_prob), 2),
    "top_features": top_features,
    "explanation": response.text.strip(),
    "fraudExplanation": [point.strip("-• ").strip() for point in response.text.strip().split("\n") if point.strip()]
}

print(json.dumps(result))
