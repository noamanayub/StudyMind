import shutil
from pathlib import Path
import pytest
from PIL import Image, ImageDraw, ImageFont
from app.documents.extractor import extract, InvalidDocument
from app.documents.ocr import command, OCRUnavailable
from app.core.config import settings


def fixture_image():
    image = Image.new('RGB', (1600, 500), 'white')
    font_path = Path('C:/Windows/Fonts/arial.ttf')
    if not font_path.exists():
        font_path = Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
    font = ImageFont.truetype(str(font_path), 48)
    ImageDraw.Draw(image).text((60, 80), 'Normalization reduces data redundancy.\nPrimary keys identify database records.', fill='black', font=font, spacing=25)
    return image


def test_real_ocr_image_and_scanned_pdf_keep_source_location(tmp_path):
    try:
        executable = command()
    except OCRUnavailable:
        pytest.skip('Install configured Tesseract to validate real local OCR.')
    if not (Path(executable).is_file() or shutil.which(executable)):
        pytest.skip('OCR executable unavailable.')
    image = fixture_image()
    png = tmp_path / 'notes.png'
    pdf = tmp_path / 'scan.pdf'
    image.save(png)
    image.save(pdf, 'PDF', resolution=150)
    image_sections = extract(png)
    pdf_sections = extract(pdf)
    assert 'Normalization reduces data redundancy' in image_sections[0].text
    assert 'Primary keys identify database records' in pdf_sections[0].text
    assert pdf_sections[0].page == 1
    assert image_sections[0].title == 'Image text (OCR)'


def test_ocr_limit_and_missing_engine_fail_clearly(tmp_path, monkeypatch):
    image = fixture_image()
    pdf = tmp_path / 'scan.pdf'
    image.save(pdf, 'PDF', resolution=150)
    monkeypatch.setattr(settings, 'ocr_enabled', False)
    with pytest.raises(InvalidDocument, match='OCR is not configured'):
        extract(pdf)


def test_oversized_image_is_rejected_before_ocr(monkeypatch):
    from app.documents.ocr import recognize
    class TooLarge:
        width = 50000
        height = 50000
    with pytest.raises(OCRUnavailable, match='too large'):
        recognize(TooLarge())
