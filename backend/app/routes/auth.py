from flask import Blueprint, request, jsonify, g
from app.models import db, User, CareerProfile, DocumentTemplate
from app.utils.security import hash_password, verify_password, generate_jwt_token
from app.utils.auth_guard import require_auth
from datetime import datetime

auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    name = data.get('name', '').strip()
    
    if not email or '@' not in email:
        return jsonify({'error': 'A valid email address is required.'}), 400
    if not password or len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long.'}), 400
        
    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({'error': 'An account with this email address already exists.'}), 409
        
    pwd_hash = hash_password(password)
    new_user = User(
        email=email,
        password_hash=pwd_hash,
        name=name or email.split('@')[0].capitalize()
    )
    db.session.add(new_user)
    db.session.flush()
    
    # Initialize blank Career Profile
    profile = CareerProfile(
        user_id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        default_template_id='modern-ats'
    )
    db.session.add(profile)
    db.session.commit()
    
    token = generate_jwt_token(new_user.id, new_user.email)
    return jsonify({
        'message': 'Account created successfully.',
        'token': token,
        'user': new_user.to_dict(),
        'profile': profile.to_dict(include_facts=False)
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.password_hash):
        return jsonify({'error': 'Invalid email or password.'}), 401
        
    token = generate_jwt_token(user.id, user.email)
    profile = CareerProfile.query.filter_by(user_id=user.id).first()
    
    return jsonify({
        'message': 'Logged in successfully.',
        'token': token,
        'user': user.to_dict(),
        'profile': profile.to_dict(include_facts=False) if profile else None
    }), 200

@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_current_user():
    user = g.current_user
    profile = CareerProfile.query.filter_by(user_id=user.id).first()
    return jsonify({
        'user': user.to_dict(),
        'profile': profile.to_dict(include_facts=True) if profile else None
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    # Client will remove local token
    return jsonify({'message': 'Logged out successfully.'}), 200

