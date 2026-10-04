from pathlib import Path
import os
import shutil
import subprocess
import tempfile
import warnings
from PIL import Image, ImageOps
import pypdfium2 as pdfium
from app.core.config import settings


class OCRUnavailable(ValueError):
    pass


def command():
    local = Path(__file__).resolve().parents[3] / '.tools/tesseract/tesseract.exe'
    selected = settings.tesseract_cmd or (str(local.resolve()) if local.is_file() else shutil.which('tesseract'))
    if not settings.ocr_enabled or not selected:
        raise OCRUnavailable('Local OCR is not configured. Ask the administrator to install Tesseract or upload a text-based copy.')
    return selected


def recognize(image):
    if image.width * image.height > 40_000_000:
        raise OCRUnavailable('This image is too large. Use a smaller image for OCR.')
    with tempfile.TemporaryDirectory(prefix='study-mind-ocr-') as folder:
        path = Path(folder) / 'page.png'
        ImageOps.exif_transpose(image).convert('RGB').save(path)
        try:
            result = subprocess.run([command(), str(path), 'stdout', '-l', settings.ocr_language, '--psm', '3'],
                                    capture_output=True, text=True, encoding='utf-8', timeout=45,
                                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
        except (OSError, subprocess.TimeoutExpired) as error:
            raise OCRUnavailable('OCR could not finish. Try a clearer image or a smaller document.') from error
        if result.returncode:
            raise OCRUnavailable('OCR could not read this file. Check the configured OCR language and image quality.')
        return result.stdout.strip()


def image_text(path):
    with warnings.catch_warnings():
        warnings.simplefilter('error', Image.DecompressionBombWarning)
        with Image.open(path) as image:
            if image.width * image.height > 40_000_000:
                raise OCRUnavailable('This image is too large. Use a smaller image for OCR.')
            return recognize(image)


def pdf_page_text(path, pages, heartbeat=None):
    if len(pages) > settings.max_ocr_pages:
        raise OCRUnavailable(f'This PDF needs OCR on more than {settings.max_ocr_pages} pages. Split it into smaller files.')
    result = {}
    with pdfium.PdfDocument(path) as pdf:
        for number in pages:
            if heartbeat:
                heartbeat()
            page = pdf[number - 1]
            try:
                width, height = page.get_size()
                scale = min(2.5, (20_000_000 / max(1, width * height)) ** .5)
                bitmap = page.render(scale=scale)
                try:
                    image = bitmap.to_pil()
                    try:
                        result[number] = recognize(image)
                    finally:
                        image.close()
                finally:
                    bitmap.close()
            finally:
                page.close()
    return result
