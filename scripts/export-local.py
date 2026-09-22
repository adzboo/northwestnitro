# Read-only export from an explicitly selected local D1 SQLite file.
import sqlite3,json,sys,pathlib
source=pathlib.Path(sys.argv[1]).resolve(); target=pathlib.Path(sys.argv[2]).resolve()
if target.exists(): raise SystemExit('Output already exists; choose a new filename.')
db=sqlite3.connect(source.as_uri()+'?mode=ro',uri=True);db.row_factory=sqlite3.Row
names={r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
tables=['series','events','members','entries','settings','audit','result_meetings']
data={t:[dict(r) for r in db.execute('SELECT * FROM "'+t+'"')] if t in names else [] for t in tables}
with target.open('x',encoding='utf-8') as f:json.dump(data,f,ensure_ascii=False)
print('Export saved. Treat it as private club data; do not commit it.')
