from flask import Blueprint, jsonify
from app.services.template_renderer import get_available_templates

templates_bp = Blueprint('templates', __name__, url_prefix='/api/v1/templates')

@templates_bp.route('', methods=['GET'])
def list_templates():
    return jsonify(get_available_templates()), 200

