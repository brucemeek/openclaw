import os
import subprocess
import json

competitors = [
    {"name": "Oniri", "id": "io.oniri.oniriapp"},
    {"name": "DreamKit", "id": "app.DreamKit.DreamKit.dreamkit"},
    {"name": "Awoken", "id": "com.lucid_dreaming.awoken"},
    {"name": "Lucidity", "id": "ch.b3nz.lucidity"},
    {"name": "DreamCatcher", "id": "com.vojtkovszky.dreamcatcher"}
]

results = []

for comp in competitors:
    print(f"Analyzing {comp['name']}...")
    url = f"https://play.google.com/store/apps/details?id={comp['id']}"
    output_file = f"{comp['name'].lower()}_summary.json"
    
    # Using the scrape_reviews.py script from review-summarizer skill
    # We filter for low ratings (min-rating 1, max-reviews 100 for speed)
    cmd = [
        "python3", "skills/review-summarizer/scripts/scrape_reviews.py",
        "--url", url,
        "--platform", "google",
        "--max-reviews", "100",
        "--format", "json",
        "--output", output_file
    ]
    
    try:
        subprocess.run(cmd, check=True)
        with open(output_file, 'r') as f:
            summary = json.load(f)
            results.append({"name": comp['name'], "summary": summary})
    except Exception as e:
        print(f"Error analyzing {comp['name']}: {e}")

with open('full_competitor_analysis.json', 'w') as f:
    json.dump(results, f, indent=2)

print("Analysis complete. Results saved to full_competitor_analysis.json")
