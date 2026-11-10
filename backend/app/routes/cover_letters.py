from flask import Blueprint, request, jsonify, g
from app.models import db, CoverLetter, CoverLetterVersion
from app.utils.auth_guard import require_auth
from datetime import datetime

cover_letters_bp = Blueprint('cover_letters', __name__, url_prefix='/api/v1/cover-letters')

@cover_letters_bp.route('', methods=['GET'])
@require_auth
def list_cover_letters():
    cls = CoverLetter.query.filter_by(user_id=g.user_id).order_by(CoverLetter.updated_at.desc()).all()
    return jsonify([c.to_dict(include_versions=False) for c in cls]), 200

@cover_letters_bp.route('/<cl_id>', methods=['GET'])
@require_auth
def get_cover_letter(cl_id):
    cl = CoverLetter.query.filter_by(id=cl_id, user_id=g.user_id).first()
    if not cl:
        return jsonify({'error': 'Cover letter not found'}), 404
    return jsonify(cl.to_dict(include_versions=True)), 200

@cover_letters_bp.route('/<cl_id>', methods=['PATCH'])
@require_auth
def update_cover_letter(cl_id):
    cl = CoverLetter.query.filter_by(id=cl_id, user_id=g.user_id).first()
    if not cl:
        return jsonify({'error': 'Cover letter not found'}), 404
        
    data = request.get_json() or {}
    if 'title' in data:
        cl.title = data['title'].strip()
    if 'tone' in data:
        cl.tone = data['tone']
    if 'length' in data:
        cl.length = data['length']
    if 'content_json' in data:
        cl.content_json = data['content_json']
        
    cl.updated_at = datetime.utcnow()
    
    if data.get('create_version_snapshot'):
        latest_v = db.session.query(db.func.max(CoverLetterVersion.version_number)).filter_by(cover_letter_id=cl.id).scalar() or 0
        new_v = CoverLetterVersion(
            cover_letter_id=cl.id,
            version_number=latest_v + 1,
            content_json=cl.content_json
        )
        db.session.add(new_v)
        db.session.flush()
        cl.current_version_id = new_v.id
        
    db.session.commit()
    return jsonify(cl.to_dict(include_versions=True)), 200

@cover_letters_bp.route('/<cl_id>/versions', methods=['GET'])
@require_auth
def list_cl_versions(cl_id):
    cl = CoverLetter.query.filter_by(id=cl_id, user_id=g.user_id).first()
    if not cl:
        return jsonify({'error': 'Cover letter not found'}), 404
        
    versions = CoverLetterVersion.query.filter_by(cover_letter_id=cl.id).order_by(CoverLetterVersion.version_number.desc()).all()
    return jsonify([v.to_dict() for v in versions]), 200

@cover_letters_bp.route('/<cl_id>', methods=['DELETE'])
@require_auth
def delete_cover_letter(cl_id):
    cl = CoverLetter.query.filter_by(id=cl_id, user_id=g.user_id).first()
    if not cl:
        return jsonify({'error': 'Cover letter not found'}), 404
        
    db.session.delete(cl)
    db.session.commit()
    return jsonify({'message': 'Cover letter deleted successfully'}), 200

