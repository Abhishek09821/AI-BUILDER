from flask import Blueprint, request, jsonify, g
from app.models import db, Application, Job, ResumeDocument, CoverLetter
from app.utils.auth_guard import require_auth
from datetime import datetime

applications_bp = Blueprint('applications', __name__, url_prefix='/api/v1/applications')

VALID_STATUSES = [
    'Draft', 'Ready to apply', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'
]

@applications_bp.route('', methods=['GET'])
@require_auth
def list_applications():
    query = Application.query.filter_by(user_id=g.user_id)
    
    status_filter = request.args.get('status')
    if status_filter and status_filter in VALID_STATUSES:
        query = query.filter_by(status=status_filter)
        
    search_query = request.args.get('q', '').strip().lower()
    apps = query.order_by(Application.updated_at.desc()).all()
    
    results = []
    for a in apps:
        a_dict = a.to_dict()
        if search_query:
            comp = (a_dict.get('company') or '').lower()
            titl = (a_dict.get('title') or '').lower()
            if search_query not in comp and search_query not in titl:
                continue
        results.append(a_dict)
        
    return jsonify(results), 200

@applications_bp.route('', methods=['POST'])
@require_auth
def create_application():
    data = request.get_json() or {}
    job_id = data.get('job_id')
    if not job_id:
        return jsonify({'error': 'job_id is required'}), 400
        
    job = Job.query.filter_by(id=job_id, user_id=g.user_id).first()
    if not job:
        return jsonify({'error': 'Job not found'}), 404
        
    status = data.get('status', 'Draft')
    if status not in VALID_STATUSES:
        status = 'Draft'
        
    app_entry = Application(
        user_id=g.user_id,
        job_id=job.id,
        status=status,
        notes=data.get('notes'),
        resume_document_id=data.get('resume_document_id'),
        cover_letter_id=data.get('cover_letter_id')
    )
    db.session.add(app_entry)
    db.session.commit()
    return jsonify(app_entry.to_dict()), 201

@applications_bp.route('/<app_id>', methods=['PATCH'])
@require_auth
def update_application(app_id):
    app_entry = Application.query.filter_by(id=app_id, user_id=g.user_id).first()
    if not app_entry:
        return jsonify({'error': 'Application not found'}), 404
        
    data = request.get_json() or {}
    if 'status' in data:
        st = data['status']
        if st in VALID_STATUSES:
            app_entry.status = st
            if st == 'Applied' and not app_entry.applied_at:
                app_entry.applied_at = datetime.utcnow()
    if 'notes' in data:
        app_entry.notes = data['notes']
    if 'resume_document_id' in data:
        app_entry.resume_document_id = data['resume_document_id']
    if 'cover_letter_id' in data:
        app_entry.cover_letter_id = data['cover_letter_id']
    if 'follow_up_at' in data:
        dt_val = data['follow_up_at']
        app_entry.follow_up_at = datetime.fromisoformat(dt_val) if dt_val else None
    if 'applied_at' in data:
        dt_val = data['applied_at']
        app_entry.applied_at = datetime.fromisoformat(dt_val) if dt_val else None
        
    app_entry.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(app_entry.to_dict()), 200

@applications_bp.route('/<app_id>', methods=['DELETE'])
@require_auth
def delete_application(app_id):
    app_entry = Application.query.filter_by(id=app_id, user_id=g.user_id).first()
    if not app_entry:
        return jsonify({'error': 'Application not found'}), 404
        
    db.session.delete(app_entry)
    db.session.commit()
    return jsonify({'message': 'Application deleted successfully'}), 200

