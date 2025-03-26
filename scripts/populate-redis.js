const Redis = require('ioredis');
const crypto = require('crypto');

// Configuration Redis
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// Données des entreprises
const companies = [
  { label: "Entreprise 1", siren: "835256447" },
  { label: "Entreprise 2", siren: "380129866" }
];

// Hash spécifique que l'application recherche
const specificHash = "26b5a3a462fc39165d50b036156402651b9cdef6cec367718341fd168f72da41";

// Fonction pour générer le hash
function hashCompanies(companies) {
  // Trier pour assurer un hachage cohérent indépendamment de l'ordre du tableau
  const sortedCompanies = [...companies].sort((a, b) => a.siren.localeCompare(b.siren));
  const companiesString = JSON.stringify(sortedCompanies);

  // Créer un hash SHA-256
  return crypto.createHash("sha256").update(companiesString).digest("hex");
}

// Fonction pour stocker les données dans Redis
async function storeCompaniesInRedis(hash, companies) {
  const companiesString = JSON.stringify(companies);
  // TTL de 48 heures (en secondes)
  const maxTtl = 60 * 60 * 48;
  
  await redisClient.set(`companies:${hash}`, companiesString, "EX", maxTtl);
  console.log(`Companies data stored in Redis with hash: ${hash}`);
}

// Vérifier si Redis est vide
async function isRedisEmpty() {
  const keys = await redisClient.keys('companies:*');
  return keys.length === 0;
}

// Afficher toutes les clés Redis et leur contenu
async function showAllRedisKeys() {
  const keys = await redisClient.keys('*');
  console.log('All Redis keys:', keys);
  
  for (const key of keys) {
    const value = await redisClient.get(key);
    console.log(`Key: ${key}, Value: ${value}`);
  }
}

// Exécution principale
async function main() {
  try {
    // Afficher toutes les clés Redis et leur contenu
    await showAllRedisKeys();
    
    // Stocker les données avec le hash spécifique que l'application recherche
    console.log('Storing data with specific hash...');
    await storeCompaniesInRedis(specificHash, companies);
    console.log('Data stored with specific hash:', specificHash);
    
    // Vérifier que les données ont été correctement stockées
    const storedData = await redisClient.get(`companies:${specificHash}`);
    console.log('Stored data:', storedData);
    
    // Afficher toutes les clés Redis et leur contenu après population
    await showAllRedisKeys();
    
    // Fermer la connexion Redis
    await redisClient.quit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
