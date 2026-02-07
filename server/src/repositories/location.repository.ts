import { getNeo4jSession } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface LocationNode {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class LocationRepository {
  async create(data: { name: string; latitude: number; longitude: number; city?: string; state?: string }): Promise<LocationNode> {
    const session = getNeo4jSession();
    try {
      const id = uuidv4();
      const now = new Date();

      const result = await session.run(
        `CREATE (l:Location {
          id: $id,
          name: $name,
          latitude: $latitude,
          longitude: $longitude,
          city: $city,
          state: $state,
          isActive: true,
          createdAt: datetime($now),
          updatedAt: datetime($now)
        })
        RETURN l`,
        { id, ...data, now: now.toISOString() }
      );

      return this.nodeToLocation(result.records[0].get('l'));
    } finally {
      await session.close();
    }
  }

  async findAll(): Promise<LocationNode[]> {
    const session = getNeo4jSession();
    try {
      const result = await session.run('MATCH (l:Location {isActive: true}) RETURN l');
      return result.records.map(record => this.nodeToLocation(record.get('l')));
    } finally {
      await session.close();
    }
  }

  async findById(id: string): Promise<LocationNode | null> {
    const session = getNeo4jSession();
    try {
      const result = await session.run('MATCH (l:Location {id: $id}) RETURN l', { id });
      if (result.records.length === 0) return null;
      return this.nodeToLocation(result.records[0].get('l'));
    } finally {
      await session.close();
    }
  }

  private nodeToLocation(node: any): LocationNode {
    const props = node.properties;
    return {
      id: props.id,
      name: props.name,
      latitude: props.latitude,
      longitude: props.longitude,
      city: props.city,
      state: props.state,
      isActive: props.isActive,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    };
  }
}

export default new LocationRepository();
