# Make backend a Python package 

import importlib, sys

# Expose "backend.utils" as a top-level package named "utils" for backward compatibility.
# This allows modules to use `import utils.xxx` regardless of whether they are executed
# as part of the `backend` package or from project root.
if 'utils' not in sys.modules:
    sys.modules['utils'] = importlib.import_module(__name__ + '.utils')

if 'algorithms' not in sys.modules:
    sys.modules['algorithms'] = importlib.import_module(__name__ + '.algorithms') 