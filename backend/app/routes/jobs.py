from flask import Blueprint, request, jsonify, g
from app.models import (
    db, Job, JobAnalysis, JobMatch, CareerProfile, ProfileFact, 
    ResumeDocument, ResumeVersion, AiSuggestion, CoverLetter, CoverLetterVersion, Application
)
from app.utils.auth_guard import require_auth
from app.services.job_parser import fetch_job_from_url, parse_job_requirements
from app.services.matching_engine import analyze_profile_matches, calculate_alignment_score
from app.services.ai_adapter import AiAdapter
from app.services.template_renderer import build_semantic_document_from_profile
from datetime import datetime

jobs_bp = Blueprint('jobs', __name__, url_prefix='/api/v1/jobs')
ai_adapter = AiAdapter()

@jobs_bp.route('', methods=['POST'])
@require_auth
def create_job():
    data = request.get_json() or {}
    company = data.get('company', '').strip()
    title = data.get('title', '').strip()
    description = data.get('description_text', '').strip()
    
    if not company:
        return jsonify({'error': 'Company name is required.'}), 400
    if not title:
        return jsonify({'error': 'Job title is required.'}), 400
    if not description or len(description) < 40:
        return jsonify({'error': 'Job description is too short. Please paste at least a paragraph.'}), 400
        
    job = Job(
        user_id=g.user_id,
        company=company,
        title=title,
        description_text=description,
        source_url=data.get('source_url', '').strip(),
        location=data.get('location', '').strip(),
        employment_type=data.get('employment_type', '').strip(),
        source=data.get('source', '').strip()
    )
    db.session.add(job)
    db.session.flush()
    
    # Automatically perform initial analysis
    parsed = parse_job_requirements(job.description_text, job.title, job.company)
    analysis = JobAnalysis(
        job_id=job.id,
        role_summary=parsed['role_summary'],
        seniority_level=parsed['seniority_level'],
        required_skills=parsed['required_skills'],
        preferred_skills=parsed['preferred_skills'],
        responsibilities=parsed['responsibilities'],
        keywords=parsed['keywords']
    )
    db.session.add(analysis)
    db.session.flush()
    
    # Run profile-to-job matching
    profile = CareerProfile.query.filter_by(user_id=g.user_id).first()
    facts = ProfileFact.query.filter_by(profile_id=profile.id).all() if profile else []
    matches = analyze_profile_matches(parsed, facts)
    for m in matches:
        db.session.add(JobMatch(
            analysis_id=analysis.id,
            requirement_key=m['requirement_key'],
            requirement_type=m['requirement_type'],
            match_status=m['match_status'],
            evidence_fact_ids=m['evidence_fact_ids'],
            explanation=m['explanation'],
            recommendation=m['recommendation']
        ))

    # Also automatically create an Application entry in Draft status
    app_entry = Application(
        user_id=g.user_id,
        job_id=job.id,
        status='Draft'
    )
    db.session.add(app_entry)
    
    db.session.commit()
    return jsonify(job.to_dict(include_latest_analysis=True)), 201

@jobs_bp.route('/import-url', methods=['POST'])
@require_auth
def import_job_url():
    data = request.get_json() or {}
    url = data.get('url', '').strip()
    if not url:
        return jsonify({'error': 'URL is required'}), 400
        
    success, result, detected_title = fetch_job_from_url(url)
    if not success:
        return jsonify({'error': result, 'is_blocked_or_failed': True}), 422
        
    return jsonify({
        'extracted_text': result,
        'detected_title': detected_title,
        'source_url': url
    }), 200

@jobs_bp.route('', methods=['GET'])
@require_auth
def list_jobs():
    jobs = Job.query.filter_by(user_id=g.user_id).order_by(Job.created_at.desc()).all()
    return jsonify([j.to_dict(include_latest_analysis=True) for j in jobs]), 200

@jobs_bp.route('/<job_id>', methods=['GET'])
@require_auth
def get_job(job_id):
    job = Job.query.filter_by(id=job_id, user_id=g.user_id).first()
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    return jsonify(job.to_dict(include_latest_analysis=True)), 200

@jobs_bp.route('/<job_id>/analyse', methods=['POST'])
@require_auth
def run_job_analysis(job_id):
    job = Job.query.filter_by(id=job_id, user_id=g.user_id).first()
    if not job:
        return jsonify({'error': 'Job not found'}), 404
        
    parsed = parse_job_requirements(job.description_text, job.title, job.company)
    latest_v = db.session.query(db.func.max(JobAnalysis.analysis_version)).filter_by(job_id=job.id).scalar() or 0
    
    analysis = JobAnalysis(
        job_id=job.id,
        role_summary=parsed['role_summary'],
        seniority_level=parsed['seniority_level'],
        required_skills=parsed['required_skills'],
        preferred_skills=parsed['preferred_skills'],
        responsibilities=parsed['responsibilities'],
        keywords=parsed['keywords'],
        analysis_version=latest_v + 1
    )
    db.session.add(analysis)
    db.session.flush()
    
    profile = CareerProfile.query.filter_by(user_id=g.user_id).first()
    facts = ProfileFact.query.filter_by(profile_id=profile.id).all() if profile else []
    matches = analyze_profile_matches(parsed, facts)
    for m in matches:
        db.session.add(JobMatch(
            analysis_id=analysis.id,
            requirement_key=m['requirement_key'],
            requirement_type=m['requirement_type'],
            match_status=m['match_status'],
            evidence_fact_ids=m['evidence_fact_ids'],
            explanation=m['explanation'],
            recommendation=m['recommendation']
        ))
        
    db.session.commit()
    return jsonify(analysis.to_dict(include_matches=True)), 200

@jobs_bp.route('/<job_id>/matches', methods=['GET'])
@require_auth
def get_job_matches(job_id):
    job = Job.query.filter_by(id=job_id, user_id=g.user_id).first()
    if not job:
        return jsonify({'error': 'Job not found'}), 404
        
    latest_analysis = JobAnalysis.query.filter_by(job_id=job.id).order_by(JobAnalysis.created_at.desc()).first()
    if not latest_analysis:
        return jsonify({'matches': [], 'score_data': {}}), 200
        
    matches_list = [m.to_dict() for m in latest_analysis.matches]
    score_data = calculate_alignment_score(matches_list)
    
    return jsonify({
        'analysis_id': latest_analysis.id,
        'role_summary': latest_analysis.role_summary,
        'seniority_level': latest_analysis.seniority_level,
        'required_skills': latest_analysis.required_skills,
        'preferred_skills': latest_analysis.preferred_skills,
        'keywords': latest_analysis.keywords,
        'matches': matches_list,
        'score_data': score_data
    }), 200

@jobs_bp.route('/<job_id>/resume-draft', methods=['POST'])
@require_auth
def generate_resume_draft(job_id):
    """
    Generates a tailored resume document for the target job without altering the Master Career Profile.
    Strictly attaches suggestions to verified profile facts.
    """
    job = Job.query.filter_by(id=job_id, user_id=g.user_id).first()
    if not job:
        return jsonify({'error': 'Job not found'}), 404
        
    profile = CareerProfile.query.filter_by(user_id=g.user_id).first()
    if not profile:
        profile = CareerProfile(user_id=g.user_id, email=g.current_user.email, name=g.current_user.name)
        db.session.add(profile)
        db.session.flush()
        
    facts = ProfileFact.query.filter_by(profile_id=profile.id).all()
    links = profile.links
    
    # 1. Build initial semantic document model
    doc_json = build_semantic_document_from_profile(profile, facts, links, job.title, job.company)
    
    # 2. Request AI tailored suggestions
    suggestions = ai_adapter.generate_tailored_suggestions(
        job_title=job.title,
        company=job.company,
        job_description=job.description_text,
        profile_dict=profile.to_dict(include_facts=False),
        profile_facts=facts
    )
    
    # 3. Create a new ResumeDocument attached to this job
    resume_doc = ResumeDocument(
        user_id=g.user_id,
        job_id=job.id,
        title=f"{job.company} — {job.title} Resume",
        template_id=profile.default_template_id or 'modern-ats',
        document_json=doc_json,
        is_master=False
    )
    db.session.add(resume_doc)
    db.session.flush()
    
    # 4. Save Version 1
    v1 = ResumeVersion(
        resume_document_id=resume_doc.id,
        version_number=1,
        document_json=doc_json,
        change_summary="Initial tailored draft generated from Master Profile"
    )
    db.session.add(v1)
    db.session.flush()
    resume_doc.current_version_id = v1.id
    
    # 5. Save AI Suggestions for review
    ai_sugg = AiSuggestion(
        resume_document_id=resume_doc.id,
        suggestion_json=suggestions,
        status='pending'
    )
    db.session.add(ai_sugg)
    
    # 6. Update Application tracker to point to this resume
    app_entry = Application.query.filter_by(user_id=g.user_id, job_id=job.id).first()
    if app_entry:
        app_entry.resume_document_id = resume_doc.id
        app_entry.updated_at = datetime.utcnow()
        
    db.session.commit()
    
    return jsonify({
        'resume_id': resume_doc.id,
        'resume': resume_doc.to_dict(include_versions=True, include_suggestions=True)
    }), 201

@jobs_bp.route('/<job_id>/cover-letter', methods=['POST'])
@require_auth
def generate_cover_letter_draft(job_id):
    """
    Generates a tailored cover letter draft based on job requirements and verified profile facts.
    """
    job = Job.query.filter_by(id=job_id, user_id=g.user_id).first()
    if not job:
        return jsonify({'error': 'Job not found'}), 404
        
    profile = CareerProfile.query.filter_by(user_id=g.user_id).first()
    if not profile:
        profile = CareerProfile(user_id=g.user_id, email=g.current_user.email, name=g.current_user.name)
        db.session.add(profile)
        db.session.flush()
        
    data = request.get_json() or {}
    tone = data.get('tone', 'Professional')
    length = data.get('length', 'Standard')
    
    facts = ProfileFact.query.filter_by(profile_id=profile.id).all()
    
    cl_content = ai_adapter.generate_cover_letter(
        job_title=job.title,
        company=job.company,
        job_description=job.description_text,
        profile_dict=profile.to_dict(include_facts=False),
        profile_facts=facts,
        tone=tone,
        length=length
    )
    
    # Check if a cover letter already exists for this job, or create new
    existing_cl = CoverLetter.query.filter_by(user_id=g.user_id, job_id=job.id).first()
    if existing_cl:
        existing_cl.title = f"{job.company} — Cover Letter"
        existing_cl.tone = tone
        existing_cl.length = length
        existing_cl.content_json = cl_content
        existing_cl.updated_at = datetime.utcnow()
        
        # Save new version
        latest_v = db.session.query(db.func.max(CoverLetterVersion.version_number)).filter_by(cover_letter_id=existing_cl.id).scalar() or 0
        new_v = CoverLetterVersion(
            cover_letter_id=existing_cl.id,
            version_number=latest_v + 1,
            content_json=cl_content
        )
        db.session.add(new_v)
        db.session.flush()
        existing_cl.current_version_id = new_v.id
        db.session.commit()
        return jsonify(existing_cl.to_dict(include_versions=True)), 200
        
    new_cl = CoverLetter(
        user_id=g.user_id,
        job_id=job.id,
        title=f"{job.company} — Cover Letter",
        tone=tone,
        length=length,
        content_json=cl_content
    )
    db.session.add(new_cl)
    db.session.flush()
    
    v1 = CoverLetterVersion(
        cover_letter_id=new_cl.id,
        version_number=1,
        content_json=cl_content
    )
    db.session.add(v1)
    db.session.flush()
    new_cl.current_version_id = v1.id
    
    # Link to application
    app_entry = Application.query.filter_by(user_id=g.user_id, job_id=job.id).first()
    if app_entry:
        app_entry.cover_letter_id = new_cl.id
        app_entry.updated_at = datetime.utcnow()
        
    db.session.commit()
    return jsonify(new_cl.to_dict(include_versions=True)), 201

@jobs_bp.route('/<job_id>', methods=['DELETE'])
@require_auth
def delete_job(job_id):
    job = Job.query.filter_by(id=job_id, user_id=g.user_id).first()
    if not job:
        return jsonify({'error': 'Job not found'}), 404
        
    db.session.delete(job)
    db.session.commit()
    return jsonify({'message': 'Job deleted successfully'}), 200

