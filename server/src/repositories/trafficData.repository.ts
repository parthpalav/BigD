import { Session } from 'neo4j-driver';
import { getNeo4jSession } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface TrafficDataNode {
  id: string;
  locationId: string;
  timestamp: Date;
  vehicleCount: number;
  averageSpeed: number;
  congestionLevel: 'low' | 'moderate' | 'high' | 'severe';
  temperature?: number;
  humidity?: number;
  weatherCondition?: string;
  isHoliday: boolean;
  isRushHour: boolean;
  createdAt: Date;
}

export class TrafficDataRepository {
  async create(data: Omit<TrafficDataNode, 'id' | 'createdAt'>): Promise<TrafficDataNode> {
    const session = getNeo4jSession();
    try {
      const id = uuidv4();
      const createdAt = new Date();

      const result = await session.run(
        `CREATE (t:TrafficData {
          id: $id,
          locationId: $locationId,
          timestamp: datetime($timestamp),
          vehicleCount: $vehicleCount,
          averageSpeed: $averageSpeed,
          congestionLevel: $congestionLevel,
          temperature: $temperature,
          humidity: $humidity,
          weatherCondition: $weatherCondition,
          isHoliday: $isHoliday,
          isRushHour: $isRushHour,
          createdAt: datetime($createdAt)
        })
        RETURN t`,
        { id, createdAt: createdAt.toISOString(), ...data }
      );

      return this.nodeToTrafficData(result.records[0].get('t'));
    } finally {
      await session.close();
    }
  }

  async find(locationId?: string, startTime?: Date, endTime?: Date, limit: number = 100): Promise<TrafficDataNode[]> {
    const session = getNeo4jSession();
    try {
      let query = 'MATCH (t:TrafficData)';
      const params: any = {};

      const conditions: string[] = [];
      if (locationId) {
        conditions.push('t.locationId = $locationId');
        params.locationId = locationId;
      }
      if (startTime && endTime) {
        conditions.push('t.timestamp >= datetime($startTime) AND t.timestamp <= datetime($endTime)');
        params.startTime = startTime.toISOString();
        params.endTime = endTime.toISOString();
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' RETURN t ORDER BY t.timestamp DESC LIMIT $limit';
      params.limit = limit;

      const result = await session.run(query, params);
      return result.records.map(record => this.nodeToTrafficData(record.get('t')));
    } finally {
      await session.close();
    }
  }

  async getStats(locationId: string, hours: number = 24): Promise<any> {
    const session = getNeo4jSession();
    try {
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      const result = await session.run(
        `MATCH (t:TrafficData)
         WHERE t.locationId = $locationId AND t.timestamp >= datetime($startTime)
         RETURN 
           avg(t.vehicleCount) as avgVehicleCount,
           avg(t.averageSpeed) as avgSpeed,
           count(CASE WHEN t.congestionLevel = 'low' THEN 1 END) as lowCount,
           count(CASE WHEN t.congestionLevel = 'moderate' THEN 1 END) as moderateCount,
           count(CASE WHEN t.congestionLevel = 'high' THEN 1 END) as highCount,
           count(CASE WHEN t.congestionLevel = 'severe' THEN 1 END) as severeCount,
           count(t) as totalCount`,
        { locationId, startTime: startTime.toISOString() }
      );

      const record = result.records[0];
      return {
        avgVehicleCount: record.get('avgVehicleCount'),
        avgSpeed: record.get('avgSpeed'),
        congestionDistribution: {
          low: record.get('lowCount').toNumber(),
          moderate: record.get('moderateCount').toNumber(),
          high: record.get('highCount').toNumber(),
          severe: record.get('severeCount').toNumber(),
        },
        dataPoints: record.get('totalCount').toNumber(),
      };
    } finally {
      await session.close();
    }
  }

  private nodeToTrafficData(node: any): TrafficDataNode {
    const props = node.properties;
    return {
      id: props.id,
      locationId: props.locationId,
      timestamp: new Date(props.timestamp),
      vehicleCount: props.vehicleCount.toNumber ? props.vehicleCount.toNumber() : props.vehicleCount,
      averageSpeed: props.averageSpeed,
      congestionLevel: props.congestionLevel,
      temperature: props.temperature,
      humidity: props.humidity,
      weatherCondition: props.weatherCondition,
      isHoliday: props.isHoliday,
      isRushHour: props.isRushHour,
      createdAt: new Date(props.createdAt),
    };
  }
}

export default new TrafficDataRepository();
