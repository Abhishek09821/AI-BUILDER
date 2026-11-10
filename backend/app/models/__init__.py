import uuid
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSONB

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    profile = db.relationship('CareerProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    jobs = db.relationship('Job', backref='user', cascade='all, delete-orphan')
    resumes = db.relationship('ResumeDocument', backref='user', cascade='all, delete-orphan')
    cover_letters = db.relationship('CoverLetter', backref='user', cascade='all, delete-orphan')
    applications = db.relationship('Application', backref='user', cascade='all, delete-orphan')
    imports = db.relationship('ResumeImport', backref='user', cascade='all, delete-orphan')
    exports = db.relationship('ExportRecord', backref='user', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class CareerProfile(db.Model):
    __tablename__ = 'career_profiles'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=True)
    headline = db.Column(db.String(255), nullable=True)
    email = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    city_country = db.Column(db.String(255), nullable=True)
    portfolio_url = db.Column(db.String(500), nullable=True)
    summary = db.Column(db.Text, nullable=True)
    default_template_id = db.Column(db.String(50), default='modern-ats', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    facts = db.relationship('ProfileFact', backref='profile', cascade='all, delete-orphan', order_by='ProfileFact.sort_order')
    links = db.relationship('ProfileLink', backref='profile', cascade='all, delete-orphan', order_by='ProfileLink.sort_order')

    def to_dict(self, include_facts=True):
        res = {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'headline': self.headline,
            'email': self.email,
            'phone': self.phone,
            'city_country': self.city_country,
            'portfolio_url': self.portfolio_url,
            'summary': self.summary,
            'default_template_id': self.default_template_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'links': [l.to_dict() for l in self.links]
        }
        if include_facts:
            res['facts'] = [f.to_dict() for f in self.facts]
        return res


class ProfileFact(db.Model):
    __tablename__ = 'profile_facts'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    profile_id = db.Column(db.String(36), db.ForeignKey('career_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False, index=True) # experience, project, education, certification, skill, achievement
    data = db.Column(db.JSON, nullable=False) # structured payload
    source = db.Column(db.String(50), default='manual') # manual | import
    verified_at = db.Column(db.DateTime, nullable=True)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'profile_id': self.profile_id,
            'type': self.type,
            'data': self.data,
            'source': self.source,
            'is_verified': self.verified_at is not None,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'sort_order': self.sort_order,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ProfileLink(db.Model):
    __tablename__ = 'profile_links'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    profile_id = db.Column(db.String(36), db.ForeignKey('career_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    label = db.Column(db.String(100), nullable=False) # e.g. "LinkedIn", "GitHub", "Portfolio"
    url = db.Column(db.String(500), nullable=False)
    link_type = db.Column(db.String(50), default='other') # linkedin, github, portfolio, blog, twitter, other
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'profile_id': self.profile_id,
            'label': self.label,
            'url': self.url,
            'link_type': self.link_type,
            'sort_order': self.sort_order
        }


class ResumeImport(db.Model):
    __tablename__ = 'resume_imports'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    storage_key = db.Column(db.String(500), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False) # docx | pdf
    parse_status = db.Column(db.String(50), default='staged') # staged | committed | failed
    extracted_payload = db.Column(db.JSON, nullable=True) # staging data waiting for user confirmation
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'file_name': self.file_name,
            'file_type': self.file_type,
            'parse_status': self.parse_status,
            'extracted_payload': self.extracted_payload,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Job(db.Model):
    __tablename__ = 'jobs'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    company = db.Column(db.String(255), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description_text = db.Column(db.Text, nullable=False)
    source_url = db.Column(db.String(500), nullable=True)
    location = db.Column(db.String(255), nullable=True)
    employment_type = db.Column(db.String(100), nullable=True) # Full-time, Part-time, Contract, Remote, etc.
    source = db.Column(db.String(100), nullable=True) # LinkedIn, Indeed, Company Site, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    analyses = db.relationship('JobAnalysis', backref='job', cascade='all, delete-orphan', order_by='JobAnalysis.created_at.desc()')
    resumes = db.relationship('ResumeDocument', backref='job', cascade='all, delete-orphan')
    cover_letters = db.relationship('CoverLetter', backref='job', cascade='all, delete-orphan')
    applications = db.relationship('Application', backref='job', cascade='all, delete-orphan')

    def to_dict(self, include_latest_analysis=True):
        res = {
            'id': self.id,
            'user_id': self.user_id,
            'company': self.company,
            'title': self.title,
            'description_text': self.description_text,
            'source_url': self.source_url,
            'location': self.location,
            'employment_type': self.employment_type,
            'source': self.source,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_latest_analysis and self.analyses:
            res['latest_analysis'] = self.analyses[0].to_dict(include_matches=True)
        else:
            res['latest_analysis'] = None
        return res


class JobAnalysis(db.Model):
    __tablename__ = 'job_analyses'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    job_id = db.Column(db.String(36), db.ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False, index=True)
    role_summary = db.Column(db.Text, nullable=True)
    seniority_level = db.Column(db.String(100), nullable=True) # Entry, Mid, Senior, Lead, Executive
    required_skills = db.Column(db.JSON, default=list) # ["React", "Python", ...]
    preferred_skills = db.Column(db.JSON, default=list) # ["Docker", "AWS", ...]
    responsibilities = db.Column(db.JSON, default=list) # ["Architect frontend modules", ...]
    keywords = db.Column(db.JSON, default=list) # ["CI/CD", "Scalability", ...]
    analysis_version = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    matches = db.relationship('JobMatch', backref='analysis', cascade='all, delete-orphan')

    def to_dict(self, include_matches=True):
        res = {
            'id': self.id,
            'job_id': self.job_id,
            'role_summary': self.role_summary,
            'seniority_level': self.seniority_level,
            'required_skills': self.required_skills or [],
            'preferred_skills': self.preferred_skills or [],
            'responsibilities': self.responsibilities or [],
            'keywords': self.keywords or [],
            'analysis_version': self.analysis_version,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_matches:
            res['matches'] = [m.to_dict() for m in self.matches]
        return res


class JobMatch(db.Model):
    __tablename__ = 'job_matches'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    analysis_id = db.Column(db.String(36), db.ForeignKey('job_analyses.id', ondelete='CASCADE'), nullable=False, index=True)
    requirement_key = db.Column(db.String(255), nullable=False)
    requirement_type = db.Column(db.String(50), default='skill') # skill | responsibility | keyword
    match_status = db.Column(db.String(50), nullable=False) # strong | partial | not_found
    evidence_fact_ids = db.Column(db.JSON, default=list) # list of profile_fact IDs
    explanation = db.Column(db.Text, nullable=True)
    recommendation = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'analysis_id': self.analysis_id,
            'requirement_key': self.requirement_key,
            'requirement_type': self.requirement_type,
            'match_status': self.match_status,
            'evidence_fact_ids': self.evidence_fact_ids or [],
            'explanation': self.explanation,
            'recommendation': self.recommendation,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ResumeDocument(db.Model):
    __tablename__ = 'resume_documents'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    job_id = db.Column(db.String(36), db.ForeignKey('jobs.id', ondelete='SET NULL'), nullable=True, index=True)
    title = db.Column(db.String(255), nullable=False)
    template_id = db.Column(db.String(50), default='modern-ats', nullable=False)
    document_json = db.Column(db.JSON, nullable=False) # semantic document structure
    current_version_id = db.Column(db.String(36), nullable=True)
    is_master = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    versions = db.relationship('ResumeVersion', backref='document', cascade='all, delete-orphan', order_by='ResumeVersion.version_number.desc()')
    suggestions = db.relationship('AiSuggestion', backref='document', cascade='all, delete-orphan')

    def to_dict(self, include_versions=False, include_suggestions=True):
        res = {
            'id': self.id,
            'user_id': self.user_id,
            'job_id': self.job_id,
            'title': self.title,
            'template_id': self.template_id,
            'document_json': self.document_json,
            'current_version_id': self.current_version_id,
            'is_master': self.is_master,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'job_info': {'company': self.job.company, 'title': self.job.title} if self.job else None
        }
        if include_versions:
            res['versions'] = [v.to_dict() for v in self.versions]
        if include_suggestions:
            res['suggestions'] = [s.to_dict() for s in self.suggestions if s.status == 'pending']
        return res


class ResumeVersion(db.Model):
    __tablename__ = 'resume_versions'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    resume_document_id = db.Column(db.String(36), db.ForeignKey('resume_documents.id', ondelete='CASCADE'), nullable=False, index=True)
    version_number = db.Column(db.Integer, nullable=False)
    document_json = db.Column(db.JSON, nullable=False)
    change_summary = db.Column(db.String(255), default='Manual edit')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'resume_document_id': self.resume_document_id,
            'version_number': self.version_number,
            'document_json': self.document_json,
            'change_summary': self.change_summary,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class AiSuggestion(db.Model):
    __tablename__ = 'ai_suggestions'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    resume_document_id = db.Column(db.String(36), db.ForeignKey('resume_documents.id', ondelete='CASCADE'), nullable=False, index=True)
    suggestion_json = db.Column(db.JSON, nullable=False) # structured suggestion object
    status = db.Column(db.String(50), default='pending') # pending | accepted | rejected | edited
    reviewed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'resume_document_id': self.resume_document_id,
            'suggestion_json': self.suggestion_json,
            'status': self.status,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class CoverLetter(db.Model):
    __tablename__ = 'cover_letters'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    job_id = db.Column(db.String(36), db.ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    tone = db.Column(db.String(50), default='Professional') # Professional, Confident, Concise
    length = db.Column(db.String(50), default='Standard') # Short, Standard
    content_json = db.Column(db.JSON, nullable=False) # structured cover letter: opening, evidence_paragraphs, company_hook, closing
    current_version_id = db.Column(db.String(36), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    versions = db.relationship('CoverLetterVersion', backref='cover_letter', cascade='all, delete-orphan', order_by='CoverLetterVersion.version_number.desc()')

    def to_dict(self, include_versions=False):
        res = {
            'id': self.id,
            'user_id': self.user_id,
            'job_id': self.job_id,
            'title': self.title,
            'tone': self.tone,
            'length': self.length,
            'content_json': self.content_json,
            'current_version_id': self.current_version_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'job_info': {'company': self.job.company, 'title': self.job.title} if self.job else None
        }
        if include_versions:
            res['versions'] = [v.to_dict() for v in self.versions]
        return res


class CoverLetterVersion(db.Model):
    __tablename__ = 'cover_letter_versions'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    cover_letter_id = db.Column(db.String(36), db.ForeignKey('cover_letters.id', ondelete='CASCADE'), nullable=False, index=True)
    version_number = db.Column(db.Integer, nullable=False)
    content_json = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'cover_letter_id': self.cover_letter_id,
            'version_number': self.version_number,
            'content_json': self.content_json,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Application(db.Model):
    __tablename__ = 'applications'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    job_id = db.Column(db.String(36), db.ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False, index=True)
    status = db.Column(db.String(50), default='Draft', nullable=False) # Draft, Ready to apply, Applied, Assessment, Interview, Offer, Rejected, Withdrawn
    applied_at = db.Column(db.DateTime, nullable=True)
    follow_up_at = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    resume_document_id = db.Column(db.String(36), db.ForeignKey('resume_documents.id', ondelete='SET NULL'), nullable=True)
    cover_letter_id = db.Column(db.String(36), db.ForeignKey('cover_letters.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    resume = db.relationship('ResumeDocument', foreign_keys=[resume_document_id])
    cover_letter = db.relationship('CoverLetter', foreign_keys=[cover_letter_id])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'job_id': self.job_id,
            'company': self.job.company if self.job else '',
            'title': self.job.title if self.job else '',
            'location': self.job.location if self.job else '',
            'status': self.status,
            'applied_at': self.applied_at.isoformat() if self.applied_at else None,
            'follow_up_at': self.follow_up_at.isoformat() if self.follow_up_at else None,
            'notes': self.notes,
            'resume_document_id': self.resume_document_id,
            'cover_letter_id': self.cover_letter_id,
            'resume_title': self.resume.title if self.resume else None,
            'cover_letter_title': self.cover_letter.title if self.cover_letter else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class DocumentTemplate(db.Model):
    __tablename__ = 'document_templates'

    id = db.Column(db.String(50), primary_key=True) # e.g. "modern-ats", "clean-professional"
    slug = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    version = db.Column(db.String(20), default='1.0')
    configuration_json = db.Column(db.JSON, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'slug': self.slug,
            'name': self.name,
            'version': self.version,
            'configuration': self.configuration_json,
            'is_active': self.is_active
        }


class ExportRecord(db.Model):
    __tablename__ = 'export_records'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    document_type = db.Column(db.String(50), nullable=False) # resume | cover_letter
    document_id = db.Column(db.String(36), nullable=False)
    version_id = db.Column(db.String(36), nullable=True)
    format = db.Column(db.String(20), nullable=False) # pdf | docx
    storage_key = db.Column(db.String(500), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), default='completed') # pending | completed | failed
    error_code = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'document_type': self.document_type,
            'document_id': self.document_id,
            'version_id': self.version_id,
            'format': self.format,
            'file_name': self.file_name,
            'status': self.status,
            'error_code': self.error_code,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

