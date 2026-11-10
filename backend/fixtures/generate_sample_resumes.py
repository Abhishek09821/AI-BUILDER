import os
from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_sample_docx(path):
    doc = Document()
    doc.add_heading("Alex Morgan", 0)
    doc.add_paragraph("Full Stack Software Engineer | alex.morgan@example.com | +1 555-0149 | San Francisco, CA")
    doc.add_paragraph("https://linkedin.com/in/alexmorgan | https://github.com/alexmorgan")
    
    doc.add_heading("Summary", level=1)
    doc.add_paragraph("Passionate full-stack software engineer with 5+ years of experience architecting web applications with React, Python, and PostgreSQL. Focused on clean code, automated testing, and developer productivity.")
    
    doc.add_heading("Skills", level=1)
    doc.add_paragraph("React, TypeScript, Python, Flask, FastAPI, PostgreSQL, Docker, Redis, Tailwind CSS, Git")
    
    doc.add_heading("Experience", level=1)
    doc.add_paragraph("Senior Frontend Engineer\nTechPulse Labs (2021 - Present)\nSan Francisco, CA")
    doc.add_paragraph("• Architected modular component design system adopted across 6 company engineering teams.")
    doc.add_paragraph("• Decreased initial dashboard rendering time by 42% through lazy loading and query caching.")
    
    doc.add_paragraph("Software Engineer\nDataFlow Analytics (2019 - 2021)\nAustin, TX")
    doc.add_paragraph("• Built customer ingestion portal handling 30,000 requests per minute with Python and PostgreSQL.")
    
    doc.add_heading("Projects", level=1)
    doc.add_paragraph("AI Task Copilot (React, Python, Redis)\nhttps://github.com/alexmorgan/task-copilot")
    doc.add_paragraph("• Engineered conversational task automation assistant integrating LLM APIs and WebSocket events.")
    
    doc.add_heading("Education", level=1)
    doc.add_paragraph("B.S. in Computer Science\nUniversity of California, Berkeley (2015 - 2019)")
    
    doc.save(path)
    print(f"Generated sample DOCX: {path}")

def generate_sample_pdf(path):
    doc = SimpleDocTemplate(path, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = []
    
    story.append(Paragraph("<b>Alex Morgan</b>", styles['Title']))
    story.append(Paragraph("Full Stack Software Engineer | alex.morgan@example.com | +1 555-0149 | San Francisco, CA", styles['Normal']))
    story.append(Paragraph("https://linkedin.com/in/alexmorgan | https://github.com/alexmorgan", styles['Normal']))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("<b>SUMMARY</b>", styles['Heading2']))
    story.append(Paragraph("Passionate full-stack software engineer with 5+ years building web applications with React, Python, and PostgreSQL.", styles['Normal']))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("<b>SKILLS</b>", styles['Heading2']))
    story.append(Paragraph("React, TypeScript, Python, Flask, FastAPI, PostgreSQL, Docker, Redis, Git", styles['Normal']))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("<b>EXPERIENCE</b>", styles['Heading2']))
    story.append(Paragraph("<b>Senior Frontend Engineer</b> - TechPulse Labs (2021 - Present)", styles['Normal']))
    story.append(Paragraph("&bull; Architected modular component design system across 6 company teams.", styles['Normal']))
    story.append(Paragraph("&bull; Decreased initial rendering time by 42% through lazy loading and caching.", styles['Normal']))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("<b>EDUCATION</b>", styles['Heading2']))
    story.append(Paragraph("B.S. in Computer Science - University of California, Berkeley (2015 - 2019)", styles['Normal']))
    
    doc.build(story)
    print(f"Generated sample PDF: {path}")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    generate_sample_docx(os.path.join(base_dir, 'sample_resume.docx'))
    generate_sample_pdf(os.path.join(base_dir, 'sample_resume.pdf'))

