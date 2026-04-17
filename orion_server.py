import os
import pymongo
import json
import re
from bson import json_util
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("OrionSmartCity")


@mcp.tool()
def get_orion_entities(entity_type: str = "*", city: str = None, limit: int = 5) -> str:
    """
    Extracts entities from the ORION (MongoDB) Smart City database.
    Supports optional filtering by pilot city.
    """
    mongo_host = os.getenv("MONGO_HOST", "orion_dev-mongo-1")

    # Read pilot cities from environment variables
    cities_env = os.getenv("PILOT_CITIES", "")
    valid_cities = [c.strip().lower() for c in cities_env.split(",") if c.strip()]

    try:
        client = pymongo.MongoClient(f"mongodb://{mongo_host}:27017/", serverSelectionTimeoutMS=3000)
        db = client['orion']
        coll = db['entities']

        query = {}
        if entity_type and entity_type != "*":
            query["_id.type"] = entity_type

        if city:
            city_lower = city.lower()
            if valid_cities and city_lower not in valid_cities:
                return f"Error: The city '{city}' is not configured as a pilot city."

            # Regex to search for the city name within the URN ID (case-insensitive)
            query["_id.id"] = {"$regex": re.compile(city_lower, re.IGNORECASE)}

        results = list(coll.find(query).limit(limit))
        client.close()

        if not results:
            city_msg = f" in {city}" if city else ""
            return f"No entities found for type: {entity_type}{city_msg}."

        return json.dumps(results, default=json_util.default)

    except Exception as e:
        return f"MongoDB Connection Error ({mongo_host}): {str(e)}"


if __name__ == "__main__":
    mcp.run(transport='stdio')