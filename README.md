# mcp-idra

**Provided by:** Engineering Ingegneria Informatica S.p.A. (ENG)

## Description

**mcp-idra** is an AI-powered CLI agent for querying and analyzing Smart City data from the IDRA/ORION platform. It exposes a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that queries NGSI-LD entities stored in MongoDB, and drives a conversational agent powered by [Mistral](https://mistral.ai/) (via [Ollama](https://ollama.com/)) capable of reasoning over real city data.

Key features:

* **Conversational Data Analysis** — Interactive CLI chat loop where the agent automatically decides when to query the database based on the user's question.
* **MCP Tool Integration** — `get_orion_entities` tool exposed via FastMCP, callable both in-process and as a standalone MCP server over stdio.
* **NGSI-LD Query Layer** — Queries the ORION MongoDB database filtering by entity type (`DatasetDCAT-AP`, `DistributionDCAT-AP`) and pilot city, with case-insensitive URN matching.
* **Mistral LLM** — Uses `mistral-nemo:latest` (Ministral family) by default, with temperature 0 for deterministic and reliable tool invocation.
* **JSON Autocorrection** — Fallback mechanism that detects and parses JSON tool calls when the model outputs raw JSON instead of invoking the tool natively.
* **Docker Support** — Containerized deployment ready for integration with an existing Docker Compose stack (Ollama + MongoDB).

---

## Architecture

```
CLI User ──► cli_agent.py  (Interactive Chat, port — local process)
                 │
                 │  in-process import
                 ▼
             orion_server.py  (FastMCP Server — also runnable over stdio)
                 │
                 │  MongoDB queries
                 ▼
             MongoDB  ──  database: orion / collection: entities
                          (NGSI-LD entities seeded via init-idra.js)
```

---

## Tech Stack

| Component | Technology |
|---|---|
| Language | Python 3.11 |
| LLM Runtime | Ollama |
| LLM Model | Mistral (`mistral-nemo:latest`) |
| Tool Protocol | Model Context Protocol (MCP) — FastMCP |
| Document DB | MongoDB |
| Container | Docker / Docker Compose |

---

## Installation Prerequisites

* [Docker](https://docs.docker.com/get-docker/)
* [Docker Compose](https://docs.docker.com/compose/install/)
* [Ollama](https://ollama.com/) running and reachable with the Mistral model pulled:

```bash
ollama pull mistral-nemo:latest
```

---

## Installation Instructions

### 1. Clone the repository

```bash
git clone https://github.com/Gerbinix/mcp-idra.git
cd mcp-idra
```

### 2. Configure environment variables

The stack expects the following environment variables. For local development you can export them in your shell or pass them via `docker run -e`.

| Variable | Description | Default |
|---|---|---|
| `OLLAMA_HOST` | Ollama API endpoint | `http://ollama-backend:11434` |
| `MONGO_HOST` | MongoDB hostname | `orion_dev-mongo-1` |
| `MODEL_NAME` | Ollama model to use | `mistral-nemo:latest` |
| `PILOT_CITIES` | Comma-separated list of valid pilot cities | `Aarhus,Athens,Cluj-Napoca,Kajaani,Leuven,Madrid,Parma,Pilsen,Tallinn` |
| `IDRA_TAG` | Keyword that triggers mandatory database lookup | `IDRA` |

> **Note:** Ollama and MongoDB are **not** included in the `Dockerfile` and must be provisioned separately (e.g. via your Docker Compose stack).

### 3. Seed the database (optional — for local testing)

Run the initialization script against your MongoDB instance to generate 90 sample NGSI-LD entities (9 cities × 5 themes × 2 entity types):

```bash
# from mongosh on the host
mongosh --eval "$(cat init-idra.js)"

# or inside a running MongoDB container
docker exec -i <mongo-container> mongosh < init-idra.js
```

### 4. Build and start

```bash
docker build -t mcp-idra .

docker run -it \
  -e OLLAMA_HOST=http://ollama-backend:11434 \
  -e MONGO_HOST=orion_dev-mongo-1 \
  mcp-idra python cli_agent.py
```

The default `CMD` keeps the container alive (`tail -f /dev/null`) so you can also exec into it interactively:

```bash
docker exec -it <container-id> python cli_agent.py
```

For a **local run** without Docker:

```bash
pip install -r requirements.txt

OLLAMA_HOST=http://localhost:11434 \
MONGO_HOST=localhost \
python cli_agent.py
```

---

## CLI Reference

The agent starts an interactive session. Type your question in natural language; the agent will automatically invoke the MCP tool when city data is needed.

```
=== 🏙️ IDRA Data Analyst CLI (Powered by MCP & Ollama) ===
Active Model: mistral-nemo:latest
Active Pilot Cities: Aarhus,Athens,Cluj-Napoca,...
Type 'exit' or 'quit' to close the session.

👤 You: What traffic data is available for Madrid?

[⚙️ Executing MCP Tool: Extracting '*' for 'Madrid' (max 5)...]

🤖 Agent: Madrid has 5 available datasets. The traffic sensor data covers
real-time flow and congestion mapped as GeoJSON points ...
```

### MCP Tool — `get_orion_entities`

Exposed by `orion_server.py` and consumed by the CLI agent. Can also be used by any MCP-compatible client by running `python orion_server.py` (stdio transport).

| Parameter | Type | Required | Description |
|---|---|---|---|
| `entity_type` | string | yes | NGSI-LD entity type. Use `"*"` for all types, `"DatasetDCAT-AP"` for datasets, `"DistributionDCAT-AP"` for distributions |
| `city` | string | no | Pilot city name (case-insensitive). Must be in `PILOT_CITIES` |
| `limit` | integer | no | Maximum number of results to return (default: `5`) |

**Returns:** JSON array of matching NGSI-LD entities, or an error/info string.

### Pilot Cities

| City | Country |
|---|---|
| Aarhus | Denmark |
| Athens | Greece |
| Cluj-Napoca | Romania |
| Kajaani | Finland |
| Leuven | Belgium |
| Madrid | Spain |
| Parma | Italy |
| Pilsen | Czech Republic |
| Tallinn | Estonia |

### Smart City Data Themes

Each pilot city exposes data across five themes:

| Theme | Description |
|---|---|
| Traffic Sensors | Real-time traffic flow and congestion data (GeoJSON points) |
| Air Quality | PM2.5, PM10, CO2 monitoring stations |
| Waste Management | Smart bin fill levels and collection routes (polygons) |
| Public Transport | Bus and tram real-time GPS locations and stops |
| Energy Consumption | Public building and street lighting energy usage |

---

## Project Structure

```
mcp-idra/
├── cli_agent.py       # Interactive CLI chat loop with Ollama + MCP tool calling
├── orion_server.py    # FastMCP server exposing the get_orion_entities tool
├── init-idra.js       # MongoDB seed script (90 sample NGSI-LD entities)
├── Dockerfile         # Container image definition (Python 3.11-slim)
└── requirements.txt   # Python dependencies: mcp, pymongo, ollama
```

---

## External Resources

* [Mistral AI](https://mistral.ai/) — LLM provider (Ministral model family)
* [Ollama](https://ollama.com/) — Local LLM runtime
* [Model Context Protocol](https://modelcontextprotocol.io/) — Tool protocol standard
* [FIWARE ORION Context Broker](https://fiware-orion.readthedocs.io/) — NGSI-LD data source
* [MongoDB](https://docs.mongodb.com/) — Document storage for NGSI-LD entities
