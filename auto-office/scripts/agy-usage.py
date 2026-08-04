#!/usr/bin/env python3
"""Read remaining AGY (Antigravity/Gemini) quota programmatically.

Reads OAuth credentials from ~/.gemini/antigravity-cli/antigravity-oauth-token,
refreshes the access token via Google OAuth2, and queries the CloudCode API endpoint:
https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota

Usage:
    ./agy-usage.py           # human-readable
    ./agy-usage.py --json    # machine-readable, for routing
    ./agy-usage.py --percent # bare integer percentage (lowest remaining among active models)

Exit codes:
    0  successfully retrieved quota
    2  headroom unknown / error reading credentials
"""

import json
import os
import sys
import requests

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.expanduser("~/.env"))
except ImportError:
    pass

TOKEN_PATH = os.path.expanduser("~/.gemini/antigravity-cli/antigravity-oauth-token")
OAUTH_CLIENT_ID = os.environ.get("AGY_OAUTH_CLIENT_ID", "")
OAUTH_CLIENT_SECRET = os.environ.get("AGY_OAUTH_CLIENT_SECRET", "")
TOKEN_URL = "https://oauth2.googleapis.com/token"
QUOTA_URL = "https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota"


def get_refreshed_access_token():
    if not os.path.exists(TOKEN_PATH):
        return None, f"Token file not found at {TOKEN_PATH}"
    
    try:
        with open(TOKEN_PATH, "r") as f:
            data = json.load(f)
    except Exception as e:
        return None, f"Failed to read token file: {e}"
    
    tok_obj = data.get("token", {})
    refresh_token = tok_obj.get("refresh_token")
    if not refresh_token:
        return None, "No refresh_token found in token file"
    
    # Try refreshing access token
    payload = {
        "client_id": OAUTH_CLIENT_ID,
        "client_secret": OAUTH_CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }
    
    try:
        res = requests.post(TOKEN_URL, data=payload, timeout=5)
        if res.status_code != 200:
            return None, f"OAuth token refresh failed ({res.status_code}): {res.text[:200]}"
        
        token_json = res.json()
        access_token = token_json.get("access_token")
        if not access_token:
            return None, "No access_token returned by OAuth refresh"
        
        return access_token, None
    except Exception as e:
        return None, f"Error refreshing OAuth token: {e}"


def fetch_agy_quota():
    access_token, err = get_refreshed_access_token()
    if err:
        return None, err
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "User-Agent": "antigravity-cli",
        "Content-Type": "application/json"
    }
    
    try:
        res = requests.post(QUOTA_URL, headers=headers, json={}, timeout=5)
        if res.status_code != 200:
            return None, f"API returned status {res.status_code}: {res.text[:200]}"
        
        return res.json(), None
    except Exception as e:
        return None, f"Failed to query quota API: {e}"


def process_quota(data):
    buckets = data.get("buckets", [])
    models = {}
    min_pct = 100
    
    for b in buckets:
        model_id = b.get("modelId")
        frac = b.get("remainingFraction", 1.0)
        pct = round(frac * 100, 1)
        reset_time = b.get("resetTime")
        
        models[model_id] = {
            "remaining_percent": pct,
            "reset_time": reset_time
        }
        
        # Track minimum remaining percentage for active model buckets
        if pct < min_pct:
            min_pct = pct
            
    return {
        "tightest_remaining_percent": int(min_pct),
        "models": models,
        "raw_buckets": buckets
    }


def main(argv):
    raw_data, err = fetch_agy_quota()
    if err:
        if "--json" in argv:
            print(json.dumps({"error": err, "remaining_percent": None}, indent=2))
        else:
            print(f"AGY quota probe UNKNOWN: {err}", file=sys.stderr)
        return 2
    
    processed = process_quota(raw_data)
    tightest_pct = processed["tightest_remaining_percent"]
    
    if "--percent" in argv:
        print(tightest_pct)
        return 0
    elif "--json" in argv:
        print(json.dumps(processed, indent=2))
        return 0
    else:
        print("=== AGY (Antigravity/Gemini) Quota ===")
        print(f"Overall Tightest Headroom: {tightest_pct}% left")
        print("\nModel Breakdown:")
        for model_id, info in processed["models"].items():
            pct = info["remaining_percent"]
            reset = info.get("reset_time", "N/A")
            print(f"  - {model_id}: {pct}% remaining (resets: {reset})")
        return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
