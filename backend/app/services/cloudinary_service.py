
import re
import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, status

from app.config import settings

def _ensure_configured() -> None:
    cloud_name = (settings.CLOUDINARY_CLOUD_NAME or "").strip()
    api_key = (settings.CLOUDINARY_API_KEY or "").strip()
    api_secret = (settings.CLOUDINARY_API_SECRET or "").strip()

    if not cloud_name or not api_key or not api_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Receipt upload is not configured (missing Cloudinary credentials)",
        )

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
