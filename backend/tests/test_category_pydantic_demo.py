Demo: See Pydantic in action on the category endpoints.
Run the API first:  uvicorn app.main:app --reload
Then run this script:  python tests/test_category_pydantic_demo.py
You need a valid access token. Either:
  1. Register/login via Swagger (http://localhost:8000/docs), copy the access_token from the response.
  2. Or set CATEGORY_DEMO_TOKEN in the environment.
This script shows:
  - Validation: invalid payloads get 422 with clear error messages from Pydantic.
  - Response shaping: API returns only {id, name}, not user_id or created_at.
import os
import sys
try:
    import httpx
except ImportError:
    print("Install httpx: pip install httpx")
    sys.exit(1)
BASE = os.environ.get("BASE_URL", "http://localhost:8000")
TOKEN = os.environ.get("CATEGORY_DEMO_TOKEN", "")
def request(method: str, path: str, json=None):
    url = f"{BASE}{path}"
    headers = {}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    r = httpx.request(method, url, json=json, headers=headers or None, timeout=10.0)
    print(f"  Status: {r.status_code}")
    try:
        print(f"  Body:   {r.json()}")
    except Exception:
        print(f"  Body:   {r.text[:500]}")
    print()
    return r
def main():
    if not TOKEN:
        print("No CATEGORY_DEMO_TOKEN set. Using unauthenticated requests (will get 401 for protected routes).")
        print("To get a token: POST /auth/login or /auth/register, then export CATEGORY_DEMO_TOKEN=<access_token>\n")
    print("=" * 60)
    print("1. VALID CREATE – Pydantic accepts the body, API returns only id + name (response shape)")
    print("=" * 60)
    request("POST", "/categories", json={"name": "Pydantic Demo Category"})
    print("=" * 60)
    print("2. VALIDATION: empty name (min_length=1) – expect 422 Unprocessable Entity")
    print("=" * 60)
    request("POST", "/categories", json={"name": ""})
    print("=" * 60)
    print("3. VALIDATION: name too long (max_length=100) – expect 422")
    print("=" * 60)
    request("POST", "/categories", json={"name": "x" * 101})
    print("=" * 60)
    print("4. VALIDATION: missing 'name' – expect 422")
    print("=" * 60)
    request("POST", "/categories", json={})
    print("=" * 60)
    print("5. VALIDATION: wrong type (name is number) – expect 422")
    print("=" * 60)
    request("POST", "/categories", json={"name": 12345})
    print("=" * 60)
    print("6. VALIDATION: extra field – Pydantic ignores it by default; request still valid")
    print("=" * 60)
    request("POST", "/categories", json={"name": "With Extra Field", "user_id": 999, "hack": "ignored"})
    print("Done. Check responses: 422 = Pydantic validation; 200 = success (response only has id, name).")
if __name__ == "__main__":
    main()
