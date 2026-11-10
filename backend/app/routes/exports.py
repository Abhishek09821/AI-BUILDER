import os
import uuid
from flask import Blueprint, request, jsonify, send_file, g
from app.models import db, ExportRecord, ResumeDocument, CoverLetter
from app.utils.auth_guard import require_auth
from app.utils.storage import get_export_path, init_storage_dirs
from app.services.docx_service import generate_resume_docx, generate_cover_letter_docx
from app.services.pdf_service import generate_resume_pdf, generate_cover_letter_pdf
from datetime import datetime

exports_bp = Blueprint('exports', __name__, url_prefix='/api/v1/exports')

@exports_bp.route('', methods=['POST'])
@require_auth
def create_export():
    init_storage_dirs()
    data = request.get_json() or {}
    doc_type = data.get('document_type') # 'resume' | 'cover_letter'
    doc_id = data.get('document_id')
    export_format = data.get('format', 'pdf').lower() # 'pdf' | 'docx'
    
    if doc_type not in ('resume', 'cover_letter'):
        return jsonify({'error': 'Invalid document_type. Expected "resume" or "cover_letter"'}), 400
    if export_format not in ('pdf', 'docx'):
        return jsonify({'error': 'Invalid format. Expected "pdf" or "docx"'}), 400
        
    storage_key = f"{g.user_id}_{uuid.uuid4().hex}.{export_format}"
    output_path = get_export_path(storage_key)
    
    file_name = f"document.{export_format}"
    version_id = None
    
    try:
        if doc_type == 'resume':
            resume = ResumeDocument.query.filter_by(id=doc_id, user_id=g.user_id).first()
            if not resume:
                return jsonify({'error': 'Resume document not found'}), 404
            
            clean_title = "".join(c for c in resume.title if c.isalnum() or c in (' ', '-', '_')).strip()
            file_name = f"{clean_title or 'Resume'}.{export_format}"
            version_id = resume.current_version_id
            
            if export_format == 'docx':
                generate_resume_docx(resume.to_dict(), output_path, resume.template_id)
            else:
                generate_resume_pdf(resume.to_dict(), output_path, resume.template_id)
                
        elif doc_type == 'cover_letter':
            cl = CoverLetter.query.filter_by(id=doc_id, user_id=g.user_id).first()
            if not cl:
                return jsonify({'error': 'Cover letter not found'}), 404
                
            clean_title = "".join(c for c in cl.title if c.isalnum() or c in (' ', '-', '_')).strip()
            file_name = f"{clean_title or 'Cover_Letter'}.{export_format}"
            version_id = cl.current_version_id
            
            if export_format == 'docx':
                generate_cover_letter_docx(cl.to_dict(), output_path)
            else:
                generate_cover_letter_pdf(cl.to_dict(), output_path)

        export_rec = ExportRecord(
            user_id=g.user_id,
            document_type=doc_type,
            document_id=doc_id,
            version_id=version_id,
            format=export_format,
            storage_key=storage_key,
            file_name=file_name,
            status='completed'
        )
        db.session.add(export_rec)
        db.session.commit()
        
        return jsonify({
            'message': 'Export created successfully',
            'export': export_rec.to_dict(),
            'download_url': f"/api/v1/exports/{export_rec.id}"
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Export generation failed: {str(e)}'}), 500

@exports_bp.route('/<export_id>', methods=['GET'])
@require_auth
def download_export(export_id):
    export_rec = ExportRecord.query.filter_by(id=export_id, user_id=g.user_id).first()
    if not export_rec:
        return jsonify({'error': 'Export file not found or unauthorized'}), 404
        
    file_path = get_export_path(export_rec.storage_key)
    if not os.path.exists(file_path):
        return jsonify({'error': 'File expired or not found on server'}), 404
        
    mimetype = 'application/pdf' if export_rec.format == 'pdf' else 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    return send_file(
        file_path,
        mimetype=mimetype,
        as_attachment=True,
        download_name=export_rec.file_name
    )

