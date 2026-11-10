import os
import pytest
from app.services.docx_service import generate_resume_docx, generate_cover_letter_docx
from app.services.pdf_service import generate_resume_pdf, generate_cover_letter_pdf

def test_export_fixtures(tmp_path):
    fixtures = [
        # 1. Fresher candidate
        {
            'name': 'Fresher Test Candidate',
            'doc': {
                'document_json': {
                    'contact': {
                        'name': 'Siddharth Patel',
                        'headline': 'Computer Science Graduate & Full Stack Developer',
                        'email': 'siddharth@example.edu',
                        'phone': '+91 98765 43210',
                        'city_country': 'Bengaluru, India'
                    },
                    'links': [
                        {'label': 'GitHub', 'url': 'https://github.com/siddharth-patel'},
                        {'label': 'Portfolio', 'url': 'https://siddharth.dev'}
                    ],
                    'summary': 'Recent CS graduate with strong foundations in React, Python, and modern web architectures.',
                    'skills': [{'name': 'React'}, {'name': 'Python'}, {'name': 'PostgreSQL'}, {'name': 'Tailwind CSS'}],
                    'projects': [
                        {
                            'name': 'Decentralized Task Management System with Real-Time WebSockets',
                            'technologies': 'React, Flask, WebSockets, Redis',
                            'repo_or_demo_url': 'https://github.com/siddharth-patel/task-manager-ultra-long-url-test',
                            'bullets': [
                                'Architected high-throughput websocket dispatcher handling 1,000+ active event connections.',
                                'Integrated responsive frontend with optimistic updates and zero UI layout shifts.'
                            ]
                        }
                    ],
                    'education': [
                        {
                            'institution': 'Indian Institute of Technology',
                            'degree': 'B.Tech in Computer Science',
                            'dates': '2022 - 2026',
                            'grade': 'CGPA 9.2'
                        }
                    ],
                    'experience': [],
                    'section_order': ['summary', 'skills', 'projects', 'education', 'experience'],
                    'section_visibility': {'summary': True, 'skills': True, 'projects': True, 'education': True, 'experience': False}
                }
            }
        },
        # 2. Experienced candidate with accented characters and long descriptions
        {
            'name': 'Experienced Accent Candidate',
            'doc': {
                'document_json': {
                    'contact': {
                        'name': 'Hélène Müller-Dvořák',
                        'headline': 'Principal Software Architect & Systems Engineering Lead',
                        'email': 'helene.muller@domain.eu',
                        'phone': '+49 151 2345678',
                        'city_country': 'Berlin, Germany'
                    },
                    'links': [
                        {'label': 'LinkedIn', 'url': 'https://linkedin.com/in/helenemuller'},
                        {'label': 'Publications', 'url': 'https://research.muller.org/papers'}
                    ],
                    'summary': 'Veteran engineering leader with 14+ years designing high-concurrency microservice platforms.',
                    'skills': [{'name': 'Go'}, {'name': 'Distributed Systems'}, {'name': 'Kubernetes'}, {'name': 'PostgreSQL'}],
                    'experience': [
                        {
                            'title': 'Principal Architect',
                            'company': 'FinTech Enterprise GmbH',
                            'dates': '2019 - Present',
                            'location': 'Berlin, Germany',
                            'bullets': [
                                'Spearheaded global migration of 40+ microservices handling €12B in annual transaction volume.',
                                'Reduced median 99th-percentile response time from 340ms to 48ms across European payment nodes.'
                            ]
                        },
                        {
                            'title': 'Senior Software Engineer',
                            'company': 'CloudScale Technologies',
                            'dates': '2014 - 2019',
                            'location': 'Munich, Germany',
                            'bullets': [
                                'Developed real-time distributed telemetry pipeline capturing 5B metric points daily.'
                            ]
                        }
                    ],
                    'projects': [],
                    'education': [
                        {
                            'institution': 'Technical University of Munich',
                            'degree': 'M.Sc. Informatics',
                            'dates': '2010 - 2012'
                        }
                    ],
                    'section_order': ['summary', 'skills', 'experience', 'education'],
                    'section_visibility': {'summary': True, 'skills': True, 'experience': True, 'education': True, 'projects': False}
                }
            }
        }
    ]

    for i, fixture in enumerate(fixtures):
        # Test Modern ATS PDF
        pdf_path_ats = str(tmp_path / f"resume_{i}_ats.pdf")
        generate_resume_pdf(fixture['doc'], pdf_path_ats, template_id='modern-ats')
        assert os.path.exists(pdf_path_ats)
        assert os.path.getsize(pdf_path_ats) > 1000

        # Test Clean Professional PDF
        pdf_path_clean = str(tmp_path / f"resume_{i}_clean.pdf")
        generate_resume_pdf(fixture['doc'], pdf_path_clean, template_id='clean-professional')
        assert os.path.exists(pdf_path_clean)
        assert os.path.getsize(pdf_path_clean) > 1000

        # Test Modern ATS DOCX
        docx_path_ats = str(tmp_path / f"resume_{i}_ats.docx")
        generate_resume_docx(fixture['doc'], docx_path_ats, template_id='modern-ats')
        assert os.path.exists(docx_path_ats)
        assert os.path.getsize(docx_path_ats) > 1000

        # Test Clean Professional DOCX
        docx_path_clean = str(tmp_path / f"resume_{i}_clean.docx")
        generate_resume_docx(fixture['doc'], docx_path_clean, template_id='clean-professional')
        assert os.path.exists(docx_path_clean)
        assert os.path.getsize(docx_path_clean) > 1000

    # Test Cover Letter exports
    cl_fixture = {
        'content_json': {
            'applicant_name': 'Hélène Müller',
            'applicant_email': 'helene@domain.eu',
            'applicant_phone': '+49 151 2345678',
            'company_name': 'NextGen Systems',
            'job_title': 'Principal Architect',
            'salutation': 'Dear Hiring Team,',
            'opening_paragraph': 'I am writing to apply for the Principal Architect role.',
            'evidence_paragraph_1': 'Over the last decade, I have led large scale cloud transformations.',
            'company_hook_paragraph': 'I admire NextGen Systems mission.',
            'closing_paragraph': 'Thank you for your consideration.'
        }
    }
    cl_pdf = str(tmp_path / "cl_test.pdf")
    generate_cover_letter_pdf(cl_fixture, cl_pdf)
    assert os.path.exists(cl_pdf)
    assert os.path.getsize(cl_pdf) > 1000

    cl_docx = str(tmp_path / "cl_test.docx")
    generate_cover_letter_docx(cl_fixture, cl_docx)
    assert os.path.exists(cl_docx)
    assert os.path.getsize(cl_docx) > 1000

