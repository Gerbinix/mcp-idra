// init-idra.js
db = db.getSiblingDB('orion'); // Usa o crea il database 'orion'

// Pulisce la collezione se esiste già (utile per i riavvii)
db.entities.drop();
db.createCollection('entities');

const pilotCities = ["Aarhus", "Athens", "Cluj-Napoca", "Kajaani", "Leuven", "Madrid", "Parma", "Pilsen", "Tallinn"];

// 5 Tematiche Smart City per simulare i documenti in arrivo dal GeoDataExtractor
const smartCityThemes = [
    { title: "Traffic Sensors", desc: "Real-time traffic flow and congestion data mapped as GeoJSON points." },
    { title: "Air Quality", desc: "PM2.5, PM10, and CO2 monitoring stations geospatial data." },
    { title: "Waste Management", desc: "Smart bin fill levels and collection routes polygons." },
    { title: "Public Transport", desc: "Bus and tram real-time GPS locations and stops." },
    { title: "Energy Consumption", desc: "Public building and street lighting energy usage areas." }
];

let docsToInsert = [];

pilotCities.forEach(city => {
    let cityName = city.toLowerCase();

    for (let i = 0; i < 5; i++) {
        let theme = smartCityThemes[i];

        // Simuliamo l'ID generato dal documento originale (postDocument.getId())
        let docId = `doc-${cityName}-00${i+1}`;

        // Costruzione degli URN NGSI-LD rispettando la logica del tuo IDRAService.java
        let distribId = `urn:ngsi-ld:DistributionDCAT-AP:${docId}`;
        let datasetId = `urn:ngsi-ld:DatasetDCAT-AP:${cityName}:${docId}`;

        // 1. Creazione della Distribution (Mappa esatta di DistributionDTO.java)
        docsToInsert.push({
            "_id": { "id": distribId, "type": "DistributionDCAT-AP" },
            "title": `${city} - ${theme.title} (Distribution)`,
            "description": theme.desc,
            "downloadURL": `https://server.urbreath.tech/api/document/getGeojson/${docId}`,
            "format": "geojson" // Hardcodato come nel costruttore Java
        });

        // 2. Creazione del Dataset (Mappa esatta di DatasetDTO.java)
        docsToInsert.push({
            "_id": { "id": datasetId, "type": "DatasetDCAT-AP" },
            "title": `${city} - ${theme.title} (Dataset)`,
            "description": theme.desc,
            "datasetDescription": [theme.desc], // Mappato come List<String> in Java
            "datasetDistribution": [distribId]  // Mappato come List<String> in Java
        });
    }
});

// Inserimento massivo nel database
db.entities.insertMany(docsToInsert);
print(`✅ IDRA Sandbox Initialization complete! Generated ${docsToInsert.length} entities for 9 pilot cities.`);