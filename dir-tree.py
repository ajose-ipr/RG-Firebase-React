import os

# Folders to ignore while printing the tree
IGNORE_DIRS = {
    'node_modules', '.git', 'build', 'dist', '.next',
    '.vscode', '__pycache__', 'coverage', '.DS_Store'
}

def print_tree(root_dir, prefix=''):
    entries = [e for e in os.listdir(root_dir) if e not in IGNORE_DIRS]
    entries.sort()
    for index, entry in enumerate(entries):
        path = os.path.join(root_dir, entry)
        connector = '└── ' if index == len(entries) - 1 else '├── '
        print(prefix + connector + entry)
        if os.path.isdir(path):
            new_prefix = prefix + ('    ' if index == len(entries) - 1 else '│   ')
            print_tree(path, new_prefix)

if __name__ == "__main__":
    import sys
    root_path = sys.argv[1] if len(sys.argv) > 1 else '.'
    print(f"📁 Project Structure of: {os.path.abspath(root_path)}\n")
    print_tree(root_path)
