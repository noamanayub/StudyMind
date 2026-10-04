from types import SimpleNamespace as NS
import json
import wave
import pytest
from app.documents import media
from app.documents.extractor import extract, InvalidDocument
from app.core.config import settings
from app.llm.client import ProviderUnavailable
from app.services.research_service import grounded_report, public_url


def test_audio_transcript_preserves_time_location_and_bounds(tmp_path, monkeypatch):
    path = tmp_path / 'lecture.wav'
    with wave.open(str(path), 'wb') as file:
        file.setnchannels(1)
        file.setsampwidth(2)
        file.setframerate(8000)
        file.writeframes(b'\x00\x00' * 8000)
    response = media.Transcript(segments=[media.Segment(startSeconds=0, endSeconds=1, text='Primary keys identify records.')])
    calls = []
    monkeypatch.setattr(media, 'generate', lambda *args, **kwargs: calls.append(args) or response)
    sections = extract(path, 'AUDIO')
    assert sections[0].text == 'Primary keys identify records.'
    assert '00:00–00:01' in sections[0].title
    assert calls[0][1][0].inline_data.mime_type == 'audio/wav'
    monkeypatch.setattr(settings, 'max_media_seconds', .5)
    with pytest.raises(InvalidDocument, match='no longer'):
        extract(path, 'AUDIO')
    assert len(calls) == 1


def test_youtube_passes_only_canonical_video_and_limits_excerpt(tmp_path, monkeypatch):
    path = tmp_path / 'lecture.youtube'
    path.write_text(json.dumps({'videoId':'9hE5-98ZeCg'}))
    calls = []
    response = media.Transcript(segments=[media.Segment(startSeconds=0, endSeconds=20, text='Lecture content.')])
    monkeypatch.setattr(media, 'generate', lambda *args, **kwargs: calls.append(args) or response)
    result = extract(path, 'YOUTUBE')
    assert 'AI YouTube transcript' in result[0].title
    part = calls[0][1][0]
    assert part.file_data.file_uri == 'https://www.youtube.com/watch?v=9hE5-98ZeCg'
    assert part.video_metadata.end_offset == f'{settings.max_media_seconds}s'
    path.write_text(json.dumps({'videoId':'https://localhost/private'}))
    with pytest.raises(InvalidDocument, match='invalid'):
        extract(path, 'YOUTUBE')
    assert len(calls) == 1


def test_invalid_timestamps_and_provider_failures_do_not_publish_text(tmp_path, monkeypatch):
    with pytest.raises(ValueError, match='time locations'):
        media.validate_transcript(media.Transcript(segments=[media.Segment(startSeconds=20,endSeconds=10,text='Invalid')]),30)
    path = tmp_path / 'lecture.youtube'
    path.write_text(json.dumps({'videoId':'9hE5-98ZeCg'}))
    def unavailable(*args, **kwargs):
        raise ProviderUnavailable('Unavailable')
    monkeypatch.setattr(media, 'generate', unavailable)
    with pytest.raises(ProviderUnavailable):
        extract(path, 'YOUTUBE')


def test_visual_analysis_uses_bounded_image_and_clear_provenance(tmp_path, monkeypatch):
    from PIL import Image
    path = tmp_path / 'diagram.png'
    Image.new('RGB',(500,300),'white').save(path)
    monkeypatch.setattr(media, 'generate', lambda *args, **kwargs: media.VisualResult(description='A visible relationship diagram.'))
    result = extract(path, 'VISION')
    assert result[0].text == 'A visible relationship diagram.'
    assert 'verify against original' in result[0].title


def test_web_grounding_rejects_missing_evidence_and_private_links():
    metadata = NS(grounding_chunks=[NS(web=NS(uri='https://example.org/source',title='Primary source'))],
                  grounding_supports=[NS(segment=NS(text='Supported statement.'),grounding_chunk_indices=[0,99])],
                  search_entry_point=NS(rendered_content='<p>Google suggestions</p>'))
    response = NS(text='Research report.',candidates=[NS(grounding_metadata=metadata)])
    result = grounded_report(response)
    assert result['supports'][0]['sourceIndices'] == [0]
    assert result['sources'][0]['url'] == 'https://example.org/source'
    metadata.grounding_supports = []
    with pytest.raises(ProviderUnavailable,match='complete source evidence'):
        grounded_report(response)
    for value in ['http://example.org','javascript:alert(1)','https://127.0.0.1/private','https://10.0.0.2','https://localhost','https://user:password@example.org']:
        assert not public_url(value)
