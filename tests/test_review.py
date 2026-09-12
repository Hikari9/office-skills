#!/usr/bin/env python3
import json, os, subprocess, sys, tempfile, unittest, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class TestReview(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp(prefix='office-review-test-')
        self.repo = Path(self.tmpdir)
        subprocess.run(['git', 'init'], cwd=self.repo, capture_output=True)
        subprocess.run(['git', 'commit', '--allow-empty', '-m', 'init'], cwd=self.repo, capture_output=True)
        self.state_dir = self.repo / '.office'
        self.state_dir.mkdir()
        self.db = self.state_dir / 'telemetry.db'
        subprocess.run([sys.executable, str(ROOT / 'scripts' / 'office_runtime.py'), 'init-db', '--db', str(self.db)], capture_output=True)

    def tearDown(self):
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def test_review_finding_persist(self):
        script = ROOT / 'scripts' / 'review_finding.sh'
        r = subprocess.run([
            str(script),
            '--dispatch-id', 'disp-001',
            '--reviewer-dispatch-id', 'rev-001',
            '--status', 'IMPLEMENTATION_DEFECT',
            '--summary', 'Found a bug',
            '--state-dir', str(self.repo),
            '--db', str(self.db)
        ], cwd=self.repo, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0)
        finding_id = r.stdout.strip()
        self.assertTrue(finding_id)
        finding_file = self.repo / '.office' / 'findings' / f'{finding_id}.json'
        self.assertTrue(finding_file.exists())

    def test_review_loop_self_approval_rejected(self):
        loop_script = ROOT / 'scripts' / 'review_loop.sh'
        r = subprocess.run([
            str(loop_script),
            '--state-dir', str(self.state_dir),
            '--dispatch-id', 'same-dispatch',
            '--reviewer-dispatch-id', 'same-dispatch',
            '--worktree', str(self.repo),
            '--db', str(self.db)
        ], cwd=self.repo, capture_output=True, text=True)
        self.assertEqual(r.returncode, 4)
        self.assertIn('Self-approval rejection', r.stdout + r.stderr)

    def test_verify_script(self):
        verify_script = ROOT / 'scripts' / 'verify.sh'
        r = subprocess.run([
            str(verify_script),
            '--worktree', str(self.repo),
            '--dispatch-id', 'disp-001',
            '--state-dir', str(self.state_dir),
            '--db', str(self.db)
        ], cwd=self.repo, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0)
        out = json.loads(r.stdout)
        self.assertIn('passed', out)
        self.assertIn('gates', out)

if __name__ == '__main__':
    unittest.main()
