#!/usr/bin/env python3
import json, os, subprocess, sys, tempfile, unittest, shutil
from pathlib import Path
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]

class TestHooks(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp(prefix='office-hooks-test-')
        self.repo = Path(self.tmpdir)
        subprocess.run(['git', 'init'], cwd=self.repo, capture_output=True)
        subprocess.run(['git', 'commit', '--allow-empty', '-m', 'init'], cwd=self.repo, capture_output=True)
        self.state_dir = self.repo / '.office'
        self.state_dir.mkdir()

    def tearDown(self):
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def test_install_and_uninstall_hooks(self):
        install_script = ROOT / 'scripts' / 'hooks' / 'install_hooks.sh'
        env = {**os.environ, 'OFFICE_STATE_DIR': str(self.state_dir)}
        
        # Test install
        r = subprocess.run([str(install_script)], cwd=self.repo, env=env, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0)
        
        manifest_path = self.state_dir / 'hook-manifest.json'
        self.assertTrue(manifest_path.exists())
        
        # Validate manifest against schema
        schema_path = ROOT / 'schemas' / 'hook-manifest.schema.json'
        schema = json.loads(schema_path.read_text())
        manifest_data = json.loads(manifest_path.read_text())
        validator = Draft202012Validator(schema)
        errors = list(validator.iter_errors(manifest_data))
        self.assertEqual(errors, [])
        
        # Test uninstall
        r = subprocess.run([str(install_script), '--uninstall'], cwd=self.repo, env=env, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0)
        self.assertFalse(manifest_path.exists())

    def test_pre_compact_and_advisor(self):
        # Create minimal state.json
        state_file = self.state_dir / 'state.json'
        state_file.write_text(json.dumps({
            'run_id': 'run-123',
            'family_id': 'fam-456',
            'phase': 'executing',
            'plan_version': 1,
            'packet_version': 1
        }))
        
        pre_compact = ROOT / 'scripts' / 'hooks' / 'pre_compact.sh'
        env = {**os.environ, 'OFFICE_STATE_DIR': str(self.state_dir)}
        r = subprocess.run([str(pre_compact)], cwd=self.repo, env=env, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0)
        
        compact_dir = self.state_dir / 'compact'
        self.assertTrue(compact_dir.exists())
        snapshots = list(compact_dir.glob('snapshot-*.json'))
        self.assertGreaterEqual(len(snapshots), 1)

        compact_advisor = ROOT / 'scripts' / 'hooks' / 'compact_advisor.sh'
        r = subprocess.run([str(compact_advisor)], cwd=self.repo, env=env, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0)
        catch_up = self.state_dir / 'catch-up.md'
        self.assertTrue(catch_up.exists())
        content = catch_up.read_text()
        self.assertIn('run-123', content)

    def test_close_panes_idempotent(self):
        close_panes = ROOT / 'scripts' / 'hooks' / 'close_panes.sh'
        env = {**os.environ, 'OFFICE_STATE_DIR': str(self.state_dir)}
        r = subprocess.run([str(close_panes)], cwd=self.repo, env=env, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0)

if __name__ == '__main__':
    unittest.main()
