#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, sys, yaml

ROOT=Path(__file__).resolve().parents[1]
INIT_MARKERS=('TODO:', 'example_asset.txt', 'scripts/example.py', 'references/api_reference.md')

def frontmatter(path):
    text=path.read_text(encoding='utf-8')
    m=re.match(r'^---\n(.*?)\n---\n',text,re.S)
    if not m: return False,'missing YAML frontmatter'
    try: fm=yaml.safe_load(m.group(1))
    except Exception as e: return False,f'bad YAML frontmatter: {e}'
    if set(fm or {}) != {'name','description'}: return False,f'frontmatter keys must be exactly name+description, got {set(fm or {})}'
    if not re.match(r'^[a-z0-9-]+$', fm['name']): return False,'bad name'
    if not fm['description'].strip(): return False,'empty description'
    return True,'ok'

def main():
    errors=[]
    skills=list(ROOT.rglob('SKILL.md'))
    for p in skills:
        ok,msg=frontmatter(p)
        if not ok: errors.append(f'{p.relative_to(ROOT)}: {msg}')
        txt=p.read_text(encoding='utf-8')
        for marker in INIT_MARKERS:
            if marker in txt: errors.append(f'{p.relative_to(ROOT)}: initializer marker {marker!r}')
        agent=p.parent/'agents/openai.yaml'
        if not agent.exists(): errors.append(f'{p.relative_to(ROOT)}: missing agents/openai.yaml')
    for p in ROOT.glob('schemas/*.json'):
        try: json.loads(p.read_text())
        except Exception as e: errors.append(f'{p.relative_to(ROOT)}: {e}')
    for p in list(ROOT.glob('config/*.yaml'))+list(ROOT.glob('catalog/*.yaml'))+list(ROOT.glob('adapters/**/*.yaml'))+list(ROOT.glob('evals/*.yaml')):
        try: yaml.safe_load(p.read_text())
        except Exception as e: errors.append(f'{p.relative_to(ROOT)}: {e}')
    if errors:
        print('FAIL')
        for e in errors: print('-',e)
        return 1
    print(f'PASS: {len(skills)} skills, {len(list(ROOT.glob("schemas/*.json")))} schemas, {len(list(ROOT.glob("evals/*.yaml")))} evals')
    return 0
if __name__=='__main__': sys.exit(main())
