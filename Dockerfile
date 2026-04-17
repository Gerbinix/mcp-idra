FROM python:3.11-slim

WORKDIR /app

# Copia e installa le dipendenze prima per sfruttare la cache di Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia gli script del progetto
COPY orion_server.py cli_agent.py ./

# Il container rimane "dormiente" finché non entri con 'docker exec'
CMD ["tail", "-f", "/dev/null"]