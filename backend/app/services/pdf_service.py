import re
from pypdf import PdfReader
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, ListFlowable, ListItem
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def parse_pdf_resume(file_path: str) -> dict:
    """
    Extracts text and candidate details from an uploaded PDF file for staging review.
    """
    reader = PdfReader(file_path)
    text_pages = []
    for page in reader.pages:
        txt = page.extract_text()
        if txt:
            text_pages.append(txt)
            
    full_text = "\n".join(text_pages)
    lines = [l.strip() for l in full_text.splitlines() if l.strip()]
    
    extracted = {
        'name': lines[0][:100] if lines else '',
        'headline': '',
        'email': '',
        'phone': '',
        'city_country': '',
        'summary': '',
        'skills': [],
        'experiences': [],
        'projects': [],
        'education': [],
        'links': []
    }
    
    if not lines:
        return extracted
        
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', full_text)
    if email_match:
        extracted['email'] = email_match.group(0)
        
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}', full_text)
    if phone_match:
        extracted['phone'] = phone_match.group(0)
        
    url_matches = re.findall(r'https?://[^\s]+|linkedin\.com/[^\s]+|github\.com/[^\s]+', full_text)
    for u in url_matches:
        url_clean = u.rstrip('.,;')
        label = "Website"
        link_type = "other"
        if "linkedin" in url_clean.lower():
            label = "LinkedIn"
            link_type = "linkedin"
        elif "github" in url_clean.lower():
            label = "GitHub"
            link_type = "github"
        elif "portfolio" in url_clean.lower():
            label = "Portfolio"
            link_type = "portfolio"
        extracted['links'].append({'label': label, 'url': url_clean if url_clean.startswith('http') else f"https://{url_clean}", 'link_type': link_type})

    # Heuristic section extraction
    current_section = None
    section_map = {
        'summary': ['summary', 'profile', 'about me', 'objective'],
        'skills': ['skills', 'technologies', 'technical skills', 'core competencies'],
        'experiences': ['experience', 'work experience', 'employment history', 'experience:'],
        'projects': ['projects', 'personal projects', 'key projects'],
        'education': ['education', 'academic background', 'education:']
    }
    
    current_block = []
    
    def classify_header(line):
        lower = line.lower().strip(': -#')
        for s_type, keywords in section_map.items():
            if lower in keywords or any(k == lower for k in keywords):
                return s_type
        return None

    for line in lines[1:]:
        header = classify_header(line)
        if header:
            commit_pdf_block(current_section, current_block, extracted)
            current_section = header
            current_block = []
        elif current_section:
            current_block.append(line)
        else:
            if not extracted['headline'] and len(line) < 100 and '@' not in line:
                extracted['headline'] = line

    commit_pdf_block(current_section, current_block, extracted)
    return extracted

def commit_pdf_block(section, lines, extracted):
    if not section or not lines:
        return
    text = "\n".join(lines)
    if section == 'summary':
        extracted['summary'] = text
    elif section == 'skills':
        items = re.split(r'[,|•·\n]+', text)
        for it in items:
            it = it.strip(' -*:')
            if it and len(it) < 40:
                extracted['skills'].append({'name': it, 'category': 'General'})
    elif section == 'experiences':
        extracted['experiences'].append({
            'company': lines[0][:80] if lines else 'Company',
            'title': lines[1][:80] if len(lines) > 1 else 'Role',
            'dates': 'Present',
            'location': '',
            'description': text,
            'bullets': [b.strip(' -•·*') for b in lines[2:] if b.strip()]
        })
    elif section == 'projects':
        extracted['projects'].append({
            'name': lines[0][:80] if lines else 'Project',
            'technologies': '',
            'description': text,
            'bullets': [b.strip(' -•·*') for b in lines[1:] if b.strip()]
        })
    elif section == 'education':
        extracted['education'].append({
            'institution': lines[0][:100] if lines else 'Institution',
            'degree': lines[1][:100] if len(lines) > 1 else 'Degree',
            'dates': '',
            'details': text
        })

def generate_resume_pdf(doc_model: dict, output_path: str, template_id: str = 'modern-ats') -> str:
    """
    Generates a selectable text PDF with clean typography and hyperlinks.
    """
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    primary_color = colors.HexColor('#6D4AFF') if template_id == 'clean-professional' else colors.HexColor('#27233A')
    text_color = colors.HexColor('#27233A')
    muted_color = colors.HexColor('#77728A')
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        alignment=1 # Center
    )
    
    headline_style = ParagraphStyle(
        'DocHeadline',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=muted_color,
        alignment=1
    )
    
    contact_style = ParagraphStyle(
        'DocContact',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=text_color,
        alignment=1
    )
    
    sec_heading_style = ParagraphStyle(
        'SecHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=primary_color,
        spaceBefore=8,
        spaceAfter=4,
        textTransform='uppercase'
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=text_color,
        spaceAfter=4
    )
    
    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12.5,
        textColor=text_color,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=2
    )

    story = []
    doc_json = doc_model.get('document_json', {})
    contact = doc_json.get('contact', {})
    
    # Header
    name = contact.get('name', 'Applicant Name')
    story.append(Paragraph(name, title_style))
    story.append(Spacer(1, 2))
    
    if contact.get('headline'):
        story.append(Paragraph(contact.get('headline'), headline_style))
        story.append(Spacer(1, 4))
        
    # Contact items
    contact_bits = []
    if contact.get('email'):
        contact_bits.append(f"<a href='mailto:{contact.get('email')}'>{contact.get('email')}</a>")
    if contact.get('phone'):
        contact_bits.append(contact.get('phone'))
    if contact.get('city_country'):
        contact_bits.append(contact.get('city_country'))
        
    links = doc_json.get('links', [])
    for l in links:
        url = l.get('url', '')
        label = l.get('label') or url
        if url:
            contact_bits.append(f"<a href='{url}' color='#6D4AFF'><u>{label}</u></a>")
            
    if contact_bits:
        story.append(Paragraph(" &nbsp;|&nbsp; ".join(contact_bits), contact_style))
        story.append(Spacer(1, 8))
        
    # Divider for clean-professional
    if template_id == 'clean-professional':
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#6D4AFF'), spaceBefore=2, spaceAfter=8))
    else:
        story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#E8E4F0'), spaceBefore=2, spaceAfter=8))
        
    section_order = doc_json.get('section_order', ['summary', 'skills', 'experience', 'projects', 'education'])
    sections_visible = doc_json.get('section_visibility', {})
    
    for sec in section_order:
        if sections_visible.get(sec, True) is False:
            continue
            
        if sec == 'summary' and doc_json.get('summary'):
            story.append(Paragraph("Professional Summary", sec_heading_style))
            story.append(Paragraph(doc_json.get('summary'), body_style))
            story.append(Spacer(1, 6))
            
        elif sec == 'skills' and doc_json.get('skills'):
            story.append(Paragraph("Core Skills", sec_heading_style))
            skills_data = doc_json.get('skills', [])
            skill_names = [s.get('name', '') if isinstance(s, dict) else str(s) for s in skills_data]
            skills_str = " • ".join(filter(None, skill_names))
            story.append(Paragraph(skills_str, body_style))
            story.append(Spacer(1, 6))
            
        elif sec == 'experience' and doc_json.get('experience'):
            story.append(Paragraph("Work Experience", sec_heading_style))
            for exp in doc_json.get('experience', []):
                role_company = f"<b>{exp.get('title', '')}</b> &nbsp;|&nbsp; {exp.get('company', '')}"
                date_loc = f"<i>{exp.get('dates', '')} {f'({exp.get('location')})' if exp.get('location') else ''}</i>"
                
                exp_table_data = [[
                    Paragraph(role_company, body_style),
                    Paragraph(f"<div align='right'>{date_loc}</div>", body_style)
                ]]
                t = Table(exp_table_data, colWidths=[360, 180])
                t.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('LEFTPADDING', (0,0), (-1,-1), 0),
                    ('RIGHTPADDING', (0,0), (-1,-1), 0),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                    ('TOPPADDING', (0,0), (-1,-1), 0),
                ]))
                story.append(t)
                
                for b in exp.get('bullets', []):
                    story.append(Paragraph(f"&bull; {b}", bullet_style))
                story.append(Spacer(1, 4))
                
        elif sec == 'projects' and doc_json.get('projects'):
            story.append(Paragraph("Projects", sec_heading_style))
            for proj in doc_json.get('projects', []):
                p_title = f"<b>{proj.get('name', '')}</b>"
                if proj.get('technologies'):
                    p_title += f" <i>({proj.get('technologies')})</i>"
                if proj.get('repo_or_demo_url'):
                    p_title += f" &nbsp;[<a href='{proj.get('repo_or_demo_url')}' color='#6D4AFF'><u>Link</u></a>]"
                    
                story.append(Paragraph(p_title, body_style))
                for b in proj.get('bullets', []):
                    story.append(Paragraph(f"&bull; {b}", bullet_style))
                story.append(Spacer(1, 4))
                
        elif sec == 'education' and doc_json.get('education'):
            story.append(Paragraph("Education", sec_heading_style))
            for edu in doc_json.get('education', []):
                deg_inst = f"<b>{edu.get('degree', '')}</b> &nbsp;|&nbsp; {edu.get('institution', '')}"
                dt = f"<i>{edu.get('dates', '')}</i>"
                t_data = [[
                    Paragraph(deg_inst, body_style),
                    Paragraph(f"<div align='right'>{dt}</div>", body_style)
                ]]
                t = Table(t_data, colWidths=[380, 160])
                t.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('LEFTPADDING', (0,0), (-1,-1), 0),
                    ('RIGHTPADDING', (0,0), (-1,-1), 0),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                    ('TOPPADDING', (0,0), (-1,-1), 0),
                ]))
                story.append(t)
                story.append(Spacer(1, 2))
                
    doc.build(story)
    return output_path

def generate_cover_letter_pdf(cl_model: dict, output_path: str) -> str:
    """
    Generates a formal selectable text PDF cover letter.
    """
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    header_style = ParagraphStyle(
        'CLHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#6D4AFF')
    )
    
    subhead_style = ParagraphStyle(
        'CLSubhead',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#77728A'),
        spaceAfter=14
    )
    
    body_style = ParagraphStyle(
        'CLBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=15,
        textColor=colors.HexColor('#27233A'),
        spaceAfter=10
    )
    
    story = []
    content = cl_model.get('content_json', {})
    
    # Applicant details
    name = content.get('applicant_name', 'Applicant Name')
    story.append(Paragraph(name, header_style))
    contact = f"{content.get('applicant_email', '')} &nbsp;|&nbsp; {content.get('applicant_phone', '')}"
    story.append(Paragraph(contact, subhead_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E8E4F0'), spaceAfter=14))
    
    # Date & Recipient
    to_text = f"<b>To:</b> Hiring Team<br/><b>Company:</b> {content.get('company_name', 'Target Company')}<br/><b>Role:</b> {content.get('job_title', 'Target Role')}"
    story.append(Paragraph(to_text, body_style))
    story.append(Spacer(1, 6))
    
    # Salutation
    salutation = content.get('salutation', 'Dear Hiring Manager,')
    story.append(Paragraph(salutation, body_style))
    story.append(Spacer(1, 4))
    
    # Paragraphs
    paragraphs = [
        content.get('opening_paragraph', ''),
        content.get('evidence_paragraph_1', ''),
        content.get('evidence_paragraph_2', ''),
        content.get('company_hook_paragraph', ''),
        content.get('closing_paragraph', '')
    ]
    
    for p in paragraphs:
        if p:
            story.append(Paragraph(p, body_style))
            
    # Sign off
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"Sincerely,<br/><br/><b>{name}</b>", body_style))
    
    doc.build(story)
    return output_path

