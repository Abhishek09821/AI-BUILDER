import re
import html
from typing import Dict, List, Any, Optional

# Keywords for classifying section headers
SECTION_MAP = {
    'summary': [
        'summary', 'professional summary', 'executive summary', 'profile',
        'professional profile', 'about', 'about me', 'career objective',
        'objective', 'overview', 'career overview', 'personal statement',
        'career summary', 'biography', 'bio'
    ],
    'skills': [
        'skills', 'technical skills', 'core competencies', 'competencies',
        'technologies', 'tech stack', 'skills & tools', 'skills and tools',
        'areas of expertise', 'tools & technologies', 'programming languages',
        'frameworks', 'key skills', 'technical proficiencies', 'expertise',
        'technical expertise', 'hard skills', 'tools'
    ],
    'experiences': [
        'experience', 'work experience', 'professional experience',
        'employment history', 'work history', 'relevant experience',
        'career history', 'internships', 'experience & achievements',
        'professional background', 'employment', 'practical experience',
        'industry experience', 'work background'
    ],
    'projects': [
        'projects', 'personal projects', 'featured projects', 'key projects',
        'academic projects', 'selected projects', 'technical projects',
        'open source projects', 'portfolio projects', 'side projects',
        'notable projects', 'recent projects'
    ],
    'education': [
        'education', 'academic background', 'academics', 'academic qualifications',
        'educational background', 'degrees', 'education & certifications',
        'university', 'academic history', 'qualifications'
    ],
    'certifications': [
        'certifications', 'certificates', 'licenses & certifications',
        'licenses and certifications', 'courses & certifications',
        'accreditations', 'professional certifications'
    ]
}

# Date regex matching Month Year - Month Year, YYYY - Present, MM/YYYY, etc.
DATE_RANGE_REGEX = re.compile(
    r'(?i)\b('
    r'(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{1,2}/\d{4}|\b\d{4}\b)'
    r'\s*(?:[-–—to\s]+)\s*'
    r'(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{1,2}/\d{4}|\b\d{4}\b|present|current|now|ongoing)'
    r'|'
    r'(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\b\d{4}\b)'
    r')\b'
)

# Degrees indicator for education detection
DEGREE_KEYWORDS = [
    'bachelor', 'master', 'phd', 'doctorate', 'b.s.', 'm.s.', 'b.tech', 'm.tech',
    'b.e.', 'm.e.', 'b.a.', 'm.a.', 'bba', 'mba', 'bca', 'mca', 'associate',
    'diploma', 'high school', 'secondary school', 'b.sc', 'm.sc', 'degree'
]

# Noise patterns to discard (icons, design artifacts, page counters, photo placeholders)
NOISE_PATTERNS = [
    re.compile(r'(?i)^(page\s+\d+(\s+of\s+\d+)?|\d+\s*/\s*\d+)$'),
    re.compile(r'(?i)^(curriculum\s+vitae|resume|c\.?v\.?)$'),
    re.compile(r'(?i)^(designed\s+with|made\s+in|powered\s+by|template\s+by).*$'),
    re.compile(r'(?i)^.*(photo|picture|headshot|logo|icon|avatar|graphic|watermark).*$'),
    re.compile(r'^[•·*–—\-_=+~|/\\:;,. ]{1,4}$'),
    re.compile(r'(?i)^(phone|email|e-mail|website|linkedin|github|portfolio|address)\s*[:：]?$')
]

def is_noise_line(line: str) -> bool:
    s = line.strip()
    if not s or len(s) <= 1:
        return True
    for p in NOISE_PATTERNS:
        if p.match(s):
            return True
    # If line is just single non-alphanumeric symbols
    if not any(c.isalnum() for c in s):
        return True
    return False

def classify_header(line: str) -> Optional[str]:
    clean = re.sub(r'[^a-zA-Z\s]', ' ', line).strip().lower()
    clean = re.sub(r'\s+', ' ', clean)
    
    # Must be relatively short to be a section header
    if len(clean) > 40 or len(clean) < 3:
        return None
        
    for sec_name, keywords in SECTION_MAP.items():
        if clean in keywords:
            return sec_name
        for kw in keywords:
            # Match exact keyword inside line if it's isolated or prefixed by #
            if re.fullmatch(rf'(#+\s*)?{re.escape(kw)}', clean):
                return sec_name

    # Stem fallback for headers with <= 4 words
    words = clean.split()
    if len(words) <= 4:
        if any(w in words for w in ['skills', 'technologies', 'competencies', 'proficiencies']):
            return 'skills'
        if any(w in words for w in ['experience', 'employment', 'history']) and not any(w in words for w in ['education', 'academic']):
            return 'experiences'
        if any(w in words for w in ['projects', 'project']):
            return 'projects'
        if any(w in words for w in ['education', 'academic', 'academics', 'degrees', 'university', 'qualifications']):
            return 'education'
        if any(w in words for w in ['certifications', 'certificates', 'accreditations']):
            return 'certifications'
        if any(w in words for w in ['summary', 'profile', 'bio', 'objective', 'overview']):
            return 'summary'

    return None

def extract_dates_from_line(line: str) -> tuple[str, str]:
    """Finds date range in line and returns (date_str, line_without_date)"""
    match = DATE_RANGE_REGEX.search(line)
    if match:
        date_str = match.group(0).strip()
        rem_line = (line[:match.start()] + ' ' + line[match.end():]).strip()
        rem_line = re.sub(r'\s*\|\s*$', '', rem_line)
        rem_line = re.sub(r'^\s*\|\s*', '', rem_line)
        rem_line = re.sub(r'\s*,\s*$', '', rem_line)
        return date_str, rem_line
    return "", line

def clean_bullet(line: str) -> str:
    """Strips leading bullet symbols, asterisks, dashes, numbers"""
    b = re.sub(r'^\s*(?:[•·*–—\->•✓✔►]+\s*|\d+[\.\)]\s*)', '', line).strip()
    return b

def parse_resume_text(full_text: str) -> Dict[str, Any]:
    """
    Parses unstructured text extracted from PDF or DOCX into a rich structured resume dictionary.
    Includes smart noise filtering, multi-entry splitting for work, education, and projects,
    and accurate contact extraction.
    """
    raw_lines = [l.strip() for l in full_text.splitlines()]
    lines = [l for l in raw_lines if not is_noise_line(l)]
    
    extracted: Dict[str, Any] = {
        'name': '',
        'headline': '',
        'email': '',
        'phone': '',
        'city_country': '',
        'summary': '',
        'skills': [],
        'experiences': [],
        'projects': [],
        'education': [],
        'certifications': [],
        'links': []
    }
    
    if not lines:
        return extracted
        
    # 1. Contact Regex Search across entire text
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', full_text)
    if email_match:
        extracted['email'] = email_match.group(0)
        
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}', full_text)
    if phone_match:
        extracted['phone'] = phone_match.group(0)
        
    url_matches = re.findall(r'https?://[^\s]+|linkedin\.com/[^\s]+|github\.com/[^\s]+', full_text)
    for u in url_matches:
        url_clean = u.rstrip('.,;()[]{}')
        label = "Website"
        link_type = "other"
        u_lower = url_clean.lower()
        if "linkedin" in u_lower:
            label = "LinkedIn"
            link_type = "linkedin"
        elif "github" in u_lower:
            label = "GitHub"
            link_type = "github"
        elif "portfolio" in u_lower:
            label = "Portfolio"
            link_type = "portfolio"
        extracted['links'].append({
            'label': label,
            'url': url_clean if url_clean.startswith('http') else f"https://{url_clean}",
            'link_type': link_type
        })
        
    # 2. Extract Candidate Name & Headline from Header Lines (before first major section)
    # Search first 8 lines
    header_lines = []
    first_sec_idx = len(lines)
    for idx, line in enumerate(lines[:12]):
        if classify_header(line):
            first_sec_idx = idx
            break
        header_lines.append(line)
        
    # Smart Name Candidate: 2 to 4 capitalized words without digits or emails
    detected_name = ""
    detected_headline = ""
    detected_location = ""
    
    for h_line in header_lines:
        h_clean = h_line.strip()
        # Check for candidate name
        if not detected_name:
            words = h_clean.split()
            if 1 <= len(words) <= 4:
                if not any(c.isdigit() or c in '@:/\\{}[]' for c in h_clean):
                    disallowed = ['developer', 'engineer', 'manager', 'lead', 'analyst', 'designer', 'architect', 'photo', 'logo', 'image', 'picture', 'icon', 'resume', 'cv', 'page', 'here', 'insert', 'profile', 'portfolio', 'contact']
                    if not any(k in h_clean.lower() for k in disallowed):
                        detected_name = h_clean
                        continue
        # Check for headline
        if detected_name and not detected_headline:
            if any(k in h_clean.lower() for k in ['developer', 'engineer', 'manager', 'lead', 'analyst', 'designer', 'architect', 'specialist', 'consultant']):
                detected_headline = h_clean
                continue
        # Check for location
        if not detected_location:
            parts = [p.strip() for p in re.split(r'[|,]+', h_clean)]
            loc_matches = ['usa', 'india', 'uk', 'canada', 'germany', 'remote', 'ca', 'ny', 'tx', 'fl', 'wa', 'san francisco', 'london', 'berlin', 'toronto', 'bangalore', 'new york']
            for pt in parts:
                if any(lm in pt.lower() for lm in loc_matches) and '@' not in pt and not any(c.isdigit() for c in pt):
                    if len(pt) < 50:
                        detected_location = pt
                        break
            if not detected_location and any(lm in h_clean.lower() for lm in loc_matches):
                if len(h_clean) < 60 and '@' not in h_clean and not any(c.isdigit() for c in h_clean):
                    detected_location = h_clean
                    
    extracted['name'] = detected_name or (lines[0] if lines else 'Applicant Name')
    extracted['headline'] = detected_headline
    extracted['city_country'] = detected_location
    
    # 3. Partition lines into sections
    sections_data: Dict[str, List[str]] = {}
    current_sec = None
    
    for line in lines[first_sec_idx:]:
        h_type = classify_header(line)
        if h_type:
            current_sec = h_type
            if current_sec not in sections_data:
                sections_data[current_sec] = []
        elif current_sec:
            sections_data[current_sec].append(line)
            
    # 4. Parse Each Section Content
    
    # -- SUMMARY --
    if 'summary' in sections_data and sections_data['summary']:
        extracted['summary'] = "\n".join(sections_data['summary']).strip()
        
    # -- SKILLS --
    if 'skills' in sections_data and sections_data['skills']:
        skill_lines = sections_data['skills']
        for s_line in skill_lines:
            # Check for category prefix like "Languages: Python, Go, C++"
            category = "General"
            content = s_line
            if ':' in s_line and not s_line.startswith('http'):
                parts = s_line.split(':', 1)
                if len(parts[0].strip().split()) <= 4:
                    category = parts[0].strip(' -*•')
                    content = parts[1]
                    
            # Split items by comma, pipe, bullet, tab
            raw_items = re.split(r'[,|•·\t]+', content)
            for it in raw_items:
                it_clean = it.strip(' -*:•·')
                if it_clean and 1 < len(it_clean) < 40:
                    if not any(w in it_clean.lower() for w in ['phone', 'email', 'address', 'page']):
                        extracted['skills'].append({
                            'name': it_clean,
                            'category': category
                        })
                        
    # -- EXPERIENCES (Multi-entry splitting) --
    if 'experiences' in sections_data and sections_data['experiences']:
        exp_lines = sections_data['experiences']
        extracted['experiences'] = parse_multi_entry_experiences(exp_lines)
        
    # -- PROJECTS (Multi-entry splitting) --
    if 'projects' in sections_data and sections_data['projects']:
        proj_lines = sections_data['projects']
        extracted['projects'] = parse_multi_entry_projects(proj_lines)
        
    # -- EDUCATION (Multi-entry splitting) --
    if 'education' in sections_data and sections_data['education']:
        edu_lines = sections_data['education']
        extracted['education'] = parse_multi_entry_education(edu_lines)
        
    # -- CERTIFICATIONS --
    if 'certifications' in sections_data and sections_data['certifications']:
        for c_line in sections_data['certifications']:
            c_clean = clean_bullet(c_line)
            if c_clean and len(c_clean) > 3:
                extracted['certifications'].append(c_clean)
                
    return extracted


def parse_multi_entry_experiences(lines: List[str]) -> List[Dict[str, Any]]:
    """
    Intelligently splits experience section lines into individual company/role records.
    Detects role/company transitions using date patterns, separator characters (|),
    and bullet points.
    """
    entries = []
    current_entry: Optional[Dict[str, Any]] = None
    
    for line in lines:
        date_str, line_without_date = extract_dates_from_line(line)
        is_bullet = line.strip().startswith(('•', '-', '*', '–', '—', '·', '>')) or (line.strip() and line.strip()[0].isdigit() and line.strip()[1:3] in ('. ', ') '))
        
        # If we have an existing entry that already collected bullets, and this line is NOT a bullet,
        # it is the title/company header of the NEXT role!
        if current_entry and current_entry['bullets'] and not is_bullet:
            entries.append(finalize_exp_entry(current_entry))
            role, comp, loc = parse_role_company_location(line_without_date)
            current_entry = {
                'title': role or line_without_date[:60],
                'company': comp or 'Company',
                'dates': date_str or 'Present',
                'location': loc or '',
                'bullets': [],
                'description': ''
            }
            continue
            
        # New Entry Trigger:
        # A line that contains a date range and is not purely a bullet
        if date_str and not is_bullet:
            # If current_entry exists and has NO bullets yet, this line is the date line for the current job!
            if current_entry and not current_entry['bullets'] and current_entry['dates'] in ('Present', ''):
                current_entry['dates'] = date_str
                if line_without_date.strip():
                    r, c, l = parse_role_company_location(line_without_date)
                    if c and current_entry['company'] == 'Company':
                        current_entry['company'] = c
                    if l and not current_entry['location']:
                        current_entry['location'] = l
                continue
                
            if current_entry:
                entries.append(finalize_exp_entry(current_entry))
                
            role, comp, loc = parse_role_company_location(line_without_date)
            current_entry = {
                'title': role or 'Role',
                'company': comp or 'Company',
                'dates': date_str,
                'location': loc or '',
                'bullets': [],
                'description': ''
            }
            continue
            
        # If line has no date, but current_entry is None or previous was closed
        if not current_entry:
            role, comp, loc = parse_role_company_location(line_without_date)
            current_entry = {
                'title': role or line_without_date[:60],
                'company': comp or 'Company',
                'dates': date_str or 'Present',
                'location': loc or '',
                'bullets': [],
                'description': ''
            }
            continue
            
        # Check if line indicates a new job without a date on the same line (e.g. Next line has the date)
        if not is_bullet and ('|' in line or ' - ' in line) and len(line) < 90 and not current_entry['bullets']:
            # Maybe title was line 1, company was line 2
            if current_entry['company'] == 'Company':
                current_entry['company'] = line.strip()
                continue
                
        # Bullet point or descriptive line
        clean_b = clean_bullet(line)
        if clean_b:
            if is_bullet or len(clean_b) > 40:
                current_entry['bullets'].append(clean_b)
            elif not current_entry['dates'] and date_str:
                current_entry['dates'] = date_str
            else:
                current_entry['bullets'].append(clean_b)
                
    if current_entry:
        entries.append(finalize_exp_entry(current_entry))
        
    return entries


def finalize_exp_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    entry['description'] = "\n".join(entry['bullets']) if entry['bullets'] else f"{entry['title']} at {entry['company']}"
    if not entry.get('dates'):
        entry['dates'] = 'Present'
    return entry


def parse_role_company_location(text: str) -> tuple[str, str, str]:
    """Extracts role, company, location from header strings like 'Software Engineer | Google | MTV'"""
    parts = [p.strip() for p in re.split(r'[|,–—]+', text) if p.strip()]
    role = ""
    company = ""
    location = ""
    
    if len(parts) >= 3:
        role = parts[0]
        company = parts[1]
        location = parts[2]
    elif len(parts) == 2:
        # Check which one looks like a role
        if any(r in parts[0].lower() for r in ['engineer', 'developer', 'manager', 'lead', 'intern', 'analyst', 'specialist', 'director']):
            role = parts[0]
            company = parts[1]
        else:
            company = parts[0]
            role = parts[1]
    elif len(parts) == 1:
        role = parts[0]
        
    return role, company, location


def parse_multi_entry_projects(lines: List[str]) -> List[Dict[str, Any]]:
    """Splits project section lines into individual project records."""
    projects = []
    current_proj: Optional[Dict[str, Any]] = None
    
    for line in lines:
        is_bullet = line.strip().startswith(('•', '-', '*', '–', '—', '·', '>')) or (line.strip() and line.strip()[0].isdigit() and line.strip()[1:3] in ('. ', ') '))
        
        # Check if line looks like a project title: short, has technology tag in parentheses or pipe
        has_tech = '(' in line and ')' in line
        has_sep = '|' in line
        has_url = 'http' in line or 'github.com' in line
        
        if (has_tech or has_sep or has_url or not is_bullet) and len(line) < 100:
            # Start new project if previous has bullets
            if current_proj and current_proj['bullets']:
                current_proj['description'] = "\n".join(current_proj['bullets'])
                projects.append(current_proj)
                current_proj = None
                
            if not current_proj:
                name = line
                tech = ""
                url = ""
                
                # Extract URL if present
                u_match = re.search(r'https?://[^\s]+|github\.com/[^\s]+', line)
                if u_match:
                    url = u_match.group(0).rstrip('.,;()[]{}')
                    line = (line[:u_match.start()] + ' ' + line[u_match.end():]).strip()
                    
                # Extract technology if in parentheses e.g. "SmartAI (Python, PyTorch)"
                t_match = re.search(r'\((.*?)\)', line)
                if t_match:
                    tech = t_match.group(1)
                    name = (line[:t_match.start()] + ' ' + line[t_match.end():]).strip()
                elif '|' in line:
                    parts = line.split('|', 1)
                    name = parts[0].strip()
                    tech = parts[1].strip()
                    
                current_proj = {
                    'name': name.strip(' -*•') or 'Project',
                    'technologies': tech.strip(),
                    'repo_or_demo_url': url,
                    'bullets': [],
                    'description': ''
                }
                continue
                
        clean_b = clean_bullet(line)
        if clean_b and current_proj:
            current_proj['bullets'].append(clean_b)
            
    if current_proj:
        current_proj['description'] = "\n".join(current_proj['bullets'])
        projects.append(current_proj)
        
    return projects


def parse_multi_entry_education(lines: List[str]) -> List[Dict[str, Any]]:
    """Splits education section into individual degrees / institutions."""
    entries = []
    current_edu: Optional[Dict[str, Any]] = None
    
    for line in lines:
        date_str, rem_line = extract_dates_from_line(line)
        is_deg = any(deg in line.lower() for deg in DEGREE_KEYWORDS)
        
        if is_deg or (date_str and not current_edu):
            if current_edu:
                entries.append(current_edu)
                
            deg_part = ""
            inst_part = ""
            if '|' in rem_line:
                p = rem_line.split('|', 1)
                deg_part = p[0].strip()
                inst_part = p[1].strip()
            elif ' - ' in rem_line:
                p = rem_line.split(' - ', 1)
                deg_part = p[0].strip()
                inst_part = p[1].strip()
            else:
                deg_part = rem_line.strip()
                
            current_edu = {
                'degree': deg_part or 'Degree',
                'institution': inst_part or 'University / Institution',
                'dates': date_str or '',
                'details': ''
            }
            continue
            
        if current_edu:
            if not current_edu['institution'] or current_edu['institution'] == 'University / Institution':
                current_edu['institution'] = line.strip()
            elif not current_edu['dates'] and date_str:
                current_edu['dates'] = date_str
            else:
                clean_b = clean_bullet(line)
                if clean_b:
                    current_edu['details'] = (current_edu['details'] + '\n' + clean_b).strip()
                    
    if current_edu:
        entries.append(current_edu)
        
    return entries
