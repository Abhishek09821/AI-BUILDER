def get_available_templates():
    return [
        {
            'id': 'modern-ats',
            'slug': 'modern-ats',
            'name': 'Modern ATS',
            'description': 'Single-column, high parsability format designed specifically for automated applicant tracking systems.',
            'version': '1.0',
            'features': ['Single-column layout', 'Standard headings', 'Optimal keyword density', 'ATS parser verified'],
            'configuration': {
                'layout': 'single-column',
                'primary_color': '#27233A',
                'accent_color': '#6D4AFF',
                'font_family': 'Inter, system-ui, sans-serif',
                'font_size_body': '9.5pt',
                'line_spacing': '1.4',
                'margins': '0.65in'
            }
        },
        {
            'id': 'clean-professional',
            'slug': 'clean-professional',
            'name': 'Clean Professional',
            'description': 'Modern visual hierarchy with elegant brand purple section dividers and highlighted candidate metadata.',
            'version': '1.0',
            'features': ['Subtle visual accents', 'Brand styling', 'Executive readability', 'Selectable text'],
            'configuration': {
                'layout': 'single-column',
                'primary_color': '#6D4AFF',
                'accent_color': '#F3A6C7',
                'font_family': 'Inter, system-ui, sans-serif',
                'font_size_body': '9.5pt',
                'line_spacing': '1.45',
                'margins': '0.6in'
            }
        }
    ]

def build_semantic_document_from_profile(profile, facts: list, links: list, job_title: str = "", company: str = "") -> dict:
    """
    Constructs a semantic document model from the user's master profile facts.
    """
    contact = {
        'name': profile.name or 'Your Name',
        'headline': profile.headline or (f"Targeting: {job_title}" if job_title else "Software Engineer"),
        'email': profile.email or '',
        'phone': profile.phone or '',
        'city_country': profile.city_country or '',
        'portfolio_url': profile.portfolio_url or ''
    }
    
    links_data = [{'label': l.label, 'url': l.url, 'link_type': l.link_type} for l in links]
    
    summary = profile.summary or ''
    
    # Organize facts by type
    skills = []
    experience = []
    projects = []
    education = []
    certifications = []
    achievements = []
    
    for f in sorted(facts, key=lambda x: x.sort_order):
        d = f.data or {}
        if f.type == 'skill':
            skills.append({
                'id': f.id,
                'name': d.get('name', ''),
                'category': d.get('category', 'General')
            })
        elif f.type == 'experience':
            experience.append({
                'id': f.id,
                'company': d.get('company', ''),
                'title': d.get('title', ''),
                'dates': d.get('dates', ''),
                'location': d.get('location', ''),
                'description': d.get('description', ''),
                'bullets': d.get('bullets', [])
            })
        elif f.type == 'project':
            projects.append({
                'id': f.id,
                'name': d.get('name', ''),
                'technologies': d.get('technologies', ''),
                'repo_or_demo_url': d.get('repo_or_demo_url', ''),
                'description': d.get('description', ''),
                'bullets': d.get('bullets', [])
            })
        elif f.type == 'education':
            education.append({
                'id': f.id,
                'institution': d.get('institution', ''),
                'degree': d.get('degree', ''),
                'dates': d.get('dates', ''),
                'grade': d.get('grade', ''),
                'details': d.get('details', '')
            })
        elif f.type == 'certification':
            certifications.append({
                'id': f.id,
                'name': d.get('name', ''),
                'issuer': d.get('issuer', ''),
                'date': d.get('date', '')
            })
        elif f.type == 'achievement':
            achievements.append({
                'id': f.id,
                'title': d.get('title', ''),
                'description': d.get('description', '')
            })

    return {
        'contact': contact,
        'links': links_data,
        'summary': summary,
        'skills': skills,
        'experience': experience,
        'projects': projects,
        'education': education,
        'certifications': certifications,
        'achievements': achievements,
        'section_order': ['summary', 'skills', 'experience', 'projects', 'education'],
        'section_visibility': {
            'summary': True,
            'skills': True,
            'experience': True,
            'projects': True,
            'education': True,
            'certifications': len(certifications) > 0,
            'achievements': len(achievements) > 0
        }
    }

