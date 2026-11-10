import os
from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.models import db, DocumentTemplate
from app.services.template_renderer import get_available_templates

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize Database
    try:
        db.init_app(app)
        with app.app_context():
            db.create_all()
            _seed_default_templates()
    except Exception as e:
        print(f"Warning: Primary DB connection failed ({e}). Falling back to local SQLite database.")
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///applymate.db'
        db.init_app(app)
        with app.app_context():
            db.create_all()
            _seed_default_templates()

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.profile import profile_bp
    from app.routes.imports import imports_bp
    from app.routes.jobs import jobs_bp
    from app.routes.resumes import resumes_bp
    from app.routes.cover_letters import cover_letters_bp
    from app.routes.exports import exports_bp
    from app.routes.applications import applications_bp
    from app.routes.templates import templates_bp
    from app.routes.me import me_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(imports_bp)
    app.register_blueprint(jobs_bp)
    app.register_blueprint(resumes_bp)
    app.register_blueprint(cover_letters_bp)
    app.register_blueprint(exports_bp)
    app.register_blueprint(applications_bp)
    app.register_blueprint(templates_bp)
    app.register_blueprint(me_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'product': 'ApplyMate',
            'version': '1.0.0'
        }), 200

    return app

def _seed_default_templates():
    templates = get_available_templates()
    for t in templates:
        existing = db.session.get(DocumentTemplate, t['id'])
        if not existing:
            tmpl = DocumentTemplate(
                id=t['id'],
                slug=t['slug'],
                name=t['name'],
                version=t['version'],
                configuration_json=t['configuration'],
                is_active=True
            )
            db.session.add(tmpl)
    db.session.commit()
