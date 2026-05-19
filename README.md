# Muretti Estimate (Next.js)

SCENIKA 10/2023 pricing from measurement templates.

## Run locally

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

### `POST /api/estimate`

- **multipart:** field `file` (.json or .csv) plus optional `project_name`, `measurement_unit`, `system`, `finish`, etc.
- **JSON body:** full estimate request object.

### `GET /api/template?format=json|csv`

Download sample input files.

## Sample files

- `public/samples/muretti-estimate.sample.json` — exact PDF row (2187×640 panel = 143 EUR)
- Use **Download sample JSON** on the home page

## Test with curl

```bash
curl -s -X POST http://localhost:3000/api/estimate \
  -H "Content-Type: application/json" \
  -d @public/samples/muretti-estimate.sample.json | head -c 2000
```

Expected total (melamine): 2×84 + 143 + 4×77 + 152 = **771 EUR** net.
# estimates_muretti
