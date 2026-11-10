from flask import Blueprint, request, jsonify, g
from app.models import db, CareerProfile, ProfileFact, ProfileLink
from app.utils.auth_guard import require_auth
from datetime import datetime

profile_bp = Blueprint('profile', __name__, url_prefix='/api/v1/profile')

@profile_bp.route('', methods=['GET'])
@require_auth
def get_profile():
    profile = CareerProfile.query.filter_by(user_id=g.user_id).first()
    if not profile:
        profile = CareerProfile(user_id=g.user_id, email=g.current_user.email, name=g.current_user.name)
        db.session.add(profile)
        db.session.commit()
    return jsonify(profile.to_dict(include_facts=True)), 200

@profile_bp.route('', methods=['PUT'])
@require_auth
def update_profile():
    profile = CareerProfile.query.filter_by(user_id=g.user_id).first()
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
        
    data = request.get_json() or {}
    profile.name = data.get('name', profile.name)
    profile.headline = data.get('headline', profile.headline)
    profile.email = data.get('email', profile.email)
    profile.phone = data.get('phone', profile.phone)
    profile.city_country = data.get('city_country', profile.city_country)
    profile.portfolio_url = data.get('portfolio_url', profile.portfolio_url)
    profile.summary = data.get('summary', profile.summary)
    profile.default_template_id = data.get('default_template_id', profile.default_template_id)
    profile.updated_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify(profile.to_dict(include_facts=True)), 200

# Facts CRUD
@profile_bp.route('/facts', methods=['GET'])
@require_auth
def get_facts():
    profile = CareerProfile.query.filter_by(user_id=g.user_id).first()
    if not profile:
        return jsonify([]), 200
    facts = ProfileFact.query.filter_by(profile_id=profile.id).order_by(ProfileFact.sort_order.asc(), ProfileFact.created_at.desc()).all()
    return jsonify([f.to_dict() for f in facts]), 200

@profile_bp.route('/facts', methods=['POST'])
@require_auth
def create_fact():
    profile = CareerProfile.query.filter_by(user_id=g.user_id).first()
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
        
    data = request.get_json() or {}
    fact_type = data.get('type')
    payload = data.get('data')
    
    if not fact_type or payload is None:
        return jsonify({'error': 'Fact type and data are required'}), 400
        
    is_verified = data.get('is_verified', True)
    verified_at = datetime.utcnow() if is_verified else None
    
    max_order = db.session.query(db.func.max(ProfileFact.sort_order)).filter_by(profile_id=profile.id, type=fact_type).scalar() or 0
    
    fact = ProfileFact(
        profile_id=profile.id,
        type=fact_type,
        data=payload,
        source=data.get('source', 'manual'),
        verified_at=verified_at,
        sort_order=max_order + 1
    )
    db.session.add(fact)
    db.session.commit()
    return jsonify(fact.to_dict()), 201

@profile_bp.route('/facts/<fact_id>', methods=['PATCH'])
@require_auth
def update_fact(fact_id):
    profile = CareerProfile.query.filter_by(user_id=g.user_id).first()
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
        
    fact = ProfileFact.query.filter_by(id=fact_id, profile_id=profile.id).first()
    if not fact:
        return jsonify({'error': 'Fact not found'}), 404
        
    data = request.get_json() or {}
    if 'data' in data:
        fact.data = data['data']
    if 'sort_order' in data:
        fact.sort_order = data['sort_order']
    if 'is_verified' in data:
        fact.verified_at = datetime.utcnow() if data['is_verified'] else None
        
    db.session.commit()
    return jsonify(fact.to_dict()), 200

@profile_bp.route('/facts/<fact_id>', methods=['DELETE'])
@require_auth
def delete_fact(fact_id):
    profile = CareerProfile.query.filter_by(user_id=g.user_id).first()
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
        
    fact = ProfileFact.query.filter_by(id=fact_id, profile_id=profile.id).first()
    if not fact:
        return jsonify({'error': 'Fact not found'}), 404
        
    db.session.delete(fact)
    db.session.commit()
    return jsonify({'message': 'Fact deleted successfully'}), 200

# Links CRUD
@profile_bp.route('/links', methods=['POST'])
@require_auth
def create_link():
    profile = CareerProfile.query.filter_by(user_id=g.user_id).first()
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
        
    data = request.get_json() or {}
    label = data.get('label', '').strip()
    url = data.get('url', '').strip()
    if not label or not url:
        return jsonify({'error': 'Label and URL are required'}), 400
        
    link = ProfileLink(
        profile_id=profile.id,
        label=label,
        url=url,
        link_type=data.get('link_type', 'other'),
        sort_order=data.get('sort_order', 0)
    )
    db.session.add(link)
    db.session.commit()
    return jsonify(link.to_dict()), 201

@profile_bp.route('/links/<link_id>', methods=['PATCH'])
@require_auth
def update_link(link_id):
    profile = CareerProfile.query.filter_by(user_id=g.user_id).first()
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
        
    link = ProfileLink.query.filter_by(id=link_id, profile_id=profile.id).first()
    if not link:
        return jsonify({'error': 'Link not found'}), 404
        
    data = request.get_json() or {}
    if 'label' in data:
        link.label = data['label'].strip()
    if 'url' in data:
        link.url = data['url'].strip()
    if 'link_type' in data:
        link.link_type = data['link_type']
    if 'sort_order' in data:
        link.sort_order = data['sort_order']
        
    db.session.commit()
    return jsonify(link.to_dict()), 200

@profile_bp.route('/links/<link_id>', methods=['DELETE'])
@require_auth
def delete_link(link_id):
    profile = CareerProfile.query.filter_by(user_id=g.user_id).first()
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
        
    link = ProfileLink.query.filter_by(id=link_id, profile_id=profile.id).first()
    if not link:
        return jsonify({'error': 'Link not found'}), 404
        
    db.session.delete(link)
    db.session.commit()
    return jsonify({'message': 'Link deleted successfully'}), 200

