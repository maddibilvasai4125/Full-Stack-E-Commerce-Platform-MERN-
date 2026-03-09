"""
============================================================
BREW-N-FILL® | Smart E-Commerce Platform
Flask ML Microservice — Sentiment Analysis + Recommendations
============================================================
Bridges Python ML ecosystem to the Node.js MERN backend.
Runs on port 5000 inside Docker or standalone.
============================================================
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import re
import os

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────
# Simple Rule-Based Sentiment Engine
# (Replace with transformers/HuggingFace in production)
# ─────────────────────────────────────────
POSITIVE_WORDS = {
    'love', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
    'awesome', 'good', 'happy', 'delicious', 'perfect', 'best',
    'brilliant', 'outstanding', 'superb', 'enjoy', 'nice', 'smooth',
    'rich', 'fresh', 'quality', 'recommend', 'helpful', 'quick', 'fast'
}

NEGATIVE_WORDS = {
    'bad', 'terrible', 'awful', 'horrible', 'disappointed', 'worst',
    'hate', 'disgusting', 'slow', 'broken', 'wrong', 'issue', 'problem',
    'refund', 'cancel', 'complaint', 'angry', 'rude', 'failed', 'error',
    'late', 'delay', 'never', 'poor', 'stale', 'cold', 'unhappy'
}

def analyze_text_sentiment(text: str) -> dict:
    """
    Analyzes sentiment of the given text.
    Returns label (POSITIVE / NEGATIVE / NEUTRAL) and confidence score.
    """
    text_lower = text.lower()
    words      = set(re.findall(r'\b\w+\b', text_lower))

    pos_hits = len(words & POSITIVE_WORDS)
    neg_hits = len(words & NEGATIVE_WORDS)

    if pos_hits > neg_hits:
        label      = 'POSITIVE'
        confidence = round(min(0.65 + pos_hits * 0.08, 0.98), 2)
        emotion    = 'joy'
    elif neg_hits > pos_hits:
        label      = 'NEGATIVE'
        confidence = round(min(0.65 + neg_hits * 0.08, 0.98), 2)
        emotion    = 'anger' if neg_hits > 2 else 'sadness'
    else:
        label      = 'NEUTRAL'
        confidence = round(random.uniform(0.55, 0.72), 2)
        emotion    = 'neutral'

    return {
        'label':      label,
        'score':      confidence,
        'emotion':    emotion,
        'pos_signals': pos_hits,
        'neg_signals': neg_hits,
    }


# ─────────────────────────────────────────
# Product Recommendation Engine
# ─────────────────────────────────────────
PRODUCT_CATALOG = [
    {'id': 1, 'name': 'Premium Arabica Blend',     'category': 'blend',    'price': 499, 'tags': ['smooth', 'medium', 'popular']},
    {'id': 2, 'name': 'Cold Brew Concentrate',      'category': 'cold',     'price': 349, 'tags': ['cold', 'refreshing', 'summer']},
    {'id': 3, 'name': 'Signature Espresso Roast',   'category': 'espresso', 'price': 599, 'tags': ['dark', 'intense', 'espresso']},
    {'id': 4, 'name': 'Single Origin Ethiopia',     'category': 'origin',   'price': 749, 'tags': ['fruity', 'floral', 'premium']},
    {'id': 5, 'name': 'Instant Coffee Powder 200g', 'category': 'instant',  'price': 199, 'tags': ['quick', 'convenient', 'everyday']},
    {'id': 6, 'name': 'Decaf Mountain Blend',       'category': 'decaf',    'price': 449, 'tags': ['decaf', 'smooth', 'evening']},
    {'id': 7, 'name': 'French Press Dark Roast',    'category': 'blend',    'price': 399, 'tags': ['dark', 'bold', 'french-press']},
    {'id': 8, 'name': 'Brew-n-Fill Gift Box',       'category': 'gift',     'price': 999, 'tags': ['gift', 'premium', 'variety']},
]

def get_recommendations(history: list, limit: int = 3) -> list:
    """
    Returns product recommendations based on purchase/view history.
    Simple collaborative filtering — extend with ML model for production.
    """
    if not history:
        # Return top 3 by popularity when no history
        return PRODUCT_CATALOG[:limit]

    viewed_ids       = {item.get('product_id') for item in history}
    viewed_categories = {
        p['category'] for p in PRODUCT_CATALOG
        if p['id'] in viewed_ids
    }

    # Recommend products from same categories, not already viewed
    recommendations = [
        p for p in PRODUCT_CATALOG
        if p['id'] not in viewed_ids and p['category'] in viewed_categories
    ]

    if len(recommendations) < limit:
        # Fill with popular items
        remaining = [p for p in PRODUCT_CATALOG if p['id'] not in viewed_ids]
        recommendations += remaining[:limit - len(recommendations)]

    return recommendations[:limit]


# ─────────────────────────────────────────
# API ROUTES
# ─────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status':  'ok',
        'service': 'BREW-N-FILL® Flask ML Service',
        'version': '1.0.0',
    })


@app.route('/analyze-sentiment', methods=['POST'])
def sentiment():
    """
    POST /analyze-sentiment
    Body: { "message": "I love this coffee!" }
    Returns: { "sentiment": "POSITIVE", "confidence": 0.92, "emotion": "joy" }
    """
    data = request.get_json()

    if not data or 'message' not in data:
        return jsonify({'error': 'Request body must include "message" field.'}), 400

    message = str(data['message']).strip()
    if not message:
        return jsonify({'error': 'Message cannot be empty.'}), 400

    result = analyze_text_sentiment(message)

    return jsonify({
        'sentiment':   result['label'],
        'confidence':  result['score'],
        'emotion':     result['emotion'],
        'analysis': {
            'positive_signals': result['pos_signals'],
            'negative_signals': result['neg_signals'],
        }
    })


@app.route('/recommendations', methods=['POST'])
def recommendations():
    """
    POST /recommendations
    Body: { "history": [{ "product_id": 1 }, { "product_id": 3 }] }
    Returns: { "recommended": [...products] }
    """
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body required.'}), 400

    history = data.get('history', [])
    limit   = int(data.get('limit', 3))
    products = get_recommendations(history, limit)

    return jsonify({
        'recommended': products,
        'count':       len(products),
    })


@app.route('/analyze-batch', methods=['POST'])
def analyze_batch():
    """
    POST /analyze-batch
    Analyze sentiment for multiple messages (e.g., review batch processing).
    Body: { "messages": ["great coffee!", "terrible service", "okay"] }
    """
    data = request.get_json()

    if not data or 'messages' not in data:
        return jsonify({'error': '"messages" array required.'}), 400

    results = []
    for msg in data['messages']:
        r = analyze_text_sentiment(str(msg))
        results.append({
            'message':    msg,
            'sentiment':  r['label'],
            'confidence': r['score'],
            'emotion':    r['emotion'],
        })

    summary = {
        'total':    len(results),
        'positive': sum(1 for r in results if r['sentiment'] == 'POSITIVE'),
        'negative': sum(1 for r in results if r['sentiment'] == 'NEGATIVE'),
        'neutral':  sum(1 for r in results if r['sentiment'] == 'NEUTRAL'),
    }

    return jsonify({'results': results, 'summary': summary})


# ─────────────────────────────────────────
# Start Flask Server
# ─────────────────────────────────────────
if __name__ == '__main__':
    port  = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'

    print(f"""
╔══════════════════════════════════════════╗
║  🐍 BREW-N-FILL® Flask ML Service       ║
║  🚀 Running on http://0.0.0.0:{port}       ║
║  📊 Sentiment + Recommendations API     ║
╚══════════════════════════════════════════╝
    """)

    app.run(host='0.0.0.0', port=port, debug=debug)
