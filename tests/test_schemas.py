#!/usr/bin/env python3
import json, unittest
from pathlib import Path
from jsonschema import Draft202012Validator
import yaml

ROOT = Path(__file__).resolve().parents[1]

class TestSchemas(unittest.TestCase):
    def test_schemas_valid(self):
        for p in (ROOT/'schemas').glob('*.json'):
            schema = json.loads(p.read_text())
            Draft202012Validator.check_schema(schema)
    
    def test_adapters_match_schema(self):
        schema_path = ROOT/'schemas/adapter.schema.json'
        if not schema_path.exists():
            return
        schema = json.loads(schema_path.read_text())
        validator = Draft202012Validator(schema)
        for p in (ROOT/'adapters/seed').glob('*.yaml'):
            data = yaml.safe_load(p.read_text())
            errors = list(validator.iter_errors(data))
            self.assertEqual(errors, [], f'{p.name}: {errors}')

if __name__ == '__main__':
    unittest.main()
