import os

def count_lines_and_map(directory):
    file_stats = []
    base_dir = r'c:\Users\srs14\Desktop\AI_Pocket_Buddy'
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in ['node_modules', '__pycache__', '.git', 'dist', 'build', 'assets']]
        for file in files:
            if not file.endswith(('.js', '.jsx', '.py', '.css', '.html')):
                continue
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    lines = sum(1 for _ in f)
                rel_path = os.path.relpath(filepath, base_dir)
                file_stats.append({'path': rel_path.replace(chr(92), '/'), 'lines': lines})
            except Exception:
                pass
    return file_stats

files = count_lines_and_map(r'c:\Users\srs14\Desktop\AI_Pocket_Buddy\backend\app') + count_lines_and_map(r'c:\Users\srs14\Desktop\AI_Pocket_Buddy\frontend\src')
files.sort(key=lambda x: x['lines'], reverse=True)
for f in files:
    print(f"{f['lines']}|{f['path']}")
