"""Read-only XLSX/CSV extraction for explicitly labelled GSC exports; stdlib only."""
import argparse
import csv
import io
import hashlib
import json
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

def extract(file, fallback_status=None):
    if file.suffix.lower() == '.csv':
        text = file.read_text(encoding='utf-8-sig')
        try:
            dialect = csv.Sniffer().sniff(text[:8192], delimiters=',;\t')
        except csv.Error:
            dialect = csv.excel
        reader = csv.DictReader(io.StringIO(text), dialect=dialect)
        fields = {name.strip().lower(): name for name in (reader.fieldnames or [])}
        url_key = next((fields[key] for key in ('url', 'page', 'seite') if key in fields), None)
        status_key = next((fields[key] for key in ('googlestatus', 'status', 'indexing status', 'indexierungsstatus') if key in fields), None)
        crawl_key = next((fields[key] for key in ('last crawled', 'zuletzt gecrawlt', 'lastcrawledraw') if key in fields), None)
        if not url_key:
            raise ValueError(f'No URL column in {file}')
        rows = []
        for row in reader:
            if not row.get(url_key, '').strip():
                continue
            status = row.get(status_key, '').strip() if status_key else fallback_status
            if not status:
                raise ValueError(f'CSV has no Google status: provide --status for this single-status export: {file}')
            rows.append({'url': row[url_key].strip(), 'googleStatus': status, 'lastCrawledRaw': row.get(crawl_key, '') if crawl_key else '', 'source': file.name})
        if not rows:
            raise ValueError(f'No URLs in {file}')
        return {'file': file.name, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest(), 'googleStatus': fallback_status or 'row-specific', 'count': len(rows), 'rows': rows}
    ns = {'m':  'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    with zipfile.ZipFile(file) as archive:
        strings = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            strings = [''.join(node.itertext()) for node in ET.fromstring(archive.read('xl/sharedStrings.xml')).findall('m:si', ns)]
        tables = []
        for name in archive.namelist():
            if not name.startswith('xl/worksheets/sheet') or not name.endswith('.xml'):
                continue
            rows = []
            for row in ET.fromstring(archive.read(name)).findall('.//m:row', ns):
                values = {}
                for cell in row.findall('m:c', ns):
                    value = cell.find('m:v', ns)
                    inline = cell.find('m:is', ns)
                    value = value.text if value is not None else ''.join(inline.itertext()) if inline is not None else ''
                    values[''.join(c for c in cell.get('r', '') if c.isalpha())] = strings[int(value)] if cell.get('t') == 's' else value
                rows.append(values)
            tables.append(rows)
        status = next((row.get('B', '') for rows in tables for row in rows if row.get('A') == 'Problem'), fallback_status or '')
        if not status:
            raise ValueError(f'No Google status in {file}')
        urls = [row for rows in tables if rows and rows[0].get('A') == 'URL' for row in rows[1:] if row.get('A')]
        if not urls:
            raise ValueError(f'No URLs in {file}')
        return {'file': file.name, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest(), 'googleStatus': status,
                'count': len(urls), 'rows': [{'url': row['A'], 'googleStatus': status, 'lastCrawledRaw': row.get('B', ''), 'source': file.name} for row in urls]}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--status', help='Explicit Google status for CSV/XLSX without a status column/Problem field; never inferred from HTTP or sitemap')
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('files', nargs='+', type=Path)
    args = parser.parse_args()
    exports = [extract(file, args.status) for file in args.files]
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps({'exports': exports}, ensure_ascii=False, indent=2), encoding='utf-8')
    print(', '.join(f'{item["file"]}: {item["count"]}' for item in exports))
