import shutil
import os

src = r'C:\Users\adelamatta\.gemini\antigravity\brain\cdcfee27-de6c-479e-9725-c5abd6f7fd0f\avatar_placeholder_png_1774695672786.png'
dst_dir = r'c:\Portal OPE\assets'
dst = os.path.join(dst_dir, 'avatar.png')

if not os.path.exists(dst_dir):
    os.makedirs(dst_dir)

shutil.copy2(src, dst)
print(f"Copied {src} to {dst}")
