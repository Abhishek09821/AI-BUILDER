import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def add_hyperlink(paragraph, url, text, color="6D4AFF", underline=True):
    """
    Adds a clickable hyperlink to a python-docx paragraph.
    """
    part = paragraph.part
    r_id = part.relate_to(url, docx_relationship_type(), is_external=True)

    hyperlink = OxmlElement('w:hyperlink')
    hyperlink.set(qn('r:id'), r_id)

    new_run = OxmlElement('w:r')
    rPr = OxmlElement('w:rPr')

    if color:
        c = OxmlElement('w:color')
        c.set(qn('w:val'), color)
        rPr.append(c)

    if underline:
        u = OxmlElement('w:u')
        u.set(qn('w:val'), 'single')
        rPr.append(u)

    new_run.append(rPr)
    text_elem = OxmlElement('w:t')
    text_elem.text = text
    new_run.append(text_elem)
    hyperlink.append(new_run)
    paragraph._p.append(hyperlink)
    return hyperlink

def docx_relationship_type():
    return 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink'

def parse_docx_resume(file_path: str) -> dict:
    """
    Extracts text and sections from an uploaded DOCX file for staging review.
    Handles paragraphs, bullet lists, and table structures cleanly.
    """
    doc = Document(file_path)
    all_lines = []
    for p in doc.paragraphs:
        t = p.text.strip()
        if t:
            all_lines.append(t)
    for table in doc.tables:
        for row in table.rows:
            row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
            if row_text:
                all_lines.append(row_text)
                
    full_text = "\n".join(all_lines)
    from app.services.resume_parser import parse_resume_text
    return parse_resume_text(full_text)

def generate_resume_docx(doc_model: dict, output_path: str, template_id: str = 'modern-ats') -> str:
    """
    Generates a beautifully formatted DOCX resume adhering to the template styling.
    """
    doc = Document()
    
    # Configure 0.6 inch margins for clean professional layout
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(0.6)
        s.bottom_margin = Inches(0.6)
        s.left_margin = Inches(0.65)
        s.right_margin = Inches(0.65)
        
    doc_json = doc_model.get('document_json', {})
    contact = doc_json.get('contact', {})
    
    # 1. Header: Name & Headline
    p_name = doc.add_paragraph()
    p_name.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_name = p_name.add_run(contact.get('name', 'Applicant Name'))
    run_name.font.size = Pt(20)
    run_name.font.bold = True
    run_name.font.name = 'Calibri'
    if template_id == 'clean-professional':
        run_name.font.color.rgb = RGBColor(109, 74, 255) # Primary Purple
    else:
        run_name.font.color.rgb = RGBColor(39, 35, 58) # ATS Primary
        
    if contact.get('headline'):
        p_head = doc.add_paragraph()
        p_head.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run_head = p_head.add_run(contact.get('headline'))
        run_head.font.size = Pt(11)
        run_head.font.color.rgb = RGBColor(119, 114, 138)
        p_head.paragraph_format.space_after = Pt(4)
        
    # 2. Contact details & Links inline
    p_contact = doc.add_paragraph()
    p_contact.alignment = WD_ALIGN_PARAGRAPH.CENTER
    contact_parts = []
    if contact.get('email'):
        contact_parts.append(contact.get('email'))
    if contact.get('phone'):
        contact_parts.append(contact.get('phone'))
    if contact.get('city_country'):
        contact_parts.append(contact.get('city_country'))
        
    run_cnt = p_contact.add_run(" | ".join(contact_parts))
    run_cnt.font.size = Pt(9.5)
    run_cnt.font.color.rgb = RGBColor(70, 70, 70)
    
    # Links
    links = doc_json.get('links', [])
    if links:
        p_links = doc.add_paragraph()
        p_links.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for i, link in enumerate(links):
            label = link.get('label') or link.get('url')
            url = link.get('url')
            if url:
                add_hyperlink(p_links, url, label, color="6D4AFF" if template_id == 'clean-professional' else "333333")
                if i < len(links) - 1:
                    p_links.add_run("   •   ")
        p_links.paragraph_format.space_after = Pt(12)
    else:
        p_contact.paragraph_format.space_after = Pt(12)
        
    # Helper to add section headings
    def add_section_header(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(title.upper())
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.name = 'Calibri'
        if template_id == 'clean-professional':
            run.font.color.rgb = RGBColor(109, 74, 255)
        else:
            run.font.color.rgb = RGBColor(39, 35, 58)
            
    section_order = doc_json.get('section_order', ['summary', 'skills', 'experience', 'projects', 'education'])
    sections_visible = doc_json.get('section_visibility', {})
    
    for sec in section_order:
        if sections_visible.get(sec, True) is False:
            continue
            
        if sec == 'summary' and doc_json.get('summary'):
            add_section_header("Professional Summary")
            p_s = doc.add_paragraph()
            r_s = p_s.add_run(doc_json.get('summary'))
            r_s.font.size = Pt(10)
            r_s.font.name = 'Calibri'
            p_s.paragraph_format.space_after = Pt(8)
            
        elif sec == 'skills' and doc_json.get('skills'):
            add_section_header("Core Skills & Competencies")
            skills_data = doc_json.get('skills', [])
            p_sk = doc.add_paragraph()
            # If skills are grouped
            if isinstance(skills_data, list):
                skill_names = [s.get('name', '') if isinstance(s, dict) else str(s) for s in skills_data]
                r_sk = p_sk.add_run(" • ".join(filter(None, skill_names)))
                r_sk.font.size = Pt(9.5)
                r_sk.font.name = 'Calibri'
            p_sk.paragraph_format.space_after = Pt(8)
            
        elif sec == 'experience' and doc_json.get('experience'):
            add_section_header("Work Experience")
            for exp in doc_json.get('experience', []):
                p_exp = doc.add_paragraph()
                p_exp.paragraph_format.space_before = Pt(4)
                p_exp.paragraph_format.space_after = Pt(2)
                
                # Title and Company
                r_title = p_exp.add_run(exp.get('title', 'Role'))
                r_title.bold = True
                r_title.font.size = Pt(10)
                
                r_comp = p_exp.add_run(f" | {exp.get('company', '')}")
                r_comp.font.size = Pt(10)
                
                date_str = exp.get('dates') or ''
                loc_str = exp.get('location') or ''
                meta = " - ".join(filter(None, [loc_str, date_str]))
                if meta:
                    p_meta = doc.add_paragraph()
                    r_meta = p_meta.add_run(meta)
                    r_meta.font.size = Pt(9)
                    r_meta.italic = True
                    r_meta.font.color.rgb = RGBColor(120, 120, 120)
                    p_meta.paragraph_format.space_after = Pt(2)
                    
                # Bullets
                bullets = exp.get('bullets', [])
                for b in bullets:
                    p_b = doc.add_paragraph(style='List Bullet')
                    p_b.paragraph_format.space_before = Pt(1)
                    p_b.paragraph_format.space_after = Pt(2)
                    r_b = p_b.add_run(b)
                    r_b.font.size = Pt(9.5)
                    r_b.font.name = 'Calibri'
                    
        elif sec == 'projects' and doc_json.get('projects'):
            add_section_header("Featured Projects")
            for proj in doc_json.get('projects', []):
                p_proj = doc.add_paragraph()
                p_proj.paragraph_format.space_before = Pt(4)
                p_proj.paragraph_format.space_after = Pt(2)
                
                r_name = p_proj.add_run(proj.get('name', 'Project'))
                r_name.bold = True
                r_name.font.size = Pt(10)
                
                if proj.get('technologies'):
                    r_tech = p_proj.add_run(f" ({proj.get('technologies')})")
                    r_tech.font.size = Pt(9.5)
                    r_tech.italic = True
                    
                if proj.get('repo_or_demo_url'):
                    add_hyperlink(p_proj, proj.get('repo_or_demo_url'), " [Link]", color="6D4AFF")
                    
                bullets = proj.get('bullets', [])
                for b in bullets:
                    p_b = doc.add_paragraph(style='List Bullet')
                    p_b.paragraph_format.space_before = Pt(1)
                    p_b.paragraph_format.space_after = Pt(2)
                    r_b = p_b.add_run(b)
                    r_b.font.size = Pt(9.5)
                    r_b.font.name = 'Calibri'
                    
        elif sec == 'education' and doc_json.get('education'):
            add_section_header("Education")
            for edu in doc_json.get('education', []):
                p_edu = doc.add_paragraph()
                p_edu.paragraph_format.space_before = Pt(3)
                p_edu.paragraph_format.space_after = Pt(2)
                
                r_deg = p_edu.add_run(edu.get('degree', 'Degree'))
                r_deg.bold = True
                r_deg.font.size = Pt(10)
                
                r_inst = p_edu.add_run(f" | {edu.get('institution', '')}")
                r_inst.font.size = Pt(10)
                
                if edu.get('dates'):
                    r_dt = p_edu.add_run(f" ({edu.get('dates')})")
                    r_dt.italic = True
                    r_dt.font.size = Pt(9)
                    
    doc.save(output_path)
    return output_path

def generate_cover_letter_docx(cl_model: dict, output_path: str) -> str:
    """
    Generates a formal DOCX cover letter.
    """
    doc = Document()
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)
        
    content = cl_model.get('content_json', {})
    
    # Applicant Header
    p_hdr = doc.add_paragraph()
    r_name = p_hdr.add_run(content.get('applicant_name', 'Applicant Name'))
    r_name.font.size = Pt(16)
    r_name.font.bold = True
    r_name.font.color.rgb = RGBColor(109, 74, 255)
    
    p_sub = doc.add_paragraph()
    p_sub.add_run(f"{content.get('applicant_email', '')} | {content.get('applicant_phone', '')}")
    p_sub.paragraph_format.space_after = Pt(18)
    
    # Recipient info
    p_rec = doc.add_paragraph()
    p_rec.add_run(f"To: Hiring Team\n{content.get('company_name', 'Target Company')}\nRe: Application for {content.get('job_title', 'Target Role')}")
    p_rec.paragraph_format.space_after = Pt(14)
    
    # Salutation
    p_sal = doc.add_paragraph()
    p_sal.add_run(content.get('salutation', 'Dear Hiring Team,'))
    p_sal.paragraph_format.space_after = Pt(8)
    
    # Paragraphs
    paragraphs = [
        content.get('opening_paragraph', ''),
        content.get('evidence_paragraph_1', ''),
        content.get('evidence_paragraph_2', ''),
        content.get('company_hook_paragraph', ''),
        content.get('closing_paragraph', '')
    ]
    
    for p_text in paragraphs:
        if p_text:
            p = doc.add_paragraph()
            r = p.add_run(p_text)
            r.font.size = Pt(10.5)
            r.font.name = 'Calibri'
            p.paragraph_format.space_after = Pt(8)
            p.paragraph_format.line_spacing = 1.15
            
    # Sign-off
    p_sign = doc.add_paragraph()
    p_sign.paragraph_format.space_before = Pt(10)
    p_sign.add_run(f"Sincerely,\n\n{content.get('applicant_name', 'Applicant Name')}")
    
    doc.save(output_path)
    return output_path

