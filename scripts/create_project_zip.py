import os
import zipfile
import sys
import time

SOURCE_DIR = r"e:\convex-template5-main\convex-template5-main"
OUTPUT_ZIP = r"e:\IndiaPay_Project.zip"

EXCLUDE_DIRS = {
    "node_modules",
    ".next",
    ".turbo",
    ".git",
    "dist",
    "build",
    "coverage",
    "storybook-static",
    "bun-cache-test",
    "temp-bun-test",
    "temp-bun-test2",
}

EXCLUDE_EXTENSIONS = {
    ".exe",
    ".log",
    ".tsbuildinfo",
}

EXCLUDE_FILES = {
    "cloudflared.exe",
    "IndiaPay_Project.zip",
    "reports_dom.html",
    "temp_login.html",
}

def create_zip():
    print(f"[START] Starting packaging of IndiaPay project...")
    print(f"Source Directory: {SOURCE_DIR}")
    print(f"Target Zip File:  {OUTPUT_ZIP}")
    start_time = time.time()

    file_count = 0
    total_bytes = 0

    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zipf:
        # Also include root documentation files if present
        root_dir = r"e:\convex-template5-main"
        for extra_doc in ["FULL_DAY_REPORT.txt", "FINAL_VERIFICATION_REPORT.md", "README_RUN_INSTRUCTIONS.md"]:
            extra_path = os.path.join(root_dir, extra_doc)
            if os.path.isfile(extra_path):
                arcname = os.path.join("IndiaPay", extra_doc)
                zipf.write(extra_path, arcname)
                file_count += 1
                total_bytes += os.path.getsize(extra_path)
                print(f"  + Added root doc: {extra_doc}")

        for root, dirs, files in os.walk(SOURCE_DIR):
            # Prune excluded directories in-place
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]

            for file in files:
                if file in EXCLUDE_FILES:
                    continue
                ext = os.path.splitext(file)[1].lower()
                if ext in EXCLUDE_EXTENSIONS:
                    continue

                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, SOURCE_DIR)
                arcname = os.path.join("IndiaPay", rel_path)

                zipf.write(abs_path, arcname)
                file_count += 1
                total_bytes += os.path.getsize(abs_path)

    elapsed = time.time() - start_time
    zip_size_mb = os.path.getsize(OUTPUT_ZIP) / (1024 * 1024)
    orig_size_mb = total_bytes / (1024 * 1024)

    print(f"\n[SUCCESS] Zip archive created successfully!")
    print(f"Total Files Packaged: {file_count}")
    print(f"Uncompressed Size:    {orig_size_mb:.2f} MB")
    print(f"Compressed Zip Size:  {zip_size_mb:.2f} MB")
    print(f"Time Elapsed:        {elapsed:.2f} seconds")
    print(f"Zip File Location:    {OUTPUT_ZIP}")

    # Copy to workspace root for easy download/sharing
    mirror_zip = r"e:\convex-template5-main\IndiaPay_Project.zip"
    import shutil
    shutil.copyfile(OUTPUT_ZIP, mirror_zip)
    print(f"Mirror Copy:          {mirror_zip}")

if __name__ == "__main__":
    create_zip()
