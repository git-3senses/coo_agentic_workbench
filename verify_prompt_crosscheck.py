import re
import os
import glob

prompts = glob.glob('Context/Dify_Agent_Prompts/CF_NPA_*_Prompt.md')

field_keys_in_prompts = set()

for prompt in prompts:
    with open(prompt, 'r', encoding='utf-8') as f:
        content = f.read()
        # Find all field keys defined in the markdown tables: | `field_key` | ...
        keys = re.findall(r'\|\s*`([^`]+)`\s*\|', content)
        field_keys_in_prompts.update(keys)

print(f"Total unique fields defined in prompts: {len(field_keys_in_prompts)}")

# Now get the fields from DB
with open('database/npa_workbench_full_export.sql', 'r', encoding='utf-8') as f:
    sql_content = f.read()

match = re.search(r'INSERT INTO `ref_npa_fields` \([^)]+\) VALUES (.*?);', sql_content, re.DOTALL)
db_fields = set()
if match:
    values_str = match.group(1)
    # The first value in each tuple is the field_key, it's typically a string enclosed in quotes
    # e.g., ('business_rationale', 'Business Rationale', ...)
    tuples = re.findall(r'\(([^)]+)\)', values_str)
    for t in tuples:
        # Split by comma handling quotes
        parts = t.split(',')
        if len(parts) > 0:
            key = parts[0].strip().strip("'")
            db_fields.add(key)

print(f"Total unique fields in DB ref_npa_fields: {len(db_fields)}")

# Identify discrepancies
in_prompts_not_db = field_keys_in_prompts - db_fields
in_db_not_prompts = db_fields - field_keys_in_prompts

print(f"Fields in Prompts but NOT in DB: {len(in_prompts_not_db)}")
for f in sorted(in_prompts_not_db):
    print(f"  - {f}")

print(f"Fields in DB but NOT in Prompts: {len(in_db_not_prompts)}")
for f in sorted(in_db_not_prompts):
    print(f"  - {f}")

