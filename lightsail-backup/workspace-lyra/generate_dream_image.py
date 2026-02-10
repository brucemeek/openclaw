#!/usr/bin/env python3
"""Generate dreamscape image using Gemini 3 Pro Image API."""
import os
import sys
import requests
import base64
from datetime import datetime

API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("Error: GEMINI_API_KEY not set")
    sys.exit(1)

# Dream Oracle visual prompt
prompt = """
Surreal ethereal dreamscape with glassmorphism effects. 
Deep cerulean blue (#0B132B) cosmic background with aurora gold (#E3B23C) luminescent accents.
Abstract glowing glass spheres floating with dream symbols inside them.
A serene sleeping figure silhouette surrounded by cosmic light.
Ethereal mist, soft glow, warm and curious atmosphere.
No text, no faces, abstract symbolic composition.
4K ultra high detail, dreamy aesthetic, glass-like translucent elements shimmering.
"""

# Using Gemini 2.0 Flash Experimental image generation via API
endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key={API_KEY}"

payload = {
    "contents": [{
        "parts": [{
            "text": prompt
        }]
    }],
    "generationConfig": {
        "responseModalities": ["TEXT", "IMAGE"],
        "temperature": 0.7
    }
}

print("✨ Generating Dream Oracle glassmorphic visual...")
print(f"Prompt: {prompt.strip()}")

try:
    response = requests.post(
        endpoint,
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=120
    )
    response.raise_for_status()
    result = response.json()
    
    # Extract image data from response
    candidates = result.get("candidates", [])
    if candidates:
        parts = candidates[0].get("content", {}).get("parts", [])
        for part in parts:
            if "inlineData" in part:
                image_data = base64.b64decode(part["inlineData"]["data"])
                output_path = "/home/ec2-user/.openclaw/workspace-lyra/2026-02-10-20-34-dream-oracle-instagram.png"
                with open(output_path, "wb") as f:
                    f.write(image_data)
                print(f"✅ Image saved to: {output_path}")
                print(f"MEDIA: {output_path}")
                sys.exit(0)
    
    print(f"❌ No image in response: {result}")
    sys.exit(1)
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
