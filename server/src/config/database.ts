import neo4j, { Driver, Session } from 'neo4j-driver';

let driver: Driver | null = null;

export const initNeo4j = async (): Promise<Driver> => {
  if (driver) return driver;

  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'neo4j';

  driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

  // Verify connectivity
  await driver.verifyConnectivity();
  console.log('✓ Neo4j connected');

  // Create indexes
  await createIndexes();

  return driver;
};

export const getNeo4jSession = (): Session => {
  if (!driver) {
    throw new Error('Neo4j driver not initialized');
  }
  return driver.session();
};

export const closeNeo4j = async (): Promise<void> => {
  if (driver) {
    await driver.close();
    driver = null;
  }
};

// Create indexes and constraints
const createIndexes = async () => {
  const session = getNeo4jSession();
  try {
    // User constraints
    await session.run('CREATE CONSTRAINT user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE');
    
    // Location index
    await session.run('CREATE INDEX location_coords IF NOT EXISTS FOR (l:Location) ON (l.latitude, l.longitude)');
    
    // Traffic data index
    await session.run('CREATE INDEX traffic_timestamp IF NOT EXISTS FOR (t:TrafficData) ON (t.timestamp)');
    
    // Prediction index
    await session.run('CREATE INDEX prediction_time IF NOT EXISTS FOR (p:Prediction) ON (p.predictionTime)');
    
    console.log('✓ Neo4j indexes created');
  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    await session.close();
  }
};

export { driver };
