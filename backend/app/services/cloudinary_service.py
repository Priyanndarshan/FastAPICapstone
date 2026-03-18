"""
Cloudinary upload service using CLOUDINARY_URL (cloudinary://api_key:api_secret@cloud_name).
See: https://cloudinary.com/documentation/python_integration
"""
import re
import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, status

from app.config import settings

# CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
_CLOUDINARY_URL_PATTERN = re.compile(
    r"^cloudinary://([^:]+):([^@]+)@([^/]+)$"
)


def _ensure_configured() -> None:
    url = (settings.CLOUDINARY_URL or "").strip()
    if not url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Receipt upload is not configured (missing CLOUDINARY_URL)",
        )
    match = _CLOUDINARY_URL_PATTERN.match(url)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Invalid CLOUDINARY_URL format (use cloudinary://api_key:api_secret@cloud_name)",
        )
    api_key, api_secret, cloud_name = match.groups()
    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )


def upload_receipt(file_content: bytes, *, folder: str = "receipts") -> str:
    """
    Upload receipt image bytes to Cloudinary and return the secure URL.
    """
    _ensure_configured()
    result = cloudinary.uploader.upload(
        file_content,
        folder=folder,
        resource_type="image",
    )
    url = result.get("secure_url")
    if not url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Cloudinary did not return a URL",
        )
    return url
