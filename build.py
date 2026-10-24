"""Package Slipframe using Python's standard library; no build dependencies."""
from pathlib import Path
import json, zipfile
root = Path(__file__).resolve().parent
extension = root / 'extension'
version = json.loads((extension / 'manifest.json').read_text())['version']
release = root / 'release'
release.mkdir(exist_ok=True)
target = release / f'Slipframe-v{version}-unsigned.zip'
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(extension.rglob('*')):
        if path.is_file():
            archive.write(path, path.relative_to(extension))
print(target)
