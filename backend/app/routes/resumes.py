from flask import Blueprint, request, jsonify, g
from app.models import (
    db, ResumeDocument, ResumeVersion, AiSuggestion, CareerProfile, ProfileFact, Job
)
from app.utils.auth_guard import require_auth
from app.services.template_renderer import build_semantic_document_from_profile
from datetime import datetime

resumes_bp = Blueprint('resumes', __name__, url_prefix='/api/v1/resumes')

@resumes_bp.route('', methods=['GET'])
@require_auth
def list_resumes():
    resumes = ResumeDocument.query.filter_by(user_id=g.user_id).order_by(ResumeDocument.updated_at.desc()).all()
    return jsonify([r.to_dict(include_versions=False, include_suggestions=False) for r in resumes]), 200

@resumes_bp.route('', methods=['POST'])
@require_auth
def create_master_resume():
    """
    Creates or updates the user's Master Resume document directly from their Career Profile.
    """
    profile = CareerProfile.query.filter_by(user_id=g.user_id).first()
    if not profile:
        return jsonify({'error': 'Career profile not found'}), 404
        
    facts = ProfileFact.query.filter_by(profile_id=profile.id).all()
    links = profile.links
    
    doc_json = build_semantic_document_from_profile(profile, facts, links)
    
    # Check if a Master Resume already exists
    master_doc = ResumeDocument.query.filter_by(user_id=g.user_id, is_master=True).first()
    if not master_doc:
        master_doc = ResumeDocument(
            user_id=g.user_id,
            job_id=None,
            title="Master Career Resume",
            template_id=profile.default_template_id or 'modern-ats',
            document_json=doc_json,
            is_master=True
        )
        db.session.add(master_doc)
        db.session.flush()
        
        v1 = ResumeVersion(
            resume_document_id=master_doc.id,
            version_number=1,
            document_json=doc_json,
            change_summary="Initial Master Resume generated from Career Profile"
        )
        db.session.add(v1)
        db.session.flush()
        master_doc.current_version_id = v1.id
    else:
        master_doc.document_json = doc_json
        master_doc.updated_at = datetime.utcnow()
        latest_v = db.session.query(db.func.max(ResumeVersion.version_number)).filter_by(resume_document_id=master_doc.id).scalar() or 0
        new_v = ResumeVersion(
            resume_document_id=master_doc.id,
            version_number=latest_v + 1,
            document_json=doc_json,
            change_summary="Updated from Master Career Profile"
        )
        db.session.add(new_v)
        db.session.flush()
        master_doc.current_version_id = new_v.id
        
    db.session.commit()
    return jsonify(master_doc.to_dict(include_versions=True, include_suggestions=False)), 201

@resumes_bp.route('/<resume_id>', methods=['GET'])
@require_auth
def get_resume(resume_id):
    resume = ResumeDocument.query.filter_by(id=resume_id, user_id=g.user_id).first()
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    return jsonify(resume.to_dict(include_versions=True, include_suggestions=True)), 200

@resumes_bp.route('/<resume_id>', methods=['PATCH'])
@require_auth
def update_resume(resume_id):
    """
    Autosave or manual update of the resume document model.
    Allows changing template_id, title, section_order, visibility, and text content.
    """
    resume = ResumeDocument.query.filter_by(id=resume_id, user_id=g.user_id).first()
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
        
    data = request.get_json() or {}
    
    if 'title' in data:
        resume.title = data['title'].strip()
    if 'template_id' in data:
        resume.template_id = data['template_id'].strip()
    if 'document_json' in data:
        resume.document_json = data['document_json']
        
    resume.updated_at = datetime.utcnow()
    
    # Check if a snapshot should be created
    if data.get('create_version_snapshot'):
        latest_v = db.session.query(db.func.max(ResumeVersion.version_number)).filter_by(resume_document_id=resume.id).scalar() or 0
        new_v = ResumeVersion(
            resume_document_id=resume.id,
            version_number=latest_v + 1,
            document_json=resume.document_json,
            change_summary=data.get('change_summary', 'User manual revision')
        )
        db.session.add(new_v)
        db.session.flush()
        resume.current_version_id = new_v.id

    db.session.commit()
    return jsonify(resume.to_dict(include_versions=False, include_suggestions=True)), 200

@resumes_bp.route('/<resume_id>/suggestions/<suggestion_id>/review', methods=['POST'])
@require_auth
def review_suggestion(resume_id, suggestion_id):
    """
    Reviews a specific AI suggestion (Accept, Reject, or Edit).
    Upon acceptance or edit, mutates the document_json in a controlled, safe way.
    """
    resume = ResumeDocument.query.filter_by(id=resume_id, user_id=g.user_id).first()
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
        
    sugg_record = AiSuggestion.query.filter_by(id=suggestion_id, resume_document_id=resume.id).first()
    if not sugg_record:
        return jsonify({'error': 'Suggestion record not found'}), 404
        
    data = request.get_json() or {}
    action = data.get('action') # 'accept' | 'reject' | 'edit'
    item_type = data.get('item_type') # 'summary' | 'bullet' | 'skills' | 'section_order'
    item_index = data.get('item_index', 0)
    edited_text = data.get('edited_text')
    
    doc_json = dict(resume.document_json)
    sugg_json = sugg_record.suggestion_json or {}
    
    if action == 'accept':
        if item_type == 'summary':
            summary_text = sugg_json.get('summary_suggestion', {}).get('text')
            if summary_text:
                doc_json['summary'] = summary_text
        elif item_type == 'bullet':
            bullets = sugg_json.get('bullet_suggestions', [])
            if 0 <= item_index < len(bullets):
                target = bullets[item_index]
                sec = target.get('section')
                orig = target.get('original_text')
                repl = target.get('suggested_text')
                
                # Replace in matching project or experience bullet
                if sec in doc_json:
                    for item in doc_json[sec]:
                        if orig in item.get('bullets', []):
                            idx = item['bullets'].index(orig)
                            item['bullets'][idx] = repl
                            break
        elif item_type == 'section_order':
            rec_order = sugg_json.get('recommended_section_order')
            if rec_order:
                doc_json['section_order'] = rec_order
                
    elif action == 'edit' and edited_text:
        if item_type == 'summary':
            doc_json['summary'] = edited_text
        elif item_type == 'bullet':
            bullets = sugg_json.get('bullet_suggestions', [])
            if 0 <= item_index < len(bullets):
                target = bullets[item_index]
                sec = target.get('section')
                orig = target.get('original_text')
                if sec in doc_json:
                    for item in doc_json[sec]:
                        if orig in item.get('bullets', []):
                            idx = item['bullets'].index(orig)
                            item['bullets'][idx] = edited_text
                            break

    # Save document with changes
    resume.document_json = doc_json
    resume.updated_at = datetime.utcnow()
    
    # Create version record on suggestion approval
    if action in ('accept', 'edit'):
        latest_v = db.session.query(db.func.max(ResumeVersion.version_number)).filter_by(resume_document_id=resume.id).scalar() or 0
        new_v = ResumeVersion(
            resume_document_id=resume.id,
            version_number=latest_v + 1,
            document_json=doc_json,
            change_summary=f"Approved AI suggestion for {item_type}"
        )
        db.session.add(new_v)
        db.session.flush()
        resume.current_version_id = new_v.id

    db.session.commit()
    return jsonify({
        'message': f"Suggestion {action}ed successfully",
        'resume': resume.to_dict(include_versions=True, include_suggestions=True)
    }), 200

@resumes_bp.route('/<resume_id>/versions', methods=['GET'])
@require_auth
def get_resume_versions(resume_id):
    resume = ResumeDocument.query.filter_by(id=resume_id, user_id=g.user_id).first()
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
        
    versions = ResumeVersion.query.filter_by(resume_document_id=resume.id).order_by(ResumeVersion.version_number.desc()).all()
    return jsonify([v.to_dict() for v in versions]), 200

@resumes_bp.route('/<resume_id>/restore/<version_id>', methods=['POST'])
@require_auth
def restore_version(resume_id, version_id):
    """
    Restoring a document version creates a new current version; it does not erase history.
    """
    resume = ResumeDocument.query.filter_by(id=resume_id, user_id=g.user_id).first()
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
        
    target_version = ResumeVersion.query.filter_by(id=version_id, resume_document_id=resume.id).first()
    if not target_version:
        return jsonify({'error': 'Target version not found'}), 404
        
    latest_v = db.session.query(db.func.max(ResumeVersion.version_number)).filter_by(resume_document_id=resume.id).scalar() or 0
    new_v = ResumeVersion(
        resume_document_id=resume.id,
        version_number=latest_v + 1,
        document_json=target_version.document_json,
        change_summary=f"Restored from version {target_version.version_number}"
    )
    db.session.add(new_v)
    db.session.flush()
    
    resume.document_json = target_version.document_json
    resume.current_version_id = new_v.id
    resume.updated_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify({
        'message': f'Successfully restored to version {target_version.version_number}',
        'resume': resume.to_dict(include_versions=True, include_suggestions=True)
    }), 200

@resumes_bp.route('/<resume_id>', methods=['DELETE'])
@require_auth
def delete_resume(resume_id):
    resume = ResumeDocument.query.filter_by(id=resume_id, user_id=g.user_id).first()
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
        
    db.session.delete(resume)
    db.session.commit()
    return jsonify({'message': 'Resume deleted successfully'}), 200

