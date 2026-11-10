from flask import Blueprint, jsonify, g
from app.models import db, CareerProfile, ProfileFact, Job, Application, ResumeDocument, CoverLetter, User
from app.utils.auth_guard import require_auth

me_bp = Blueprint('me', __name__, url_prefix='/api/v1/me')

def calculate_profile_completeness(profile, facts):
    score = 0
    missing = []
    
    # 1. Contact info (name, email, headline)
    if profile.name and profile.email and profile.headline:
        score += 25
    else:
        missing.append("Complete contact details & headline")
        
    # 2. Professional summary
    if profile.summary and len(profile.summary.strip()) > 30:
        score += 15
    else:
        missing.append("Add a professional summary")
        
    # 3. Skills
    skills_count = sum(1 for f in facts if f.type == 'skill')
    if skills_count >= 5:
        score += 20
    elif skills_count > 0:
        score += 10
        missing.append("Add at least 5 core skills")
    else:
        missing.append("Add core skills")
        
    # 4. Experience or Projects
    has_exp = any(f.type == 'experience' for f in facts)
    has_proj = any(f.type == 'project' for f in facts)
    if has_exp:
        score += 20
    elif has_proj:
        score += 20
    else:
        missing.append("Add work experience or projects")
        
    # 5. Education
    if any(f.type == 'education' for f in facts):
        score += 10
    else:
        missing.append("Add education details")
        
    # 6. Links
    if profile.links:
        score += 10
    else:
        missing.append("Add professional links (LinkedIn / GitHub / Portfolio)")
        
    return min(100, score), missing

@me_bp.route('', methods=['GET'])
@require_auth
def get_dashboard_summary():
    user = g.current_user
    profile = CareerProfile.query.filter_by(user_id=user.id).first()
    facts = ProfileFact.query.filter_by(profile_id=profile.id).all() if profile else []
    
    completeness, missing_sections = calculate_profile_completeness(profile, facts) if profile else (0, ["Create profile"])
    
    # Recent applications
    apps = Application.query.filter_by(user_id=user.id).order_by(Application.updated_at.desc()).limit(5).all()
    
    # Recent resume drafts
    resumes = ResumeDocument.query.filter_by(user_id=user.id).order_by(ResumeDocument.updated_at.desc()).limit(4).all()
    
    # Counts
    total_apps = Application.query.filter_by(user_id=user.id).count()
    applied_count = Application.query.filter_by(user_id=user.id, status='Applied').count()
    interview_count = Application.query.filter_by(user_id=user.id, status='Interview').count()
    offer_count = Application.query.filter_by(user_id=user.id, status='Offer').count()
    
    return jsonify({
        'user': user.to_dict(),
        'profile_completeness': {
            'score': completeness,
            'missing_sections': missing_sections
        },
        'stats': {
            'total_applications': total_apps,
            'applied': applied_count,
            'interview': interview_count,
            'offer': offer_count,
            'total_resumes': ResumeDocument.query.filter_by(user_id=user.id).count(),
            'total_cover_letters': CoverLetter.query.filter_by(user_id=user.id).count()
        },
        'recent_applications': [a.to_dict() for a in apps],
        'recent_resumes': [r.to_dict(include_versions=False, include_suggestions=False) for r in resumes]
    }), 200

@me_bp.route('/export-data', methods=['GET'])
@require_auth
def export_user_data():
    """Privacy & GDPR data export."""
    user = g.current_user
    profile = CareerProfile.query.filter_by(user_id=user.id).first()
    jobs = Job.query.filter_by(user_id=user.id).all()
    resumes = ResumeDocument.query.filter_by(user_id=user.id).all()
    cls = CoverLetter.query.filter_by(user_id=user.id).all()
    apps = Application.query.filter_by(user_id=user.id).all()
    
    data = {
        'user': user.to_dict(),
        'profile': profile.to_dict(include_facts=True) if profile else None,
        'jobs': [j.to_dict(include_latest_analysis=True) for j in jobs],
        'resumes': [r.to_dict(include_versions=True, include_suggestions=True) for r in resumes],
        'cover_letters': [c.to_dict(include_versions=True) for c in cls],
        'applications': [a.to_dict() for a in apps]
    }
    return jsonify(data), 200

@me_bp.route('', methods=['DELETE'])
@require_auth
def delete_account():
    """Privacy & GDPR permanent account deletion."""
    user = g.current_user
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Account and all associated data permanently deleted.'}), 200

