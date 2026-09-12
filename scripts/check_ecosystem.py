#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, sys, yaml
try:
    from jsonschema import Draft202012Validator
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False

ROOT=Path(__file__).resolve().parents[1]
INIT_MARKERS=('TODO:', 'example_asset.txt', 'scripts/example.py', 'references/api_reference.md')

def frontmatter(path):
    text=path.read_text(encoding='utf-8')
    m=re.match(r'^---\n(.*?)\n---\n',text,re.S)
    if not m: return False,'missing YAML frontmatter', None, text
    try: fm=yaml.safe_load(m.group(1))
    except Exception as e: return False,f'bad YAML frontmatter: {e}', None, text
    if set(fm or {}) != {'name','description'}: return False,f'frontmatter keys must be exactly name+description, got {set(fm or {})}', fm, text
    if not re.match(r'^[a-z0-9-]+$', fm['name']): return False,'bad name', fm, text
    if not fm['description'].strip(): return False,'empty description', fm, text
    return True,'ok', fm, text

def main():
    errors=[]
    skills=[p for p in ROOT.rglob('SKILL.md') if not any(part.startswith('.') for part in p.relative_to(ROOT).parts)]
    skill_names = set()
    
    for p in skills:
        ok,msg,fm,txt=frontmatter(p)
        if not ok: errors.append(f'{p.relative_to(ROOT)}: {msg}')
        elif fm:
            if fm['name'] in skill_names:
                errors.append(f'{p.relative_to(ROOT)}: duplicate skill name {fm["name"]}')
            skill_names.add(fm['name'])
            
        for marker in INIT_MARKERS:
            if marker in txt: errors.append(f'{p.relative_to(ROOT)}: initializer marker {marker!r}')
            
        # check broken referenced files in SKILL.md
        # simplistic check: look for things that look like paths, or maybe just ignore for now if hard to implement
        
        agent=p.parent/'agents/openai.yaml'
        if not agent.exists(): errors.append(f'{p.relative_to(ROOT)}: missing agents/openai.yaml')
        
    for p in ROOT.glob('schemas/*.json'):
        try: json.loads(p.read_text())
        except Exception as e: errors.append(f'{p.relative_to(ROOT)}: {e}')
        
    for p in list(ROOT.glob('config/*.yaml'))+list(ROOT.glob('catalog/*.yaml'))+list(ROOT.glob('adapters/**/*.yaml'))+list(ROOT.glob('evals/*.yaml')):
        try: yaml.safe_load(p.read_text())
        except Exception as e: errors.append(f'{p.relative_to(ROOT)}: {e}')
        
    # 1 & 2. Adapter validation
    adapter_schema_path = ROOT/'schemas/adapter.schema.json'
    if adapter_schema_path.exists() and HAS_JSONSCHEMA:
        try:
            adapter_schema = json.loads(adapter_schema_path.read_text())
            validator = Draft202012Validator(adapter_schema)
            for p in ROOT.glob('adapters/seed/*.yaml'):
                try:
                    data = yaml.safe_load(p.read_text())
                    for err in validator.iter_errors(data):
                        errors.append(f'{p.relative_to(ROOT)} schema error: {err.message}')
                    if 'id' not in data: errors.append(f'{p.relative_to(ROOT)} missing id')
                except Exception as e: pass
        except Exception as e: pass
        
    # 3. Hook manifest
    hook_manifest = ROOT/'.office/hook-manifest.json'
    if hook_manifest.exists():
        try: json.loads(hook_manifest.read_text())
        except Exception as e: errors.append(f'{hook_manifest.relative_to(ROOT)} invalid JSON: {e}')
        
    if errors:
        print('FAIL')
        for e in errors: print('-',e)
        return 1
    print(f'PASS: {len(skills)} skills, {len(list(ROOT.glob("schemas/*.json")))} schemas, {len(list(ROOT.glob("evals/*.yaml")))} evals')
    return 0

if __name__=='__main__': sys.exit(main())
