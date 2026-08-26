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


## Aviso

O TerraAlerta é informativo e não substitui comunicados emitidos pelas autoridades locais de defesa civil e emergência.
