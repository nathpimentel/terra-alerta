# TerraAlerta

Aplicação fullstack de monitoramento ambiental que reúne, em um mapa mundial interativo, eventos naturais e sismos publicados por fontes oficiais.

## Funcionalidades

- Mapa mundial interativo com marcadores por categoria
- Incêndios florestais, tempestades severas e vulcões da NASA EONET
- Terremotos do USGS com magnitude e severidade
- Filtro por categoria de evento
- Busca por evento ou região
- Painel lateral com a lista de ocorrências
- Detalhe do evento com local, horário, severidade e link para a fonte oficial
- Atualização manual dos dados
- Dados de demonstração quando as fontes externas estão indisponíveis
- Interface responsiva em tema escuro
- API documentada com Swagger

## Tecnologias

- C#
- ASP.NET Core
- Swagger
- Cache em memória
- React
- TypeScript
- Vite
- Tailwind CSS
- MapLibre GL
- Axios

## Estrutura

```text
terra-alerta/
├── backend/
│   ├── Controllers/
│   ├── Dtos/
│   ├── Models/
│   ├── Services/
│   └── Program.cs
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── data/
│       ├── pages/
│       ├── services/
│       └── types/
└── terra-alerta.sln
```

## Fontes de dados

O backend consulta as APIs públicas e normaliza as respostas em um único formato de evento geográfico:

- [NASA EONET](https://eonet.gsfc.nasa.gov/) — incêndios florestais, tempestades severas e vulcões
- [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/) — terremotos

## Executando o backend

Requer o SDK do .NET 9.

```bash
dotnet run --project backend/backend.csproj
```

A API fica disponível em `http://localhost:5021` e o Swagger em `http://localhost:5021/swagger`.

## Executando o frontend

Requer Node.js 20 ou superior.

```bash
cd frontend
npm install
npm run dev
```

O frontend fica disponível em `http://localhost:3000` e o Vite encaminha as chamadas de `/api` para a API em `http://localhost:5021`.

Para apontar para outra URL de API, copie `frontend/.env.example` para `frontend/.env.local` e ajuste `VITE_API_URL`. Sem a API no ar, o frontend consulta a NASA EONET e o USGS diretamente.

## Endpoints

- `GET /api/health` — verifica a disponibilidade da API
- `GET /api/events` — retorna os eventos normalizados
- `GET /api/events?category=earthquake` — filtra por categoria (`earthquake`, `wildfire`, `storm`, `volcano`)

## Aviso

O TerraAlerta é informativo e não substitui comunicados emitidos pelas autoridades locais de defesa civil e emergência.
