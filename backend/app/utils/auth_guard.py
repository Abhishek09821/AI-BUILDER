from functools import wraps
from flask import request, jsonify, g
import jwt
from app.utils.security import decode_jwt_token
from app.models import User

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Missing Authorization header'}), 401
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Invalid Authorization header format. Expected "Bearer <token>"'}), 401
        
        token = parts[1]
        try:
            payload = decode_jwt_token(token)
            user_id = payload.get('sub')
            from app.models import db
            user = db.session.get(User, user_id)
            if not user:
                return jsonify({'error': 'User not found or deactivated'}), 401
            
            g.current_user = user
            g.user_id = user.id
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Session expired. Please log in again.'}), 401
        except (jwt.InvalidTokenError, Exception) as e:
            return jsonify({'error': f'Invalid token: {str(e)}'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

def verify_ownership(resource, user_id=None):
    """
    Ensures the user owns the given resource.
    Raises an exception or returns False if user is not the owner.
    """
    uid = user_id or g.user_id
    if not resource:
        return False, jsonify({'error': 'Resource not found'}), 404
    if getattr(resource, 'user_id', None) != uid:
        return False, jsonify({'error': 'Forbidden: You do not have permission to access this resource'}), 403
    return True, None, 200
