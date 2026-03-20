#!/usr/bin/env python3
"""修复 JSON 文件中的 NaN 值"""
import json, math
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

def clean(obj):
    if isinstance(obj, dict):
        return {k: clean(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean(v) for v in obj]
    elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    return obj

for fname in ["players.json", "seasons.json"]:
    fpath = DATA_DIR / fname
    with open(fpath, "r") as f:
        content = f.read()
    
    content = content.replace(": NaN", ": null").replace(":NaN", ":null")
    data = json.loads(content)
    data = clean(data)
    
    with open(fpath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Fixed {fname}: {len(data)} records")
