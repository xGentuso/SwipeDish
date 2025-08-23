import { Match, FoodCard } from '../types';
import { RoomService } from './roomService';
import { RestaurantService } from './restaurantService';

export interface MatchWithCard extends Match {
  card: FoodCard;
}

export class MatchesService {
  private static instance: MatchesService;
  private listeners: ((matches: MatchWithCard[]) => void)[] = [];
  private currentMatches: MatchWithCard[] = [];
  private isPolling = false;
  private pollInterval: NodeJS.Timeout | null = null;

  static getInstance(): MatchesService {
    if (!MatchesService.instance) {
      MatchesService.instance = new MatchesService();
    }
    return MatchesService.instance;
  }

  /**
   * Start real-time match monitoring
   */
  async startRealTimeMonitoring(userId: string): Promise<void> {
    if (this.isPolling) return;
    
    this.isPolling = true;
    
    // Initial load
    await this.loadMatches(userId);
    
    // Set up polling every 10 seconds for new matches
    this.pollInterval = setInterval(async () => {
      await this.checkForNewMatches(userId);
    }, 10000);
  }

  /**
   * Stop real-time match monitoring
   */
  stopRealTimeMonitoring(): void {
    this.isPolling = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Load all matches for a user
   */
  async loadMatches(userId: string): Promise<MatchWithCard[]> {
    try {
      // Get matches from Firestore
      const matches = await RoomService.getUserMatches(userId);
      
      // Enrich matches with restaurant data
      const matchesWithCards = await Promise.all(
        matches.map(async (match) => {
          const card = await RestaurantService.getRestaurantById(match.cardId);
          return {
            ...match,
            card: card || this.createFallbackCard(match.cardId)
          };
        })
      );

      this.currentMatches = matchesWithCards;
      this.notifyListeners(matchesWithCards);
      
      return matchesWithCards;
    } catch (error) {
      console.error('Failed to load matches:', error);
      return [];
    }
  }

  /**
   * Check for new matches and notify listeners
   */
  private async checkForNewMatches(userId: string): Promise<void> {
    try {
      const newMatches = await this.loadMatches(userId);
      const previousCount = this.currentMatches.length;
      
      if (newMatches.length > previousCount) {
        // New matches detected
        const addedMatches = newMatches.slice(0, newMatches.length - previousCount);
        this.notifyNewMatches(addedMatches);
      }
    } catch (error) {
      console.error('Failed to check for new matches:', error);
    }
  }

  /**
   * Get current matches
   */
  getCurrentMatches(): MatchWithCard[] {
    return this.currentMatches;
  }

  /**
   * Add a listener for match updates
   */
  addListener(listener: (matches: MatchWithCard[]) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener
   */
  removeListener(listener: (matches: MatchWithCard[]) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of match updates
   */
  private notifyListeners(matches: MatchWithCard[]): void {
    this.listeners.forEach(listener => {
      try {
        listener(matches);
      } catch (error) {
        console.error('Error in match listener:', error);
      }
    });
  }

  /**
   * Notify listeners of new matches specifically
   */
  private notifyNewMatches(newMatches: MatchWithCard[]): void {
    // This could be enhanced to provide more specific notifications
    this.notifyListeners(this.currentMatches);
  }

  /**
   * Mark a match as viewed
   */
  async markMatchAsViewed(matchId: string): Promise<void> {
    try {
      await RoomService.markMatchAsViewed(matchId);
      
      // Update local state
      this.currentMatches = this.currentMatches.map(match => 
        match.id === matchId ? { ...match, isViewed: true } : match
      );
      
      this.notifyListeners(this.currentMatches);
    } catch (error) {
      console.error('Failed to mark match as viewed:', error);
    }
  }

  /**
   * Get match statistics
   */
  getMatchStats(): {
    total: number;
    unviewed: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total: this.currentMatches.length,
      unviewed: this.currentMatches.filter(match => !match.isViewed).length,
      today: this.currentMatches.filter(match => match.matchedAt >= today).length,
      thisWeek: this.currentMatches.filter(match => match.matchedAt >= weekAgo).length,
      thisMonth: this.currentMatches.filter(match => match.matchedAt >= monthAgo).length,
    };
  }

  /**
   * Filter matches by criteria
   */
  filterMatches(criteria: {
    cuisine?: string;
    timeRange?: 'Today' | 'This Week' | 'This Month' | 'All';
    viewed?: boolean;
  }): MatchWithCard[] {
    let filtered = this.currentMatches;

    if (criteria.cuisine) {
      filtered = filtered.filter(match => match.card.cuisine === criteria.cuisine);
    }

    if (criteria.timeRange && criteria.timeRange !== 'All') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      switch (criteria.timeRange) {
        case 'Today':
          filtered = filtered.filter(match => match.matchedAt >= today);
          break;
        case 'This Week':
          filtered = filtered.filter(match => match.matchedAt >= weekAgo);
          break;
        case 'This Month':
          filtered = filtered.filter(match => match.matchedAt >= monthAgo);
          break;
      }
    }

    if (criteria.viewed !== undefined) {
      filtered = filtered.filter(match => match.isViewed === criteria.viewed);
    }

    return filtered;
  }

  /**
   * Create a fallback card when restaurant data is unavailable
   */
  private createFallbackCard(cardId: string): FoodCard {
    return {
      id: cardId,
      type: 'restaurant',
      title: 'Restaurant',
      subtitle: 'Information unavailable',
      description: 'Restaurant information is currently unavailable',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
      rating: 0,
      price: 'N/A',
      cuisine: 'Unknown',
      distance: 0,
      tags: [],
      services: { delivery: false, takeout: false, dineIn: false },
      location: { latitude: 0, longitude: 0, address: 'Location unavailable' },
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopRealTimeMonitoring();
    this.listeners = [];
    this.currentMatches = [];
  }
}

export const matchesService = MatchesService.getInstance();
