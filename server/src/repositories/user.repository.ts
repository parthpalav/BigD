import { getNeo4jSession } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export interface UserNode {
  id: string;
  email: string;
  passwordHash: string;
  password: string; // Alias for passwordHash
  fullName?: string;
  phoneNumber?: string;
  fcmToken?: string;
  googleId?: string;
  profilePicture?: string;
  lastLogin?: Date;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRepository {
  async create(data: { 
    email: string; 
    password: string; 
    fullName?: string; 
    phoneNumber?: string;
    googleId?: string;
    profilePicture?: string;
  }): Promise<Omit<UserNode, 'passwordHash'>> {
    const session = getNeo4jSession();
    try {
      const id = uuidv4();
      const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : '';
      const now = new Date();

      const result = await session.run(
        `CREATE (u:User {
          id: $id,
          email: $email,
          passwordHash: $passwordHash,
          fullName: $fullName,
          phoneNumber: $phoneNumber,
          googleId: $googleId,
          profilePicture: $profilePicture,
          isActive: true,
          isVerified: false,
          createdAt: datetime($now),
          updatedAt: datetime($now)
        })
        RETURN u`,
        { 
          id, 
          email: data.email, 
          passwordHash, 
          fullName: data.fullName || null, 
          phoneNumber: data.phoneNumber || null,
          googleId: data.googleId || null,
          profilePicture: data.profilePicture || null,
          now: now.toISOString() 
        }
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

  async findById(userId: string): Promise<UserNode | null> {
    const session = getNeo4jSession();
    try {
      const result = await session.run(
        'MATCH (u:User {id: $userId}) RETURN u',
        { userId }
      );

      if (result.records.length === 0) return null;
      return this.nodeToUser(result.records[0].get('u'));
    } finally {
      await session.close();
    }
  }

  async update(userId: string, data: { 
    fullName?: string; 
    phoneNumber?: string;
    profilePicture?: string;
  }): Promise<UserNode> {
    const session = getNeo4jSession();
    try {
      const updates: string[] = [];
      const params: any = { userId, now: new Date().toISOString() };

      if (data.fullName !== undefined) {
        updates.push('u.fullName = $fullName');
        params.fullName = data.fullName;
      }
      if (data.phoneNumber !== undefined) {
        updates.push('u.phoneNumber = $phoneNumber');
        params.phoneNumber = data.phoneNumber;
      }
      if (data.profilePicture !== undefined) {
        updates.push('u.profilePicture = $profilePicture');
        params.profilePicture = data.profilePicture;
      }

      updates.push('u.updatedAt = datetime($now)');

      const result = await session.run(
        `MATCH (u:User {id: $userId})
         SET ${updates.join(', ')}
         RETURN u`,
        params
      );

      return this.nodeToUser(result.records[0].get('u'));
    } finally {
      await session.close();
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    const session = getNeo4jSession();
    try {
      await session.run(
        `MATCH (u:User {id: $userId})
         SET u.lastLogin = datetime($now), u.updatedAt = datetime($now)`,
        { userId, now: new Date().toISOString() }
      );
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
      password: props.passwordHash, // Alias
      fullName: props.fullName,
      phoneNumber: props.phoneNumber,
      fcmToken: props.fcmToken,
      googleId: props.googleId,
      profilePicture: props.profilePicture,
      lastLogin: props.lastLogin ? new Date(props.lastLogin) : undefined,
      isActive: props.isActive,
      isVerified: props.isVerified,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    };
  }
}

export default new UserRepository();
