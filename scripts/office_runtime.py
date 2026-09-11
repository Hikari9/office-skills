#!/usr/bin/env python3
"""Deterministic helpers for the Auto Office v3 skill bundle.

Route-time commands never perform network access. Catalog fetching/normalization should happen
outside routing and be committed to a content-addressed local snapshot before selection.
"""
from __future__ import annotations
import argparse, hashlib, json, math, os, re, sqlite3, sys, uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
SCHEMAS = ROOT / "schemas"
CANON_EFFORTS = {"none", "low", "medium", "high", "xhigh", "max"}
MUTABLE_TRUST_ROLES = {"executor", "code_reviewer", "browser_verifier", "closeout_verifier"}
ATTRIBUTIONS = {"model","harness","adapter","quota/account","environment/network","planner","brief","repository","verification","unknown"}
OUTCOMES = {"pending","verified_no_observed_failure","recurrence_failure","revert_failure","material_post_merge_defect","abandoned","environment_failure"}


def load_data(path: str | Path) -> Any:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    if p.suffix.lower() == ".json":
        return json.loads(text)
    return yaml.safe_load(text)


def dump_json(obj: Any) -> None:
    print(json.dumps(obj, indent=2, sort_keys=True, default=str))


def canonical_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_obj(obj: Any) -> str:
    return "sha256:" + hashlib.sha256(canonical_bytes(obj)).hexdigest()


def validate_with_schema(data: Any, schema_name: str) -> list[str]:
    schema = json.loads((SCHEMAS / schema_name).read_text())
    validator = Draft202012Validator(schema)
    errors = []
    for e in sorted(validator.iter_errors(data), key=lambda x: list(x.path)):
        loc = ".".join(str(x) for x in e.path) or "$"
        errors.append(f"{loc}: {e.message}")
    return errors


def cmd_validate_packet(args):
    data = load_data(args.file)
    schema = "execution-packet.schema.json" if args.kind == "execution" else "run-envelope.schema.json"
    errors = validate_with_schema(data, schema)
    dump_json({"valid": not errors, "errors": errors})
    return 0 if not errors else 2


def cmd_validate_adapter(args):
    data = load_data(args.file)
    errors = validate_with_schema(data, "adapter.schema.json")
    # Semantic checks beyond JSON shape.
    if data.get("verified_state") != "invalid":
        for key in ["version_fingerprint","model_source","effort_mapping","invocation","safe_prompt_passing","quota_probe","agentic_capability"]:
            if not data.get(key):
                errors.append(f"{key}: mandatory semantics missing")
        if data.get("safe_prompt_passing", {}).get("shell") is not False:
            errors.append("safe_prompt_passing.shell: must be false for shipped adapters")
        for k,v in data.get("effort_mapping", {}).items():
            if k not in CANON_EFFORTS:
                errors.append(f"effort_mapping.{k}: non-canonical effort key")
    dump_json({"valid": not errors, "state": data.get("verified_state"), "errors": errors})
    return 0 if not errors else 2


def candidate_id(c):
    return f"{c.get('harness')}@{c.get('harness_version')}/{c.get('model_id')}@{c.get('effort')}"


def _num(v, default=float("inf")):
    return default if v is None else float(v)


def route(request: dict) -> dict:
    role = request["role"]
    playbook = request.get("playbook")
    policy = request.get("policy", {})
    required = set(request.get("required_capabilities", policy.get("required_capabilities", [])))
    reserve = float(policy.get("quota_reserve_percent", 20))
    cost_policy = request.get("cost_policy", policy.get("cost_policy", "balanced"))
    allow_override = bool(request.get("allow_unverified_override", False))
    allow_advisory_undercut = bool(request.get("allow_advisory_undercut", True))
    rejected = []
    stage = []

    # 1 hard exclusions
    for c in request.get("candidates", []):
        cid = candidate_id(c)
        if c.get("hard_excluded") or c.get("local_hard_excluded"):
            rejected.append({"candidate":cid,"stage":1,"reason":"hard exclusion"})
        else:
            stage.append(c)

    # 2 adapter validity/trust
    nxt=[]
    for c in stage:
        cid=candidate_id(c); st=c.get("adapter_state")
        if st == "invalid": rejected.append({"candidate":cid,"stage":2,"reason":"invalid adapter"}); continue
        if role in MUTABLE_TRUST_ROLES and st != "proven" and not allow_override:
            rejected.append({"candidate":cid,"stage":2,"reason":"adapter is not proven for normal mutable/gate authority"}); continue
        nxt.append(c)
    stage=nxt

    # 3 required capabilities
    nxt=[]
    for c in stage:
        cid=candidate_id(c); caps=set(c.get("capabilities", []))
        if not required.issubset(caps): rejected.append({"candidate":cid,"stage":3,"reason":f"missing capabilities {sorted(required-caps)}"}); continue
        nxt.append(c)
    stage=nxt

    # 4 absolute role floor
    nxt=[]
    for c in stage:
        cid=candidate_id(c)
        if not c.get("absolute_floor_pass", False): rejected.append({"candidate":cid,"stage":4,"reason":"absolute role floor failed"}); continue
        nxt.append(c)
    stage=nxt

    # 5 task shape
    nxt=[]
    for c in stage:
        cid=candidate_id(c); supported=c.get("supported_playbooks")
        if supported and playbook and playbook not in supported: rejected.append({"candidate":cid,"stage":5,"reason":"task shape unsupported"}); continue
        nxt.append(c)
    stage=nxt

    if not stage:
        return {"selected":None,"status":"no_qualifying_candidate","rejected":rejected}

    # 6 quota safety. Unknown is not unlimited: it is allowed but ranked as uncertain only when no safe-known alternative.
    safe=[]; unknown=[]; unsafe=[]
    for c in stage:
        q=c.get("quota",{}); status=q.get("status","unknown")
        if status != "ok" or q.get("tightest_remaining_percent") is None:
            unknown.append(c); continue
        remaining=float(q["tightest_remaining_percent"]); burn=float(q.get("projected_burn_percent") or 0)
        (safe if remaining-burn >= reserve else unsafe).append(c)
    if safe:
        for c in unsafe: rejected.append({"candidate":candidate_id(c),"stage":6,"reason":"projected quota crosses reserve while safe alternative exists"})
        # Unknown quota is not silently unlimited; prefer known-safe unless user permits uncertainty.
        if not request.get("allow_unknown_quota_with_safe_alternative", False):
            for c in unknown: rejected.append({"candidate":candidate_id(c),"stage":6,"reason":"quota unknown while known-safe alternative exists"})
            stage=safe
        else:
            stage=safe+unknown
    elif unknown:
        for c in unsafe: rejected.append({"candidate":candidate_id(c),"stage":6,"reason":"known quota crosses reserve; only unknown candidates remain"})
        stage=unknown
    else:
        return {"selected":None,"status":"protected_quota_would_be_consumed","rejected":rejected,
                "action":"choose a smaller/cheaper valid strategy, propose another route, or obtain explicit user authority"}

    # 7 advisory quality anchor
    advisory=[c for c in stage if c.get("advisory_pass", True)]
    if advisory and not allow_advisory_undercut:
        for c in stage:
            if c not in advisory: rejected.append({"candidate":candidate_id(c),"stage":7,"reason":"advisory anchor retained by gear/policy"})
        stage=advisory

    # 8 cost, 9 local tie-break
    def quota_burn(c): return _num(c.get("cost",{}).get("quota_burn"))
    def money(c): return _num(c.get("cost",{}).get("money_estimate"))
    def wall(c): return _num(c.get("cost",{}).get("wall_clock_seconds"))
    def reward(c): return -float(c.get("local_reward",0))

    if cost_policy == "quota_saver":
        stage.sort(key=lambda c:(quota_burn(c), money(c), wall(c), reward(c), candidate_id(c)))
    elif cost_policy == "money_saver":
        stage.sort(key=lambda c:(money(c), quota_burn(c), wall(c), reward(c), candidate_id(c)))
    else:
        known_money=[money(c) for c in stage if math.isfinite(money(c))]
        if known_money:
            cheapest=min(known_money); band=cheapest*1.20
            in_band=[c for c in stage if money(c) <= band]
            if in_band:
                out_band=[c for c in stage if c not in in_band]
                for c in out_band: rejected.append({"candidate":candidate_id(c),"stage":8,"reason":"outside balanced 20% cheapest-money band"})
                stage=in_band
                stage.sort(key=lambda c:(quota_burn(c), wall(c), reward(c), money(c), candidate_id(c)))
            else:
                stage.sort(key=lambda c:(quota_burn(c), wall(c), reward(c), money(c), candidate_id(c)))
        else:
            stage.sort(key=lambda c:(quota_burn(c), wall(c), reward(c), candidate_id(c)))

    chosen=stage[0]
    return {"selected":candidate_id(chosen),"status":"selected","candidate":chosen,"rejected":rejected,
            "decision_hash":sha256_obj({"role":role,"playbook":playbook,"selected":candidate_id(chosen),"policy":policy,"candidate":chosen})}


def cmd_route(args):
    req=load_data(args.request)
    dump_json(route(req)); return 0


def cmd_hash(args):
    dump_json({"hash":sha256_obj(load_data(args.file))}); return 0


def maturity_age(points: float) -> float:
    p=max(0.0,float(points))
    age=100.0*(1.0-math.exp(-p/60.0))
    # Preserve the spec invariant that 100 is asymptotic even when exp() underflows.
    return min(age, math.nextafter(100.0, 0.0))


def cmd_maturity(args):
    dump_json({"points":float(args.points),"clamped_points":max(0,float(args.points)),"age":maturity_age(args.points)}); return 0


PRIVACY_PATTERNS = [
    ("email", re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)),
    ("url", re.compile(r"https?://[^\s)\]}>]+", re.I)),
    ("unix-absolute-path", re.compile(r"(?<![\w.])/(?:Users|home|var|opt|srv|private|Volumes)/[^\s'\"]+")),
    ("windows-absolute-path", re.compile(r"\b[A-Z]:\\(?:[^\s\\]+\\)+[^\s]+", re.I)),
    ("credential-like", re.compile(r"\b(?:token|api[_-]?key|secret|password)\s*[:=]\s*[^\s]{6,}", re.I)),
]

def privacy_findings(text: str, deny_terms=None):
    findings=[]
    for name,rx in PRIVACY_PATTERNS:
        for m in rx.finditer(text): findings.append({"kind":name,"start":m.start(),"sample":m.group(0)[:80]})
    for term in deny_terms or []:
        if term and re.search(re.escape(term), text, re.I): findings.append({"kind":"deny-term","term":term})
    return findings


def cmd_privacy(args):
    text=Path(args.file).read_text(encoding='utf-8')
    deny=[]
    if args.deny_file: deny=[x.strip() for x in Path(args.deny_file).read_text().splitlines() if x.strip()]
    findings=privacy_findings(text,deny)
    dump_json({"valid":not findings,"findings":findings}); return 0 if not findings else 3


def init_db(path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    con=sqlite3.connect(path)
    con.execute('PRAGMA journal_mode=WAL')
    con.executescript("""
    CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY, family_id TEXT, created_at TEXT, plugin_commit TEXT, policy_hash TEXT, catalog_hash TEXT, adapter_hash TEXT, config_hash TEXT, status TEXT);
    CREATE TABLE IF NOT EXISTS dispatches(id TEXT PRIMARY KEY, run_id TEXT, role TEXT, holder_id TEXT, triple TEXT, task_shape TEXT, size_class TEXT, started_at TEXT, ended_at TEXT, money_estimate REAL, money_actual REAL, quota_estimate REAL, quota_delta REAL, wall_clock_seconds REAL, attribution TEXT, outcome TEXT);
    CREATE TABLE IF NOT EXISTS findings(id TEXT PRIMARY KEY, dispatch_id TEXT, reviewer_dispatch_id TEXT, status TEXT, severity TEXT, summary TEXT, evidence_hash TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS validations(id TEXT PRIMARY KEY, dispatch_id TEXT, kind TEXT, command TEXT, passed INTEGER, known_bad_proven INTEGER, evidence_hash TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS routing_decisions(id TEXT PRIMARY KEY, run_id TEXT, role TEXT, request_hash TEXT, selected_triple TEXT, decision_hash TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS artifact_versions(id TEXT PRIMARY KEY, run_id TEXT, kind TEXT, version INTEGER, content_hash TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS ownership_events(id TEXT PRIMARY KEY, run_id TEXT, role TEXT, scope TEXT, prior_holder TEXT, new_holder TEXT, event TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS outcome_labels(id TEXT PRIMARY KEY, dispatch_id TEXT, label TEXT, primary_attribution TEXT, contributing_attributions TEXT, labeled_at TEXT, evidence_hash TEXT);
    CREATE TABLE IF NOT EXISTS lineage(id TEXT PRIMARY KEY, component_kind TEXT, component_id TEXT, parent_id TEXT, event TEXT, multiplier REAL, created_at TEXT);
    """)
    con.commit(); return con


def cmd_init_db(args):
    con=init_db(Path(args.db)); mode=con.execute('PRAGMA journal_mode').fetchone()[0]; con.close(); dump_json({"db":str(Path(args.db)),"journal_mode":mode}); return 0


def cmd_record_dispatch(args):
    data=load_data(args.file)
    if data.get('attribution') and data['attribution'] not in ATTRIBUTIONS: raise SystemExit('invalid attribution')
    if data.get('outcome') and data['outcome'] not in OUTCOMES: raise SystemExit('invalid outcome')
    con=init_db(Path(args.db))
    cols=['id','run_id','role','holder_id','triple','task_shape','size_class','started_at','ended_at','money_estimate','money_actual','quota_estimate','quota_delta','wall_clock_seconds','attribution','outcome']
    row=[data.get(k) for k in cols]; row[0]=row[0] or str(uuid.uuid4())
    con.execute(f"INSERT INTO dispatches({','.join(cols)}) VALUES ({','.join('?'*len(cols))})", row); con.commit(); con.close(); dump_json({'recorded':row[0]}); return 0


def cmd_scaffold_adapter(args):
    template=load_data(ROOT/'adapters/templates/adapter.template.yaml'); template['id']=args.id
    out=Path(args.out); out.parent.mkdir(parents=True, exist_ok=True); out.write_text(yaml.safe_dump(template,sort_keys=False),encoding='utf-8')
    dump_json({'created':str(out),'verified_state':'valid-unverified'}); return 0


def cmd_catalog_snapshot(args):
    data=load_data(args.input)
    if not isinstance(data,dict): raise SystemExit('catalog input must be an object')
    for row in data.get('models',[]):
        effort=row.get('effort')
        if effort not in CANON_EFFORTS: raise SystemExit(f"unknown/unmapped effort is not routable: {effort!r}")
    digest=hashlib.sha256(canonical_bytes(data)).hexdigest()
    outdir=Path(args.out_dir).expanduser(); outdir.mkdir(parents=True,exist_ok=True)
    out=outdir/f'{digest}.yaml'
    if not out.exists(): out.write_text(yaml.safe_dump(data,sort_keys=False),encoding='utf-8')
    dump_json({'snapshot':str(out),'catalog_snapshot_hash':'sha256:'+digest,'immutable_existing':out.exists()}); return 0


def cmd_proposal_id(args):
    obj={'stream':args.stream,'kind':args.kind,'payload':load_data(args.file) if args.file else args.text}
    dump_json({'identity_hash':sha256_obj(obj)}); return 0


def cmd_replay(args):
    dataset=load_data(args.dataset); oldp=load_data(args.old_policy); newp=load_data(args.new_policy)
    rows=dataset.get('rows',dataset if isinstance(dataset,list) else [])
    flips=[]; decisions=[]
    for i,row in enumerate(rows):
        req=dict(row); req['policy']=oldp; old=route(req)
        req2=dict(row); req2['policy']=newp; new=route(req2)
        rec={'row':i,'old':old.get('selected'),'new':new.get('selected'),'old_status':old.get('status'),'new_status':new.get('status')}
        decisions.append(rec)
        if rec['old']!=rec['new'] or rec['old_status']!=rec['new_status']: flips.append(rec)
    dump_json({'rows':len(rows),'flips':flips,'decisions':decisions,'zero_flip_warning':len(rows)>0 and not flips}); return 0


def cmd_new_run(args):
    now=datetime.now(timezone.utc).isoformat()
    obj={'run_id':str(uuid.uuid4()),'family_id':args.family_id,'dispatch_id':str(uuid.uuid4()),'role':'orchestrator','holder_id':args.holder_id,'triple':args.triple,'mode':args.gear,'playbook':args.playbook,'base_sha':args.base_sha,'policy_hash':args.policy_hash,'catalog_snapshot_hash':args.catalog_hash,'adapter_snapshot_hash':args.adapter_hash,'effective_config_hash':args.config_hash,'plan_version':1,'packet_version':1,'created_at':now}
    errors=validate_with_schema(obj,'run-envelope.schema.json')
    if errors: dump_json({'valid':False,'errors':errors}); return 2
    out=Path(args.out); out.parent.mkdir(parents=True,exist_ok=True); out.write_text(json.dumps(obj,indent=2)+'\n')
    dump_json({'created':str(out),'run_id':obj['run_id']}); return 0


def main():
    p=argparse.ArgumentParser(description='Auto Office v3 deterministic runtime helpers')
    sp=p.add_subparsers(dest='cmd',required=True)
    q=sp.add_parser('validate-packet'); q.add_argument('--kind',choices=['execution','envelope'],required=True); q.add_argument('file'); q.set_defaults(func=cmd_validate_packet)
    q=sp.add_parser('validate-adapter'); q.add_argument('file'); q.set_defaults(func=cmd_validate_adapter)
    q=sp.add_parser('route'); q.add_argument('request'); q.set_defaults(func=cmd_route)
    q=sp.add_parser('hash'); q.add_argument('file'); q.set_defaults(func=cmd_hash)
    q=sp.add_parser('maturity'); q.add_argument('--points',type=float,required=True); q.set_defaults(func=cmd_maturity)
    q=sp.add_parser('privacy-lint'); q.add_argument('file'); q.add_argument('--deny-file'); q.set_defaults(func=cmd_privacy)
    q=sp.add_parser('init-db'); q.add_argument('--db',required=True); q.set_defaults(func=cmd_init_db)
    q=sp.add_parser('record-dispatch'); q.add_argument('--db',required=True); q.add_argument('file'); q.set_defaults(func=cmd_record_dispatch)
    q=sp.add_parser('scaffold-adapter'); q.add_argument('id'); q.add_argument('--out',required=True); q.set_defaults(func=cmd_scaffold_adapter)
    q=sp.add_parser('catalog-snapshot'); q.add_argument('--input',required=True); q.add_argument('--out-dir',required=True); q.set_defaults(func=cmd_catalog_snapshot)
    q=sp.add_parser('proposal-id'); q.add_argument('--stream',choices=['learned-pattern','catalog-policy'],required=True); q.add_argument('--kind',required=True); g=q.add_mutually_exclusive_group(required=True); g.add_argument('--file'); g.add_argument('--text'); q.set_defaults(func=cmd_proposal_id)
    q=sp.add_parser('replay'); q.add_argument('--dataset',required=True); q.add_argument('--old-policy',required=True); q.add_argument('--new-policy',required=True); q.set_defaults(func=cmd_replay)
    q=sp.add_parser('new-run'); q.add_argument('--family-id',required=True); q.add_argument('--holder-id',required=True); q.add_argument('--triple',required=True); q.add_argument('--gear',required=True); q.add_argument('--playbook',choices=['Change','Restructure','Investigate','Prototype','Visual'],required=True); q.add_argument('--base-sha',required=True); q.add_argument('--policy-hash',required=True); q.add_argument('--catalog-hash',required=True); q.add_argument('--adapter-hash',required=True); q.add_argument('--config-hash',required=True); q.add_argument('--out',required=True); q.set_defaults(func=cmd_new_run)
    args=p.parse_args(); sys.exit(args.func(args))

if __name__=='__main__': main()
