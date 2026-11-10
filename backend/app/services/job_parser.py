import re
import requests
from bs4 import BeautifulSoup

def fetch_job_from_url(url: str) -> tuple[bool, str, str]:
    """
    Attempts to fetch public job posting text from a URL.
    Returns: (success: bool, content_or_error: str, detected_title: str)
    """
    if not url.startswith('http://') and not url.startswith('https://'):
        url = 'https://' + url
        
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
    }
    
    try:
        resp = requests.get(url, headers=headers, timeout=8)
        if resp.status_code == 401 or resp.status_code == 403:
            return False, "The job posting URL requires authentication or blocked automated requests. Please paste the job description directly.", ""
        
        if resp.status_code != 200:
            return False, f"Received status code {resp.status_code} from job URL. Please paste the job description directly.", ""
            
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Remove scripts, styles, nav, footer
        for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
            tag.decompose()
            
        title = ""
        title_tag = soup.find('h1') or soup.find('title')
        if title_tag:
            title = title_tag.get_text().strip()
            
        # Target main content containers if possible
        main = soup.find('main') or soup.find('article') or soup.find(class_=re.compile(r'job|posting|description', re.I)) or soup.body
        if not main:
            return False, "Could not locate readable job description on the page. Please paste the text manually.", ""
            
        text = main.get_text(separator="\n")
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        cleaned_text = "\n".join(lines)
        
        if len(cleaned_text) < 100:
            return False, "Job content extracted was too brief or incomplete. Please paste the full description directly.", ""
            
        return True, cleaned_text, title
        
    except requests.exceptions.Timeout:
        return False, "Connection to the job posting URL timed out. Please paste the job description directly.", ""
    except Exception as e:
        return False, f"Could not import URL ({str(e)}). Please paste the job description directly.", ""

def parse_job_requirements(description: str, job_title: str = "", company: str = "") -> dict:
    """
    Extracts structured requirements, seniority clues, skills, and keywords from job description text.
    """
    text_lower = description.lower()
    
    # 1. Seniority clue detection
    seniority = "Mid-Level"
    if any(k in text_lower for k in ['intern', 'internship', 'student', 'co-op', 'entry level', 'junior', 'associate', '0-2 years', '0-1 year', 'fresh graduate']):
        seniority = "Entry-Level / Fresher"
    elif any(k in text_lower for k in ['director', 'vp', 'head of', 'chief', 'principal', 'staff engineer', 'lead engineer', 'architect']):
        seniority = "Lead / Staff / Director"
    elif any(k in text_lower for k in ['senior', 'sr.', '5+ years', '7+ years', '8+ years']):
        seniority = "Senior"

    # 2. Common tech/industry skills dictionary
    known_skills = [
        "python", "javascript", "typescript", "react", "vue", "angular", "node.js", "nodejs",
        "flask", "django", "fastapi", "express", "sql", "postgresql", "mysql", "mongodb",
        "redis", "docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "git", "github",
        "graphql", "rest api", "html5", "css3", "tailwind css", "tailwind", "next.js",
        "microservices", "agile", "scrum", "data structures", "algorithms", "unit testing",
        "pytest", "jest", "cypress", "system design", "linux", "cloud computing", "machine learning",
        "pandas", "numpy", "terraform", "kafka", "elasticsearch", "c++", "java", "golang", "go", "ruby"
    ]
    
    found_skills = []
    for s in known_skills:
        # Match word boundaries
        pattern = r'\b' + re.escape(s) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.append(s.title() if len(s) > 3 and not s.isupper() else s.upper() if len(s) <= 3 else s)

    # 3. Categorize required vs preferred skills
    required_skills = []
    preferred_skills = []
    
    # Split description into sections if "requirements" or "qualifications" exist
    lines = description.splitlines()
    in_required_zone = False
    in_preferred_zone = False
    
    for line in lines:
        l_lower = line.lower().strip()
        if any(h in l_lower for h in ['preferred', 'bonus', 'nice to have', 'plus']):
            in_preferred_zone = True
            in_required_zone = False
        elif any(h in l_lower for h in ['required', 'qualifications', 'requirements', 'must have', 'what you need', 'what you\'ll need']):
            in_required_zone = True
            in_preferred_zone = False
            
        for s in found_skills:
            if s.lower() in l_lower:
                if in_preferred_zone and s not in preferred_skills:
                    preferred_skills.append(s)
                elif s not in required_skills:
                    required_skills.append(s)
                    
    # Distribute remaining found skills
    for s in found_skills:
        if s not in required_skills and s not in preferred_skills:
            required_skills.append(s)
            
    # 4. Responsibilities extraction
    responsibilities = []
    resp_keywords = ['responsible for', 'you will', 'duties include', 'build', 'design', 'lead', 'collaborate', 'deliver', 'develop', 'maintain', 'implement']
    for line in lines:
        l_stripped = line.strip(' -•*·')
        if len(l_stripped) > 25 and len(l_stripped) < 200:
            if any(k in l_stripped.lower() for k in resp_keywords):
                responsibilities.append(l_stripped)
                if len(responsibilities) >= 6:
                    break

    if not responsibilities:
        # Heuristic fallback
        for line in lines:
            l_stripped = line.strip(' -•*·')
            if len(l_stripped) > 30 and len(l_stripped) < 180 and line.strip().startswith(('-', '•', '*', '1.', '2.', '3.')):
                responsibilities.append(l_stripped)
                if len(responsibilities) >= 5:
                    break

    # 5. Keywords
    keywords = list(set(required_skills[:10] + [seniority] + (["Full Stack"] if "full stack" in text_lower else [])))
    
    role_summary = f"{seniority} position at {company or 'target company'} focusing on {', '.join(required_skills[:4]) if required_skills else 'software development and engineering'}."

    return {
        'role_summary': role_summary,
        'seniority_level': seniority,
        'required_skills': required_skills[:12],
        'preferred_skills': preferred_skills[:8],
        'responsibilities': responsibilities[:6],
        'keywords': keywords[:15]
    }

