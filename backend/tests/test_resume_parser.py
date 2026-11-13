import pytest
from app.services.resume_parser import parse_resume_text

def test_resume_parser_multisection():
    text = """
    Page 1 of 1
    Photo Here
    Sarah Connor
    Lead Security Architect
    sarah@cyberdyne.org | +1 555-987-6543 | Los Angeles, CA
    https://linkedin.com/in/sarahconnor | https://github.com/sconnor

    Professional Profile
    Cybersecurity and defense systems architect with 8+ years leading threat analysis.

    Skills & Competencies
    Core: Cryptography, PenTesting, Network Forensics
    Tools: Wireshark, Splunk, Docker, Linux, Python

    Work History
    Staff Security Engineer | Skynet Defense Systems | Los Angeles, CA
    March 2021 - Present
    • Architected zero-trust authentication framework preventing perimeter breaches.
    • Directed red-team exercises and vulnerability mitigations.

    Security Analyst | Cyberdyne Systems
    June 2017 - February 2021
    • Conducted daily SIEM monitoring and incident response for 500+ endpoints.
    • Automated firewall rule verification using Python scripts.

    Featured Projects
    SentinelGuard (Python, Go) https://github.com/sconnor/sentinel
    • Open-source intrusion detection monitor.

    Academic Background
    B.S. in Computer Engineering | UCLA
    2013 - 2017
    • Minor in Mathematics
    """
    
    res = parse_resume_text(text)
    assert res['name'] == 'Sarah Connor'
    assert res['headline'] == 'Lead Security Architect'
    assert res['email'] == 'sarah@cyberdyne.org'
    assert res['phone'] == '+1 555-987-6543'
    assert len(res['links']) == 3
    assert len(res['skills']) >= 5
    assert len(res['experiences']) == 2
    assert res['experiences'][0]['company'] == 'Skynet Defense Systems'
    assert res['experiences'][0]['title'] == 'Staff Security Engineer'
    assert res['experiences'][0]['dates'] == 'March 2021 - Present'
    assert len(res['experiences'][0]['bullets']) == 2
    assert res['experiences'][1]['company'] == 'Cyberdyne Systems'
    assert len(res['experiences'][1]['bullets']) == 2
    assert len(res['projects']) == 1
    assert res['projects'][0]['name'] == 'SentinelGuard'
    assert len(res['education']) == 1
    assert 'UCLA' in res['education'][0]['institution']

