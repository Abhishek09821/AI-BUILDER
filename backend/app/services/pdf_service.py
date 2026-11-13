import re
import html
from pypdf import PdfReader
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.services.resume_parser import parse_resume_text

def escape_xml(text: Any) -> str:
    """Escapes user strings for safe inclusion in ReportLab XML markup."""
    if text is None:
        return ""
    return html.escape(str(text))

def parse_pdf_resume(file_path: str) -> dict:
    """
    Extracts text from an uploaded PDF file and parses structured career entities.
    Filters out noise, images, logos, and splits multi-entry experiences and education.
    """
    reader = PdfReader(file_path)
    text_pages = []
    for page in reader.pages:
        try:
            txt = page.extract_text()
            if txt:
                text_pages.append(txt)
        except Exception:
            continue
            
    full_text = "\n".join(text_pages)
    return parse_resume_text(full_text)

def generate_resume_pdf(doc_model: dict, output_path: str, template_id: str = 'modern-ats') -> str:
    """
    Generates a selectable text PDF with clean typography, hyperlinks, and bullet points.
    Applies strict XML escaping so special characters like & < > never crash ReportLab.
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
    is_clean = (template_id == 'clean-professional')
    primary_color = colors.HexColor('#6D4AFF') if is_clean else colors.HexColor('#27233A')
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
        fontSize=10.5,
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
        fontSize=10.5,
        leading=14,
        textColor=primary_color,
        spaceBefore=8,
        spaceAfter=3,
        textTransform='uppercase'
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=text_color,
        spaceAfter=3
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
    
    # 1. Header: Name & Headline
    name = escape_xml(contact.get('name') or 'Applicant Name')
    story.append(Paragraph(name, title_style))
    story.append(Spacer(1, 2))
    
    if contact.get('headline'):
        story.append(Paragraph(escape_xml(contact.get('headline')), headline_style))
        story.append(Spacer(1, 3))
        
    # 2. Contact details & Links inline
    contact_bits = []
    if contact.get('email'):
        em = escape_xml(contact.get('email'))
        contact_bits.append(f"<a href='mailto:{em}'>{em}</a>")
    if contact.get('phone'):
        contact_bits.append(escape_xml(contact.get('phone')))
    if contact.get('city_country'):
        contact_bits.append(escape_xml(contact.get('city_country')))
        
    links = doc_json.get('links', [])
    for l in links:
        url = l.get('url', '')
        raw_label = l.get('label') or url
        if url:
            lbl = escape_xml(raw_label)
            u_esc = escape_xml(url)
            contact_bits.append(f"<a href='{u_esc}' color='#6D4AFF'><u>{lbl}</u></a>")
            
    if contact_bits:
        story.append(Paragraph(" &nbsp;|&nbsp; ".join(contact_bits), contact_style))
        story.append(Spacer(1, 6))
        
    # Divider line
    if is_clean:
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#6D4AFF'), spaceBefore=2, spaceAfter=6))
    else:
        story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#E8E4F0'), spaceBefore=2, spaceAfter=6))
        
    section_order = doc_json.get('section_order', ['summary', 'skills', 'experience', 'projects', 'education'])
    sections_visible = doc_json.get('section_visibility', {})
    
    for sec in section_order:
        if sections_visible.get(sec, True) is False:
            continue
            
        if sec == 'summary' and doc_json.get('summary'):
            story.append(Paragraph("Professional Summary", sec_heading_style))
            story.append(Paragraph(escape_xml(doc_json.get('summary')), body_style))
            story.append(Spacer(1, 4))
            
        elif sec == 'skills' and doc_json.get('skills'):
            story.append(Paragraph("Core Skills", sec_heading_style))
            skills_data = doc_json.get('skills', [])
            skill_names = [escape_xml(s.get('name', '')) if isinstance(s, dict) else escape_xml(str(s)) for s in skills_data]
            skills_str = " • ".join(filter(None, skill_names))
            story.append(Paragraph(skills_str, body_style))
            story.append(Spacer(1, 4))
            
        elif sec == 'experience' and doc_json.get('experience'):
            story.append(Paragraph("Work Experience", sec_heading_style))
            for exp in doc_json.get('experience', []):
                t_esc = escape_xml(exp.get('title', 'Role'))
                c_esc = escape_xml(exp.get('company', 'Company'))
                d_esc = escape_xml(exp.get('dates', ''))
                l_esc = escape_xml(exp.get('location', ''))
                
                role_company = f"<b>{t_esc}</b> &nbsp;|&nbsp; {c_esc}"
                date_loc = f"<i>{d_esc} {f'({l_esc})' if l_esc else ''}</i>"
                
                exp_table_data = [[
                    Paragraph(role_company, body_style),
                    Paragraph(f"<div align='right'>{date_loc}</div>", body_style)
                ]]
                t = Table(exp_table_data, colWidths=[360, 180])
                t.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('LEFTPADDING', (0,0), (-1,-1), 0),
                    ('RIGHTPADDING', (0,0), (-1,-1), 0),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 1),
                    ('TOPPADDING', (0,0), (-1,-1), 0),
                ]))
                story.append(t)
                
                for b in exp.get('bullets', []):
                    b_clean = escape_xml(b)
                    story.append(Paragraph(f"&bull; {b_clean}", bullet_style))
                story.append(Spacer(1, 3))
                
        elif sec == 'projects' and doc_json.get('projects'):
            story.append(Paragraph("Projects", sec_heading_style))
            for proj in doc_json.get('projects', []):
                p_name = escape_xml(proj.get('name', 'Project'))
                p_title = f"<b>{p_name}</b>"
                if proj.get('technologies'):
                    t_esc = escape_xml(proj.get('technologies'))
                    p_title += f" <i>({t_esc})</i>"
                if proj.get('repo_or_demo_url'):
                    u_esc = escape_xml(proj.get('repo_or_demo_url'))
                    p_title += f" &nbsp;[<a href='{u_esc}' color='#6D4AFF'><u>Link</u></a>]"
                    
                story.append(Paragraph(p_title, body_style))
                for b in proj.get('bullets', []):
                    story.append(Paragraph(f"&bull; {escape_xml(b)}", bullet_style))
                story.append(Spacer(1, 3))
                
        elif sec == 'education' and doc_json.get('education'):
            story.append(Paragraph("Education", sec_heading_style))
            for edu in doc_json.get('education', []):
                d_esc = escape_xml(edu.get('degree', 'Degree'))
                i_esc = escape_xml(edu.get('institution', 'Institution'))
                dt_esc = escape_xml(edu.get('dates', ''))
                
                deg_inst = f"<b>{d_esc}</b> &nbsp;|&nbsp; {i_esc}"
                dt = f"<i>{dt_esc}</i>"
                t_data = [[
                    Paragraph(deg_inst, body_style),
                    Paragraph(f"<div align='right'>{dt}</div>", body_style)
                ]]
                t = Table(t_data, colWidths=[380, 160])
                t.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('LEFTPADDING', (0,0), (-1,-1), 0),
                    ('RIGHTPADDING', (0,0), (-1,-1), 0),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 1),
                    ('TOPPADDING', (0,0), (-1,-1), 0),
                ]))
                story.append(t)
                if edu.get('details'):
                    story.append(Paragraph(escape_xml(edu.get('details')), bullet_style))
                story.append(Spacer(1, 2))
                
    doc.build(story)
    return output_path

def generate_cover_letter_pdf(cl_model: dict, output_path: str) -> str:
    """
    Generates a formal selectable text PDF cover letter with strict XML escaping.
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
    name = escape_xml(content.get('applicant_name', 'Applicant Name'))
    story.append(Paragraph(name, header_style))
    contact = f"{escape_xml(content.get('applicant_email', ''))} &nbsp;|&nbsp; {escape_xml(content.get('applicant_phone', ''))}"
    story.append(Paragraph(contact, subhead_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E8E4F0'), spaceAfter=14))
    
    # Date & Recipient
    comp_esc = escape_xml(content.get('company_name', 'Target Company'))
    role_esc = escape_xml(content.get('job_title', 'Target Role'))
    to_text = f"<b>To:</b> Hiring Team<br/><b>Company:</b> {comp_esc}<br/><b>Role:</b> {role_esc}"
    story.append(Paragraph(to_text, body_style))
    story.append(Spacer(1, 6))
    
    # Salutation
    salutation = escape_xml(content.get('salutation', 'Dear Hiring Manager,'))
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
            story.append(Paragraph(escape_xml(p), body_style))
            
    # Sign off
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"Sincerely,<br/><br/><b>{name}</b>", body_style))
    
    doc.build(story)
    return output_path
