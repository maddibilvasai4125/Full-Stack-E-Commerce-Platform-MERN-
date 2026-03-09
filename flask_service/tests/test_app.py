"""
Tests for BREW-N-FILL® Flask ML Microservice
Run: python -m pytest tests/ -v
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health(client):
    res = client.get('/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'ok'

def test_positive_sentiment(client):
    res = client.post('/analyze-sentiment', json={'message': 'I love this amazing coffee!'})
    assert res.status_code == 200
    data = res.get_json()
    assert data['sentiment'] == 'POSITIVE'

def test_negative_sentiment(client):
    res = client.post('/analyze-sentiment', json={'message': 'Terrible service, very bad experience'})
    assert res.status_code == 200
    data = res.get_json()
    assert data['sentiment'] == 'NEGATIVE'

def test_recommendations_empty_history(client):
    res = client.post('/recommendations', json={'history': []})
    assert res.status_code == 200
    data = res.get_json()
    assert len(data['recommended']) > 0

def test_missing_message(client):
    res = client.post('/analyze-sentiment', json={})
    assert res.status_code == 400
