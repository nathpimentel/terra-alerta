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
- Interface em português e inglês
- Tema claro e escuro, com a preferência do sistema como padrão
- Interface responsiva
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
│       ├── i18n/
│       ├── pages/
│       ├── services/
│       ├── theme/
│       └── types/
└── terra-alerta.sln
```

## Fontes de dados

O backend consulta as APIs públicas abaixo e normaliza as respostas em um único formato de evento geográfico. Nenhuma delas exige chave de acesso.

- **[NASA EONET v3](https://eonet.gsfc.nasa.gov/)** — *Earth Observatory Natural Event Tracker*. Incêndios florestais, tempestades severas e vulcões, em `eonet.gsfc.nasa.gov/api/v3/events`. A consulta é feita **uma por categoria** (`&category=...&limit=30`): a EONET ordena por data e incêndios são mais de 99% dos eventos abertos, então uma consulta única nunca devolvia vulcões.
- **[USGS Earthquake Hazards Program](https://earthquake.usgs.gov/)** — terremotos de magnitude 4,5+ na última semana, em `earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson`

Os endereços ficam em `backend/appsettings.json`. O frontend repete as mesmas chamadas em `frontend/src/services/externalSources.ts` para continuar funcionando quando a API está fora do ar.

## Serviços externos

A interface também depende de dois serviços que não são fontes de eventos:

- **[Carto Basemaps](https://carto.com/basemaps/)** — tiles do mapa nos estilos `dark-matter` e `positron`, um para cada tema, renderizados pelo MapLibre GL sobre dados do [OpenStreetMap](https://www.openstreetmap.org/)
- **[Google Fonts](https://fonts.google.com/specimen/Manrope)** — a fonte Manrope

Sem acesso a eles o app continua abrindo: os eventos caem para os dados de demonstração, mas o mapa fica sem o fundo.


## Aviso

O TerraAlerta é informativo e não substitui comunicados emitidos pelas autoridades locais de defesa civil e emergência.
