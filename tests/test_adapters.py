#!/usr/bin/env python3
"""Adapter conformance tests."""
import json, yaml, unittest
from pathlib import Path
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]

class TestAdapterConformance(unittest.TestCase):
    def _load_schema(self):
        schema_path = ROOT/'schemas/adapter.schema.json'
        if not schema_path.exists():
            return None
        return json.loads((ROOT/'schemas/adapter.schema.json').read_text())
    
    def test_all_adapters_valid_schema(self):
        schema = self._load_schema()
        if not schema: return
        validator = Draft202012Validator(schema)
        for p in (ROOT/'adapters/seed').glob('*.yaml'):
            data = yaml.safe_load(p.read_text())
            errors = list(validator.iter_errors(data))
            self.assertEqual(errors, [], f'{p.name}: {errors}')
    
    def test_adapters_have_required_semantics(self):
        for p in (ROOT/'adapters/seed').glob('*.yaml'):
            data = yaml.safe_load(p.read_text())
            self.assertIn('id', data)
            self.assertIn('verified_state', data)
            self.assertIn('invocation', data)
            self.assertIn('safe_prompt_passing', data)
            inv = data.get('invocation', {})
            self.assertTrue('executable' in inv or 'binary' in inv, f'{p.name}: invocation missing executable')
            self.assertFalse(data['safe_prompt_passing'].get('shell', True),
                           f'{p.name}: shell must be false')
    
    def test_hermes_adapter_exists(self):
        hermes = ROOT / 'adapters/seed/hermes.yaml'
        self.assertTrue(hermes.exists(), 'Hermes adapter missing')
        data = yaml.safe_load(hermes.read_text())
        self.assertEqual(data['id'], 'hermes')
    
    def test_adapter_ids_unique(self):
        ids = []
        for p in (ROOT/'adapters/seed').glob('*.yaml'):
            data = yaml.safe_load(p.read_text())
            ids.append(data['id'])
        self.assertEqual(len(ids), len(set(ids)), 'Duplicate adapter IDs')
    
    def test_effort_mappings_canonical(self):
        canon = {'none', 'low', 'medium', 'high', 'xhigh', 'max'}
        for p in (ROOT/'adapters/seed').glob('*.yaml'):
            data = yaml.safe_load(p.read_text())
            for k in data.get('effort_mapping', {}):
                self.assertIn(k, canon, f'{p.name}: non-canonical effort {k}')
    
    def test_canonical_harness_set(self):
        adapters = {p.stem for p in (ROOT/'adapters/seed').glob('*.yaml')}
        required = {'codex', 'claude', 'agy', 'hermes'}
        self.assertTrue(required.issubset(adapters),
                       f'Missing adapters: {required - adapters}')

if __name__ == '__main__':
    unittest.main()
