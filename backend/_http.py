"""Tiny stdlib HTTP helper (urllib) so the cloud calls need no SDK install.

Used by the Claude and Deepgram clients. Returns (status_code, body_bytes);
never raises on HTTP error status — the caller inspects the code.
"""

import json
import ssl
import urllib.error
import urllib.request


def _ssl_context() -> ssl.SSLContext:
    """TLS context backed by certifi's CA bundle when available.

    Fixes the common macOS-Python 'CERTIFICATE_VERIFY_FAILED' (empty system trust
    store) without requiring `requests`. Falls back to the system default.
    """
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:  # noqa: BLE001
        return ssl.create_default_context()


_CTX = _ssl_context()


def post(url: str, headers: dict, data: bytes, timeout: float = 30.0):
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=_CTX) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except urllib.error.URLError as e:
        # network/DNS/connection error — surface as a 0 status with the reason
        return 0, str(e).encode("utf-8")


def post_json(url: str, headers: dict, obj: dict, timeout: float = 30.0):
    merged = {"content-type": "application/json", **headers}
    return post(url, merged, json.dumps(obj).encode("utf-8"), timeout)
