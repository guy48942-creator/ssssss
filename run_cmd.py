import subprocess
import sys

cmd = sys.argv[1:]
res = subprocess.run(cmd, capture_output=True, text=True)
print(f"STDOUT:\n{res.stdout}")
print(f"STDERR:\n{res.stderr}")
print(f"RETURNCODE: {res.returncode}")
