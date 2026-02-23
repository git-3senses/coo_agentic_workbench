import re
import sys

with open('server/mcp-python/db_dump.sql', 'r', encoding='utf-8') as f:
    content = f.read()

tables = re.findall(r'CREATE TABLE (?:IF NOT EXISTS )?`([^`]+)`', content)
for table in tables:
    print(table)
