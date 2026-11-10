import re
from app.models import ProfileFact

def analyze_profile_matches(analysis_data: dict, profile_facts: list) -> list[dict]:
    """
    Compares job requirements with verified user profile facts.
    Returns classified matches with evidence fact IDs, status, and honest recommendations.
    """
    matches = []
    
    # Index profile facts by text content and fact type
    fact_index = []
    for fact in profile_facts:
        f_id = fact.id
        f_type = fact.type
        data = fact.data or {}
        
        # Flatten all text from fact payload
        text_blobs = []
        if isinstance(data, dict):
            for k, v in data.items():
                if isinstance(v, str):
                    text_blobs.append(v)
                elif isinstance(v, list):
                    text_blobs.extend([str(item) for item in v])
        fact_text = " ".join(text_blobs).lower()
        fact_index.append({
            'id': f_id,
            'type': f_type,
            'data': data,
            'text': fact_text
        })
        
    requirements = []
    for r in analysis_data.get('required_skills', []):
        requirements.append({'key': r, 'type': 'required_skill'})
    for p in analysis_data.get('preferred_skills', []):
        requirements.append({'key': p, 'type': 'preferred_skill'})
        
    for req in requirements:
        term = req['key'].lower()
        term_clean = re.escape(term)
        pattern = r'\b' + term_clean + r'\b'
        
        matched_fact_ids = []
        is_exact = False
        
        for item in fact_index:
            if re.search(pattern, item['text']):
                matched_fact_ids.append(item['id'])
                # If it's explicitly in a skill fact or project tech stack, it's strong
                if item['type'] == 'skill':
                    skill_name = str(item['data'].get('name', '')).lower()
                    if term in skill_name or skill_name in term:
                        is_exact = True
                elif item['type'] in ('project', 'experience'):
                    techs = str(item['data'].get('technologies', '')).lower()
                    if term in techs:
                        is_exact = True
                        
        if matched_fact_ids and is_exact:
            match_status = 'strong'
            explanation = f"Found verified reference in your profile skills/experience."
            recommendation = f"Feature '{req['key']}' prominently in your professional summary and project bullets."
        elif matched_fact_ids:
            match_status = 'partial'
            explanation = f"Mentioned in your project/experience descriptions."
            recommendation = f"Consider adding '{req['key']}' as an explicit skill entry in your Master Profile if applicable."
        else:
            match_status = 'not_found'
            explanation = f"Not present in your profile."
            recommendation = f"If you possess verified experience with '{req['key']}', add it to your Master Career Profile before applying."

        matches.append({
            'requirement_key': req['key'],
            'requirement_type': req['type'],
            'match_status': match_status,
            'evidence_fact_ids': matched_fact_ids,
            'explanation': explanation,
            'recommendation': recommendation
        })

    return matches

def calculate_alignment_score(matches: list) -> dict:
    """
    Calculates estimated alignment score with transparent breakdown.
    Does NOT claim an employer ATS guarantee.
    """
    if not matches:
        return {'score': 0, 'strong_count': 0, 'partial_count': 0, 'not_found_count': 0, 'total': 0}
        
    strong_count = sum(1 for m in matches if m['match_status'] == 'strong')
    partial_count = sum(1 for m in matches if m['match_status'] == 'partial')
    not_found_count = sum(1 for m in matches if m['match_status'] == 'not_found')
    total = len(matches)
    
    # Weighted calculation: Strong = 1.0, Partial = 0.5
    raw_score = (strong_count * 1.0 + partial_count * 0.5) / total * 100
    score = round(raw_score)
    
    return {
        'score': score,
        'strong_count': strong_count,
        'partial_count': partial_count,
        'not_found_count': not_found_count,
        'total': total,
        'disclaimer': "Estimated alignment is a comparative heuristic based strictly on your profile facts. It does not guarantee recruiter selection or ATS score."
    }

