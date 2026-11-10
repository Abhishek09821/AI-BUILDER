import os
import pytest
import json
from app import create_app
from app.models import db, User, CareerProfile, ProfileFact, Job, ResumeDocument, CoverLetter
from app.config import Config

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

@pytest.fixture
def client():
    app = create_app(TestConfig)
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()

def test_health_check(client):
    res = client.get('/api/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['product'] == 'ApplyMate'

def test_auth_workflow(client):
    # 1. Register
    reg_res = client.post('/api/v1/auth/signup', json={
        'email': 'jane.doe@example.com',
        'password': 'password123',
        'name': 'Jane Doe'
    })
    assert reg_res.status_code == 201
    reg_data = reg_res.get_json()
    assert 'token' in reg_data
    assert reg_data['user']['email'] == 'jane.doe@example.com'
    token = reg_data['token']
    
    # 2. Login
    login_res = client.post('/api/v1/auth/login', json={
        'email': 'jane.doe@example.com',
        'password': 'password123'
    })
    assert login_res.status_code == 200
    login_data = login_res.get_json()
    assert 'token' in login_data
    
    # 3. Access protected /me
    me_res = client.get('/api/v1/me', headers={'Authorization': f'Bearer {token}'})
    assert me_res.status_code == 200
    me_data = me_res.get_json()
    assert me_data['user']['email'] == 'jane.doe@example.com'

def test_profile_and_facts_crud(client):
    # Register user
    reg = client.post('/api/v1/auth/signup', json={
        'email': 'developer@applymate.io',
        'password': 'secretpassword',
        'name': 'Alex Developer'
    })
    token = reg.get_json()['token']
    auth_header = {'Authorization': f'Bearer {token}'}
    
    # Update profile
    p_res = client.put('/api/v1/profile', json={
        'name': 'Alex Developer',
        'headline': 'Full Stack Engineer',
        'phone': '+1 555-0199',
        'city_country': 'San Francisco, CA',
        'summary': 'Senior software engineer with 6+ years building distributed cloud platforms.'
    }, headers=auth_header)
    assert p_res.status_code == 200
    assert p_res.get_json()['headline'] == 'Full Stack Engineer'
    
    # Add a skill fact
    fact1 = client.post('/api/v1/profile/facts', json={
        'type': 'skill',
        'data': {'name': 'React', 'category': 'Frontend'},
        'is_verified': True
    }, headers=auth_header)
    assert fact1.status_code == 201
    fact1_id = fact1.get_json()['id']
    
    # Add project fact
    fact2 = client.post('/api/v1/profile/facts', json={
        'type': 'project',
        'data': {
            'name': 'Cloud Portal',
            'technologies': 'React, Python, PostgreSQL',
            'repo_or_demo_url': 'https://github.com/example/cloud-portal',
            'description': 'Engineered cloud dashboard reducing latency by 35%.',
            'bullets': ['Engineered cloud dashboard reducing latency by 35%.']
        },
        'is_verified': True
    }, headers=auth_header)
    assert fact2.status_code == 201
    
    # Add link
    link_res = client.post('/api/v1/profile/links', json={
        'label': 'GitHub',
        'url': 'https://github.com/alexdev',
        'link_type': 'github'
    }, headers=auth_header)
    assert link_res.status_code == 201

def test_job_analysis_and_matching(client):
    reg = client.post('/api/v1/auth/signup', json={
        'email': 'matching.tester@example.com',
        'password': 'secretpassword',
        'name': 'Matching Tester'
    })
    token = reg.get_json()['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Add React skill to profile
    client.post('/api/v1/profile/facts', json={
        'type': 'skill',
        'data': {'name': 'React', 'category': 'Frontend'},
        'is_verified': True
    }, headers=headers)
    
    # Post Job Description
    job_res = client.post('/api/v1/jobs', json={
        'company': 'Stripe',
        'title': 'Senior Frontend Engineer',
        'description_text': """
        We are looking for a Senior Frontend Engineer at Stripe to build delightful payment experiences.
        Requirements:
        - 5+ years of experience with React, TypeScript, and modern JavaScript.
        - Experience with state management, unit testing, and design systems.
        - Knowledge of GraphQL and REST APIs.
        Responsibilities:
        - Architect resilient web applications.
        - Collaborate with product designers and engineers.
        """
    }, headers=headers)
    assert job_res.status_code == 201
    job_data = job_res.get_json()
    job_id = job_data['id']
    
    # Check matching
    match_res = client.get(f'/api/v1/jobs/{job_id}/matches', headers=headers)
    assert match_res.status_code == 200
    match_data = match_res.get_json()
    assert len(match_data['matches']) > 0
    # React should have strong evidence
    react_match = next((m for m in match_data['matches'] if 'react' in m['requirement_key'].lower()), None)
    assert react_match is not None
    assert react_match['match_status'] == 'strong'
    assert len(react_match['evidence_fact_ids']) > 0

def test_tailored_resume_and_suggestions_review(client):
    reg = client.post('/api/v1/auth/signup', json={
        'email': 'tailor.tester@example.com',
        'password': 'secretpassword',
        'name': 'Taylor Tester'
    })
    token = reg.get_json()['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Add profile items
    client.put('/api/v1/profile', json={
        'name': 'Taylor Tester',
        'headline': 'Software Engineer',
        'summary': 'Passionate engineer focused on high performance web apps.'
    }, headers=headers)
    
    proj = client.post('/api/v1/profile/facts', json={
        'type': 'project',
        'data': {
            'name': 'E-Commerce Platform',
            'technologies': 'React, Python',
            'bullets': ['Built high-throughput payment flow serving 50k users.']
        }
    }, headers=headers).get_json()
    
    # Create Job
    job = client.post('/api/v1/jobs', json={
        'company': 'Acme Corp',
        'title': 'Software Engineer',
        'description_text': 'Looking for an engineer to build scalable payment and checkout systems using React and Python.'
    }, headers=headers).get_json()
    
    # Generate Tailored Resume Draft
    draft_res = client.post(f"/api/v1/jobs/{job['id']}/resume-draft", headers=headers)
    assert draft_res.status_code == 201
    draft_data = draft_res.get_json()
    resume_id = draft_data['resume_id']
    suggestions = draft_data['resume']['suggestions']
    assert len(suggestions) > 0
    
    sugg_id = suggestions[0]['id']
    
    # Review suggestion: Accept summary
    rev_res = client.post(f"/api/v1/resumes/{resume_id}/suggestions/{sugg_id}/review", json={
        'action': 'accept',
        'item_type': 'summary'
    }, headers=headers)
    assert rev_res.status_code == 200
    
    # Test DOCX and PDF export
    pdf_export = client.post('/api/v1/exports', json={
        'document_type': 'resume',
        'document_id': resume_id,
        'format': 'pdf'
    }, headers=headers)
    assert pdf_export.status_code == 201
    assert 'download_url' in pdf_export.get_json()

    docx_export = client.post('/api/v1/exports', json={
        'document_type': 'resume',
        'document_id': resume_id,
        'format': 'docx'
    }, headers=headers)
    assert docx_export.status_code == 201
    assert 'download_url' in docx_export.get_json()

