# ZUP - Frontend

Frontend da plataforma ZUP (Zeladoria Urbana Participativa) para registro,
consulta e gestao de ocorrencias urbanas em Videira/SC.

## Requisitos

- Node.js 18+
- Backend da API rodando em `http://localhost:3000/api`

## Como rodar

```powershell
npm install
npm.cmd run dev
```

Abra `http://localhost:8080`.

## Variaveis de ambiente

Crie seu arquivo local a partir do exemplo:

```powershell
Copy-Item .env.example .env
```

Depois ajuste os valores conforme o backend e a URL publica:

```env
VITE_API_BASE_URL="http://localhost:3000/api"
VITE_PUBLIC_SITE_URL="http://localhost:8080"
```

## Scripts

```powershell
npm.cmd run build
npm.cmd test
```

