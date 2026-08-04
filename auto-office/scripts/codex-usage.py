#!/usr/bin/env python3
"""Read remaining ChatGPT/Codex weekly quota, non-interactively.

Reads the stored Codex session token from ~/.codex/auth.json and asks the ChatGPT
backend for the account's rate-limit windows. No browser, no automation, no model
tokens consumed.

Usage:
    ./codex-usage.py           # human-readable
    ./codex-usage.py --json    # machine-readable, for routing
    ./codex-usage.py --percent # just the remaining weekly percent, e.g. "99"

Exit codes:
    0  headroom read successfully
    2  could not read (no auth file, no token, HTTP failure) — the caller must
       treat this as "codex headroom unknown" and route as if codex were exhausted
       unless the user says otherwise.
"""

import json
import os
import sys
import urllib.error
import urllib.request

AUTH_PATH = os.path.expanduser("~/.codex/auth.json")
USAGE_URL = "https://chatgpt.com/backend-api/wham/usage"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"


def read_token(path=AUTH_PATH):
    if not os.path.exists(path):
        raise RuntimeError(f"auth file not found at {path} (run `codex login`)")
    with open(path) as f:
        auth = json.load(f)
    token = auth.get("tokens", {}).get("access_token")
    if not token:
        raise RuntimeError(f"no tokens.access_token in {path}")
    return token


def fetch_usage(token):
    req = urllib.request.Request(
        USAGE_URL, headers={"Authorization": f"Bearer {token}", "User-Agent": UA}
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            return json.load(res)
    except urllib.error.HTTPError as e:
        body = e.read()[:200].decode("utf-8", "replace")
        raise RuntimeError(f"usage API returned {e.code}: {body}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"usage API unreachable: {e.reason}") from e


def summarize(data):
    primary = data.get("rate_limit", {}).get("primary_window", {}) or {}
    used = primary.get("used_percent", 0)
    reset = primary.get("reset_after_seconds", 0) or 0
    return {
        "account": data.get("email"),
        "plan": str(data.get("plan_type") or "").upper(),
        "weekly_used_percent": used,
        "weekly_remaining_percent": 100 - used,
        "resets_in_seconds": reset,
        "resets_in": f"{reset // 86400}d {(reset % 86400) // 3600}h {(reset % 3600) // 60}m",
    }


def main(argv):
    try:
        info = summarize(fetch_usage(read_token()))
    except (RuntimeError, ValueError, OSError) as e:
        print(f"codex headroom UNKNOWN: {e}", file=sys.stderr)
        return 2

    if "--percent" in argv:
        print(info["weekly_remaining_percent"])
    elif "--json" in argv:
        print(json.dumps(info, indent=2))
    else:
        print("=== Codex / ChatGPT weekly quota ===")
        print(f"Account: {info['account']}")
        print(f"Plan:    {info['plan']}")
        print(f"Used:    {info['weekly_used_percent']}%")
        print(f"Left:    {info['weekly_remaining_percent']}%")
        print(f"Resets:  in {info['resets_in']}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
