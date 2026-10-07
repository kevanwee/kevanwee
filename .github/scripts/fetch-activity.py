"""Collect event metadata using existing read-only credentials; never print private events."""
import json
import os
from pathlib import Path
import subprocess
import sys


def api(endpoint, token=None):
    env = dict(os.environ)
    if token:
        env['GH_TOKEN'] = token
    result = subprocess.run(['gh', 'api', endpoint], env=env, capture_output=True, text=True)
    if result.returncode:
        # Do not publish a partial feed or expose raw response bodies/credentials in logs.
        raise RuntimeError('GitHub activity collection failed; retaining the published feed')
    return json.loads(result.stdout)


def collect():
    events = api('users/kevanwee/events/public?per_page=100')
    token = os.environ.get('LOG_TOKEN')
    count = 0
    if token:
        page = 1
        while True:
            repos = api(f'user/repos?per_page=100&page={page}', token)
            for repo in repos:
                if repo.get('private') and repo.get('owner', {}).get('login') == 'kevanwee':
                    events.extend(api(f"repos/{repo['full_name']}/events?per_page=100", token))
                    count += 1
            if len(repos) < 100:
                break
            page += 1
    unique = {event['id']: event for event in events}
    print(f'Collected {len(unique)} events; private repositories read: {count}')
    return sorted(unique.values(), key=lambda event: event['created_at'], reverse=True)


if __name__ == '__main__':
    Path(sys.argv[1]).write_text(json.dumps(collect()), encoding='utf-8')
