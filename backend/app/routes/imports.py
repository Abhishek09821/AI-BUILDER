import os
from flask import Blueprint, request, jsonify, g
from app.models import db, ResumeImport, CareerProfile, ProfileFact, ProfileLink
from app.utils.auth_guard import require_auth
from app.utils.storage import allowed_file, save_uploaded_file, get_upload_path
from app.services.docx_service import parse_docx_resume
from app.services.pdf_service import parse_pdf_resume
from datetime import datetime

imports_bp = Blueprint('imports', __name__, url_prefix='/api/v1/imports')

@imports_bp.route('/resume', methods=['POST'])
@require_auth
def upload_resume_for_import():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
        
    file = request.files['file']
    if not file or not file.filename:
        return jsonify({'error': 'No selected file'}), 400
        
    if not allowed_file(file.filename):
        return jsonify({'error': 'Unsupported file format. Please upload a DOCX or readable PDF file.'}), 400
        
    try:
        storage_key, original_name, ext = save_uploaded_file(file, g.user_id)
        file_path = get_upload_path(storage_key)
        
        # Parse based on extension
        extracted_data = {}
        if ext == 'docx':
            extracted_data = parse_docx_resume(file_path)
        elif ext == 'pdf':
            extracted_data = parse_pdf_resume(file_path)
            
        import_rec = ResumeImport(
            user_id=g.user_id,
            storage_key=storage_key,
            file_name=original_name,
            file_type=ext,
            parse_status='staged',
            extracted_payload=extracted_data
        )
        db.session.add(import_rec)
        db.session.commit()
        
        return jsonify({
            'message': 'Resume parsed successfully and staged for review.',
            'import': import_rec.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to parse uploaded resume: {str(e)}'}), 500

@imports_bp.route('/<import_id>', methods=['GET'])
@require_auth
def get_import_details(import_id):
    import_rec = ResumeImport.query.filter_by(id=import_id, user_id=g.user_id).first()
    if not import_rec:
        return jsonify({'error': 'Import record not found'}), 404
    return jsonify(import_rec.to_dict()), 200

@imports_bp.route('/<import_id>/confirm', methods=['POST'])
@require_auth
def confirm_import(import_id):
    """
    Commits reviewed and user-approved extracted values into the Master Career Profile.
    Does NOT overwrite previously existing application documents.
    """
    import_rec = ResumeImport.query.filter_by(id=import_id, user_id=g.user_id).first()
    if not import_rec:
        return jsonify({'error': 'Import record not found'}), 404
        
    data = request.get_json() or {}
    approved_payload = data.get('approved_payload') or import_rec.extracted_payload or {}
    
    profile = CareerProfile.query.filter_by(user_id=g.user_id).first()
    if not profile:
        profile = CareerProfile(user_id=g.user_id, email=g.current_user.email)
        db.session.add(profile)
        db.session.flush()

    # 1. Update basic profile fields if approved and provided
    if approved_payload.get('name'):
        profile.name = approved_payload['name']
    if approved_payload.get('headline'):
        profile.headline = approved_payload['headline']
    if approved_payload.get('email'):
        profile.email = approved_payload['email']
    if approved_payload.get('phone'):
        profile.phone = approved_payload['phone']
    if approved_payload.get('city_country'):
        profile.city_country = approved_payload['city_country']
    if approved_payload.get('summary'):
        profile.summary = approved_payload['summary']
        
    # 2. Add Links
    for link in approved_payload.get('links', []):
        url = link.get('url')
        label = link.get('label', 'Link')
        if url:
            db.session.add(ProfileLink(
                profile_id=profile.id,
                label=label,
                url=url,
                link_type=link.get('link_type', 'other')
            ))

    # 3. Add Skills
    for skill in approved_payload.get('skills', []):
        s_name = skill.get('name') if isinstance(skill, dict) else str(skill)
        if s_name:
            db.session.add(ProfileFact(
                profile_id=profile.id,
                type='skill',
                data={'name': s_name, 'category': skill.get('category', 'General') if isinstance(skill, dict) else 'General'},
                source='import',
                verified_at=datetime.utcnow()
            ))

    # 4. Add Experiences
    for exp in approved_payload.get('experiences', []):
        db.session.add(ProfileFact(
            profile_id=profile.id,
            type='experience',
            data=exp,
            source='import',
            verified_at=datetime.utcnow()
        ))

    # 5. Add Projects
    for proj in approved_payload.get('projects', []):
        db.session.add(ProfileFact(
            profile_id=profile.id,
            type='project',
            data=proj,
            source='import',
            verified_at=datetime.utcnow()
        ))

    # 6. Add Education
    for edu in approved_payload.get('education', []):
        db.session.add(ProfileFact(
            profile_id=profile.id,
            type='education',
            data=edu,
            source='import',
            verified_at=datetime.utcnow()
        ))

    import_rec.parse_status = 'committed'
    db.session.commit()
    
    return jsonify({
        'message': 'Import successfully committed to your Master Career Profile.',
        'profile': profile.to_dict(include_facts=True)
    }), 200

