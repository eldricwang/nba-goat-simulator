#!/usr/bin/env python3
"""
IndexNow URL submission script for GOAT NBA Stats.
Submits key URLs to search engines via the IndexNow protocol.
Usage: python3 scripts/submit_indexnow.py [--all]
"""

import json
import sys
import urllib.request

INDEXNOW_KEY = "94790b5c8b9a1c4640da5ae08cc98758"
HOST = "nba-goat-simulator-1rl7.vercel.app"
BASE_URL = f"https://{HOST}"

# Key pages to always submit
KEY_PAGES = [
    "/",
    "/players",
    "/compare",
    "/about",
    "/player/michael-jordan",
    "/player/lebron-james",
    "/player/kobe-bryant",
    "/player/stephen-curry",
    "/player/kevin-durant",
    "/player/shaquille-oneal",
    "/player/tim-duncan",
    "/player/magic-johnson",
    "/player/larry-bird",
    "/player/wilt-chamberlain",
    "/player/kareem-abdul-jabbar",
    "/player/nikola-jokic",
    "/player/giannis-antetokounmpo",
    "/player/luka-doncic",
    "/player/joel-embiid",
    "/player/jayson-tatum",
]


def submit_urls(urls: list[str]) -> None:
    """Submit URLs to IndexNow API."""
    payload = {
        "host": HOST,
        "key": INDEXNOW_KEY,
        "keyLocation": f"{BASE_URL}/{INDEXNOW_KEY}.txt",
        "urlList": [f"{BASE_URL}{url}" for url in urls],
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.indexnow.org/indexnow",
        data=data,
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            if status in (200, 202):
                print(f"✓ Successfully submitted {len(urls)} URLs (HTTP {status})")
            else:
                print(f"⚠ Unexpected response: HTTP {status}")
    except urllib.error.HTTPError as e:
        print(f"✗ Error submitting URLs: HTTP {e.code} - {e.reason}")
    except urllib.error.URLError as e:
        print(f"✗ Connection error: {e.reason}")


def main():
    all_mode = "--all" in sys.argv

    if all_mode:
        print(f"Submitting ALL key pages ({len(KEY_PAGES)} URLs)...")
    else:
        print(f"Submitting key pages ({len(KEY_PAGES)} URLs)...")

    submit_urls(KEY_PAGES)

    # Also submit to Bing and Yandex directly
    for engine, endpoint in [
        ("Bing", "https://www.bing.com/indexnow"),
        ("Yandex", "https://yandex.com/indexnow"),
    ]:
        payload = {
            "host": HOST,
            "key": INDEXNOW_KEY,
            "keyLocation": f"{BASE_URL}/{INDEXNOW_KEY}.txt",
            "urlList": [f"{BASE_URL}{url}" for url in KEY_PAGES],
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=data,
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req) as response:
                print(f"✓ {engine}: HTTP {response.status}")
        except urllib.error.HTTPError as e:
            print(f"⚠ {engine}: HTTP {e.code}")
        except urllib.error.URLError as e:
            print(f"⚠ {engine}: {e.reason}")


if __name__ == "__main__":
    main()
