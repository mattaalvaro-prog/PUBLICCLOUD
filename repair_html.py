import re
import os

file_path = r'c:\Portal OPE\app.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Tags to fix
tags = ['div', 'tr', 'td', 'th', 'table', 'h4', 'h3', 'h2', 'h1', 'span', 'i', 'button', 'select', 'input', 'label', 'option', 'textarea', 'p', 'ul', 'li', 'section', 'aside', 'main', 'header', 'footer', 'a']
tags_regex = '|'.join(tags)

# Fix < tag (opening)
content = re.sub(rf'<\s*({tags_regex})(?=\s|>)', r'<\1', content, flags=re.IGNORECASE)

# Fix </ tag (closing)
content = re.sub(rf'</\s*({tags_regex})\s*>', r'</\1>', content, flags=re.IGNORECASE)

# Fix < / tag (closing variations)
content = re.sub(rf'<\s*/\s*({tags_regex})\s*>', r'</\1>', content, flags=re.IGNORECASE)

# Fix loose spaces before > in tags already somewhat fixed or others
# This is riskier so we only do it if it looks like a tag ending
content = re.sub(rf'(<({tags_regex})[^>]*)\s+>', r'\1>', content, flags=re.IGNORECASE)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("HTML Tags cleaned up in app.js")
