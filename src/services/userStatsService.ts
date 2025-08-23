import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from './loggingService';

export interface UserStats {
  matches: number;
  rooms: number;
  swipes: number;
  favorites: number;
  isLoading: boolean;
}

export class UserStatsService {
  /**
   * Get comprehensive user statistics
   */
  static async getUserStats(userId: string): Promise<UserStats> {
    try {
      logger.info('Fetching user statistics', 'USER_STATS', { userId });

      // Run all queries in parallel for better performance
      const [matchesCount, roomsCount, swipesCount, favoritesCount] = await Promise.all([
        this.getUserMatches(userId),
        this.getUserRooms(userId), 
        this.getUserSwipes(userId),
        this.getUserFavorites(userId)
      ]);

      const stats: UserStats = {
        matches: matchesCount,
        rooms: roomsCount,
        swipes: swipesCount,
        favorites: favoritesCount,
        isLoading: false
      };

      logger.info('User statistics fetched successfully', 'USER_STATS', stats);
      return stats;

    } catch (error) {
      logger.error('Failed to fetch user statistics', 'USER_STATS', error as Error);
      
      // Return zero stats on error rather than throwing
      return {
        matches: 0,
        rooms: 0,
        swipes: 0,
        favorites: 0,
        isLoading: false
      };
    }
  }

  /**
   * Get count of matches for user
   */
  private static async getUserMatches(userId: string): Promise<number> {
    try {
      // Query matches where user is a member
      const matchesQuery = query(
        collection(db, 'matches'),
        where('members', 'array-contains', userId)
      );
      
      const snapshot = await getCountFromServer(matchesQuery);
      return snapshot.data().count;
    } catch (error) {
      logger.warn('Failed to fetch matches count', 'USER_STATS', error as Error);
      return 0;
    }
  }

  /**
   * Get count of rooms user has joined
   */
  private static async getUserRooms(userId: string): Promise<number> {
    try {
      // We need to fetch all rooms and filter client-side since Firestore 
      // doesn't support array-contains queries on nested object fields
      const roomsSnapshot = await getDocs(collection(db, 'rooms'));
      
      let count = 0;
      roomsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const members = data.members || [];
        
        // Check if user is in the members array
        const isMember = members.some((member: any) => member.userId === userId);
        if (isMember) {
          count++;
        }
      });
      
      return count;
    } catch (error) {
      logger.warn('Failed to fetch rooms count', 'USER_STATS', error as Error);
      return 0;
    }
  }

  /**
   * Get count of swipes by user
   */
  private static async getUserSwipes(userId: string): Promise<number> {
    try {
      const swipesQuery = query(
        collection(db, 'swipes'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getCountFromServer(swipesQuery);
      return snapshot.data().count;
    } catch (error) {
      logger.warn('Failed to fetch swipes count', 'USER_STATS', error as Error);
      return 0;
    }
  }

  /**
   * Get count of user's favorites
   */
  private static async getUserFavorites(userId: string): Promise<number> {
    try {
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getCountFromServer(favoritesQuery);
      return snapshot.data().count;
    } catch (error) {
      logger.warn('Failed to fetch favorites count', 'USER_STATS', error as Error);
      return 0;
    }
  }

  /**
   * Get recent activity stats (last 30 days)
   */
  static async getRecentActivityStats(userId: string): Promise<{
    recentMatches: number;
    recentSwipes: number;
    recentRooms: number;
  }> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [recentMatches, recentSwipes, recentRooms] = await Promise.all([
        this.getRecentMatches(userId, thirtyDaysAgo),
        this.getRecentSwipes(userId, thirtyDaysAgo),
        this.getRecentRooms(userId, thirtyDaysAgo)
      ]);

      return {
        recentMatches,
        recentSwipes,
        recentRooms
      };
    } catch (error) {
      logger.error('Failed to fetch recent activity stats', 'USER_STATS', error as Error);
      return {
        recentMatches: 0,
        recentSwipes: 0,
        recentRooms: 0
      };
    }
  }

  private static async getRecentMatches(userId: string, since: Date): Promise<number> {
    try {
      const matchesQuery = query(
        collection(db, 'matches'),
        where('members', 'array-contains', userId),
        where('matchedAt', '>=', since)
      );
      
      const snapshot = await getCountFromServer(matchesQuery);
      return snapshot.data().count;
    } catch (error) {
      return 0;
    }
  }

  private static async getRecentSwipes(userId: string, since: Date): Promise<number> {
    try {
      const swipesQuery = query(
        collection(db, 'swipes'),
        where('userId', '==', userId),
        where('timestamp', '>=', since)
      );
      
      const snapshot = await getCountFromServer(swipesQuery);
      return snapshot.data().count;
    } catch (error) {
      return 0;
    }
  }

  private static async getRecentRooms(userId: string, since: Date): Promise<number> {
    try {
      // Get rooms where user joined recently
      const roomsSnapshot = await getDocs(collection(db, 'rooms'));
      
      let count = 0;
      roomsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const members = data.members || [];
        
        // Check if user is a member and joined recently
        const userMember = members.find((member: any) => member.userId === userId);
        if (userMember && userMember.joinedAt && userMember.joinedAt.toDate() >= since) {
          count++;
        }
      });
      
      return count;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get default/loading stats
   */
  static getLoadingStats(): UserStats {
    return {
      matches: 0,
      rooms: 0, 
      swipes: 0,
      favorites: 0,
      isLoading: true
    };
  }

  /**
   * Format large numbers for display (e.g., 1.2k, 12.3k)
   */
  static formatStatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
  }
}