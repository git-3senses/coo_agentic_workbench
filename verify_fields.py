import re
import sys

with open('database/npa_workbench_full_export.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the INSERT INTO `ref_npa_fields` statement
match = re.search(r'INSERT INTO `ref_npa_fields` \([^)]+\) VALUES (.*?);', content, re.DOTALL)
if match:
    values_str = match.group(1)
    # Count the number of tuples (...)
    records = re.findall(r'\([^)]+\)', values_str)
    print(f"Total fields in database: {len(records)}")
else:
    print("ref_npa_fields inserts not found")
