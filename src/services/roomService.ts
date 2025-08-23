import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  addDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Room, RoomMember, User, Swipe, Match, FoodCard, SwipeAction } from '../types';
import { cleanRestaurantForFirestore } from '../utils/firestoreUtils';
import { FirestoreErrorHandler } from '../utils/firestoreErrorHandler';
import { InputValidation, ValidationError } from '../utils/inputValidation';
import { ErrorSanitization } from '../utils/errorSanitization';

export class RoomService {
  static async createRoom(name: string, createdBy: string, displayName: string): Promise<Room> {
    console.log('🔄 RoomService.createRoom START:', { 
      name, 
      createdBy, 
      displayName,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Validate inputs
      console.log('📝 Validating inputs...');
      if (!name || name.trim().length === 0 || name.length > 50) {
        console.log('❌ Invalid room name:', name);
        throw new ValidationError('Room name must be between 1 and 50 characters');
      }

      if (!InputValidation.validateUserId(createdBy)) {
        console.log('❌ Invalid user ID:', createdBy);
        throw new ValidationError('Invalid user ID');
      }

      if (!InputValidation.validateDisplayName(displayName)) {
        console.log('❌ Invalid display name:', displayName);
        throw new ValidationError('Invalid display name');
      }

      console.log('✅ Input validation passed');

      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('📋 Generated PIN:', pin);
      
      const room: Room = {
        id: '',
        pin,
        name,
        createdBy,
        members: [{
          userId: createdBy,
          displayName,
          joinedAt: new Date(),
          isActive: true,
        }],
        currentCardIndex: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('📄 Room object created:', room);
      console.log('🔗 Adding to Firestore collection...');

      const docRef = await addDoc(collection(db, 'rooms'), {
        ...room,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Document added to Firestore, ID:', docRef.id);
      room.id = docRef.id;
      
      console.log('🎉 Room creation successful:', room);
      return room;
    } catch (error) {
      console.error('❌ RoomService.createRoom ERROR:', error);
      
      if (error instanceof ValidationError) {
        console.log('📝 Validation error, re-throwing as-is');
        throw error; // Safe to show validation errors to users
      }
      
      console.log('🔧 Sanitizing error...');
      const sanitizedError = ErrorSanitization.logAndSanitizeError(error, 'Room Creation');
      console.log('🔧 Sanitized error:', sanitizedError);
      throw new Error(sanitizedError);
    }
  }

  static async joinRoom(pin: string, userId: string, displayName: string): Promise<Room> {
    try {
      // Validate inputs
      if (!InputValidation.validateRoomPin(pin)) {
        throw new ValidationError('Invalid room PIN. Must be 6 digits.');
      }

      if (!InputValidation.validateUserId(userId)) {
        throw new ValidationError('Invalid user ID');
      }

      if (!InputValidation.validateDisplayName(displayName)) {
        throw new ValidationError('Invalid display name');
      }

      const roomsQuery = query(
        collection(db, 'rooms'),
        where('pin', '==', pin),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(roomsQuery);
      
      if (querySnapshot.empty) {
        throw new Error('Room not found or inactive');
      }

      const roomDoc = querySnapshot.docs[0];
      const room = roomDoc.data() as Room;
      room.id = roomDoc.id;

      // Check if user is already a member
      const isMember = room.members.some(member => member.userId === userId);
      
      if (!isMember) {
        const newMember: RoomMember = {
          userId,
          displayName,
          joinedAt: new Date(),
          isActive: true,
        };

        await updateDoc(doc(db, 'rooms', room.id), {
          members: [...room.members, newMember],
          updatedAt: serverTimestamp(),
        });

        room.members.push(newMember);
      }

      return room;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error; // Safe to show validation errors to users
      }
      const sanitizedError = ErrorSanitization.logAndSanitizeError(error, 'Room Join');
      throw new Error(sanitizedError);
    }
  }

  static async getRoom(roomId: string): Promise<Room | null> {
    try {
      const roomDoc = await getDoc(doc(db, 'rooms', roomId));
      if (roomDoc.exists()) {
        const room = roomDoc.data() as Room;
        room.id = roomDoc.id;
        return room;
      }
      return null;
    } catch (error) {
      console.error('Get room error:', error);
      throw error;
    }
  }

  static async leaveRoom(roomId: string, userId: string): Promise<void> {
    try {
      const room = await this.getRoom(roomId);
      if (!room) return;

      const updatedMembers = room.members.filter(member => member.userId !== userId);
      
      if (updatedMembers.length === 0) {
        // Delete room if no members left
        await deleteDoc(doc(db, 'rooms', roomId));
      } else {
        // Update room with remaining members
        await updateDoc(doc(db, 'rooms', roomId), {
          members: updatedMembers,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Leave room error:', error);
      throw error;
    }
  }

  static async submitSwipe(roomId: string, userId: string, cardId: string, action: 'like' | 'dislike' | 'superlike'): Promise<void> {
    try {
      // Check if user has already swiped on this card
      const existingSwipeQuery = query(
        collection(db, 'swipes'),
        where('roomId', '==', roomId),
        where('userId', '==', userId),
        where('cardId', '==', cardId)
      );
      
      const existingSwipeSnapshot = await getDocs(existingSwipeQuery);
      if (!existingSwipeSnapshot.empty) {
        console.log('User has already swiped on this card');
        return;
      }

      // Create new swipe record
      const swipe: Omit<Swipe, 'id'> = {
        roomId,
        userId,
        cardId,
        action,
        timestamp: new Date(),
      };

      // Use batch write for atomicity
      const batch = writeBatch(db);
      
      // Add swipe to collection
      const swipeRef = doc(collection(db, 'swipes'));
      batch.set(swipeRef, {
        ...swipe,
        timestamp: serverTimestamp(),
      });

      // Update room member's current swipe
      const room = await this.getRoom(roomId);
      if (room) {
        const updatedMembers = room.members.map(member => 
          member.userId === userId 
            ? { ...member, currentSwipe: action }
            : member
        );

        const roomRef = doc(db, 'rooms', roomId);
        batch.update(roomRef, {
          members: updatedMembers,
          updatedAt: serverTimestamp(),
        });
      }

      // Commit the batch
      await batch.commit();
    } catch (error) {
      console.error('Submit swipe error:', error);
      throw error;
    }
  }

  static async checkForMatch(roomId: string, cardId: string): Promise<Match | null> {
    try {
      const room = await this.getRoom(roomId);
      if (!room) return null;

      // Get all swipes for this card in this room
      const swipesQuery = query(
        collection(db, 'swipes'),
        where('roomId', '==', roomId),
        where('cardId', '==', cardId)
      );
      
      const swipesSnapshot = await getDocs(swipesQuery);
      const swipes = swipesSnapshot.docs.map(doc => doc.data() as Swipe);

      // Check if all active members have swiped positively (like or superlike)
      const activeMembers = room.members.filter(member => member.isActive);
      const memberSwipes = new Map<string, SwipeAction>();
      
      swipes.forEach(swipe => {
        memberSwipes.set(swipe.userId, swipe.action);
      });

      // Ensure all active members have swiped and all swiped positively
      const allMembersHaveSwiped = activeMembers.every(member => 
        memberSwipes.has(member.userId)
      );
      
      const allSwipedPositively = activeMembers.every(member => {
        const swipeAction = memberSwipes.get(member.userId);
        return swipeAction === 'like' || swipeAction === 'superlike';
      });

      if (allMembersHaveSwiped && allSwipedPositively && activeMembers.length > 1) {
        // Check if match already exists
        const existingMatchQuery = query(
          collection(db, 'matches'),
          where('roomId', '==', roomId),
          where('cardId', '==', cardId)
        );
        
        const existingMatchSnapshot = await getDocs(existingMatchQuery);
        if (!existingMatchSnapshot.empty) {
          // Match already exists
          return null;
        }

        const match: Match = {
          id: '',
          roomId,
          cardId,
          matchedAt: new Date(),
          members: activeMembers.map(member => member.userId),
          isViewed: false,
        };

        const docRef = await addDoc(collection(db, 'matches'), {
          ...match,
          matchedAt: serverTimestamp(),
        });

        match.id = docRef.id;
        return match;
      }

      return null;
    } catch (error) {
      console.error('Check for match error:', error);
      throw error;
    }
  }

  static async getMatches(roomId: string): Promise<Match[]> {
    try {
      const matchesQuery = query(
        collection(db, 'matches'),
        where('roomId', '==', roomId),
        orderBy('matchedAt', 'desc')
      );

      const querySnapshot = await getDocs(matchesQuery);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Match[];
    } catch (error) {
      console.error('Get matches error:', error);
      throw error;
    }
  }

  static onRoomUpdate(roomId: string, callback: (room: Room) => void) {
    return onSnapshot(doc(db, 'rooms', roomId), (doc) => {
      if (doc.exists()) {
        const room = doc.data() as Room;
        room.id = doc.id;
        callback(room);
      }
    });
  }

  static onMatchesUpdate(roomId: string, callback: (matches: Match[]) => void) {
    const matchesQuery = query(
      collection(db, 'matches'),
      where('roomId', '==', roomId),
      orderBy('matchedAt', 'desc')
    );

    return onSnapshot(matchesQuery, (querySnapshot) => {
      const matches = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Match[];
      callback(matches);
    });
  }

  // Favorites functionality
  static async saveFavorite(userId: string, restaurant: FoodCard): Promise<void> {
    try {
      // Clean the restaurant data to remove undefined values for Firestore
      const cleanRestaurant = cleanRestaurantForFirestore(restaurant);

      const favoriteDoc = doc(db, 'favorites', `${userId}_${restaurant.id}`);
      await setDoc(favoriteDoc, {
        userId,
        restaurant: cleanRestaurant,
        addedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Save favorite error:', error);
      throw error;
    }
  }

  static async removeFavorite(userId: string, restaurantId: string): Promise<void> {
    try {
      const favoriteDoc = doc(db, 'favorites', `${userId}_${restaurantId}`);
      await deleteDoc(favoriteDoc);
    } catch (error) {
      console.error('Remove favorite error:', error);
      throw error;
    }
  }

  static async getFavorites(userId: string): Promise<FoodCard[]> {
    try {
      // First try the optimized query with composite index
      let favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', userId),
        orderBy('addedAt', 'desc')
      );

      let querySnapshot;
      try {
        querySnapshot = await getDocs(favoritesQuery);
      } catch (indexError: any) {
        // If composite index isn't ready, fall back to simple query
        if (FirestoreErrorHandler.isIndexError(indexError)) {
          FirestoreErrorHandler.logError(indexError, 'getFavorites');
          favoritesQuery = query(
            collection(db, 'favorites'),
            where('userId', '==', userId)
          );
          querySnapshot = await getDocs(favoritesQuery);
        } else {
          throw indexError;
        }
      }
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const restaurant = data.restaurant;
        
        // Ensure all required fields are present and convert back to FoodCard
        return {
          id: restaurant.id,
          type: restaurant.type || 'restaurant',
          title: restaurant.title,
          subtitle: restaurant.subtitle || '',
          description: restaurant.description,
          imageUrl: restaurant.imageUrl,
          rating: restaurant.rating ?? 0,
          price: restaurant.price || '',
          cuisine: restaurant.cuisine || '',
          distance: restaurant.distance ?? 0,
          deliveryTime: restaurant.deliveryTime ?? 0,
          tags: restaurant.tags || [],
          location: restaurant.location,
          externalLinks: restaurant.externalLinks || {},
          services: restaurant.services || {},
          isOpen: restaurant.isOpen ?? true,
          userRatingsTotal: restaurant.userRatingsTotal,
  
        } as FoodCard;
      });
    } catch (error: any) {
      FirestoreErrorHandler.logError(error, 'getFavorites');
      throw error;
    }
  }

  static async isFavorite(userId: string, restaurantId: string): Promise<boolean> {
    try {
      const favoriteDoc = doc(db, 'favorites', `${userId}_${restaurantId}`);
      const docSnap = await getDoc(favoriteDoc);
      return docSnap.exists();
    } catch (error) {
      console.error('Check favorite error:', error);
      return false;
    }
  }
}
