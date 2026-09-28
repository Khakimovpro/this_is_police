"""Build a static GitHub/CDN distribution from the locally validated source."""
from pathlib import Path
import shutil, subprocess
root=Path(__file__).resolve().parents[1]
subprocess.run(['npm','run','build'],cwd=root,check=True)
destination=root/'play'
# Copy only this build's files; hashes make stale assets harmless on repeat builds.
shutil.copytree(root/'dist',destination,dirs_exist_ok=True)
(destination/'.nojekyll').write_text('')
print('Static release:',destination)
