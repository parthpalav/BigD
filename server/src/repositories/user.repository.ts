import { getNeo4jSession } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export interface UserNode {
  id: string;
  email: string;
  passwordHash: string;
  fullName?: string;
  phoneNumber?: string;
  fcmToken?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRepository {
  async create(data: { email: string; password: string; fullName?: string; phoneNumber?: string }): Promise<Omit<UserNode, 'passwordHash'>> {
    const session = getNeo4jSession();
    try {
      const id = uuidv4();
      const passwordHash = await bcrypt.hash(data.password, 10);
      const now = new Date();

      const result = await session.run(
        `CREATE (u:User {
          id: $id,
          email: $email,
          passwordHash: $passwordHash,
          fullName: $fullName,
          phoneNumber: $phoneNumber,
          isActive: true,
          isVerified: false,
          createdAt: datetime($now),
          updatedAt: datetime($now)
        })
        RETURN u`,
        { id, email: data.email, passwordHash, fullName: data.fullName, phoneNumber: data.phoneNumber, now: now.toISOString() }
      );

      const user = this.nodeToUser(result.records[0].get('u'));
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } finally {
      await session.close();
    }
  }

  async findByEmail(email: string): Promise<UserNode | null> {
    const session = getNeo4jSession();
    try {
      const result = await session.run(
        'MATCH (u:User {email: $email}) RETURN u',
        { email }
      );

      if (result.records.length === 0) return null;
      return this.nodeToUser(result.records[0].get('u'));
    } finally {
      await session.close();
    }
  }

  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    const session = getNeo4jSession();
    try {
      await session.run(
        `MATCH (u:User {id: $userId})
         SET u.fcmToken = $fcmToken, u.updatedAt = datetime($now)`,
        { userId, fcmToken, now: new Date().toISOString() }
      );
    } finally {
      await session.close();
    }
  }

  private nodeToUser(node: any): UserNode {
    const props = node.properties;
    return {
      id: props.id,
      email: props.email,
      passwordHash: props.passwordHash,
      fullName: props.fullName,
      phoneNumber: props.phoneNumber,
      fcmToken: props.fcmToken,
      isActive: props.isActive,
      isVerified: props.isVerified,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    };
  }
}

export default new UserRepository();
