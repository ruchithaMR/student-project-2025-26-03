"""
MongoDB Service for storing predictions and analytics
Connects to MongoDB Atlas for persistent data storage
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from pymongo import MongoClient, DESCENDING
from pymongo.errors import ConnectionFailure, OperationFailure, PyMongoError
import os
import bcrypt

logger = logging.getLogger(__name__)

class MongoDBService:
    def __init__(self, connection_string: Optional[str] = None):
        """
        Initialize MongoDB connection
        
        Args:
            connection_string: MongoDB Atlas connection string
        """
        self.connection_string = connection_string or os.getenv('MONGODB_URI')
        self.client = None
        self.db = None
        self.connected = False
        
        if self.connection_string:
            self._connect()
        else:
            logger.warning("MongoDB connection string not provided - running without database")
    
    def _connect(self):
        """Establish connection to MongoDB Atlas"""
        try:
            self.client = MongoClient(
                self.connection_string,
                serverSelectionTimeoutMS=5000,
                socketTimeoutMS=10000
            )
            
            # Test connection
            self.client.admin.command('ping')
            
            # Select database
            self.db = self.client['fake_news_detection']
            
            # Create indexes
            self._create_indexes()
            
            self.connected = True
            logger.info("✅ MongoDB Atlas connected successfully")
            
        except ConnectionFailure as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            self.connected = False
            self.db = None
        except Exception as e:
            logger.error(f"❌ MongoDB setup error: {e}")
            self.connected = False
            self.db = None

    def _ensure_connection(self) -> bool:
        """Ensure we have an active MongoDB connection, retrying once if needed."""
        if self.connected and self.db is not None:
            return True

        self._connect()
        return self.connected and self.db is not None
    
    def _create_indexes(self):
        """Create database indexes for better query performance"""
        try:
            # Predictions collection indexes
            self.db.predictions.create_index([('timestamp', DESCENDING)])
            self.db.predictions.create_index('prediction_type')
            self.db.predictions.create_index('is_fake')
            self.db.predictions.create_index('user_email')
            
            # Analytics collection indexes
            self.db.analytics.create_index([('date', DESCENDING)])
            
            logger.debug("Database indexes created")
        except Exception as e:
            logger.warning(f"Index creation warning: {e}")
    
    def save_prediction(self, prediction_data: Dict) -> Optional[str]:
        """
        Save prediction result to database
        
        Args:
            prediction_data: Dictionary containing prediction details
            
        Returns:
            Inserted document ID or None if failed
        """
        if not self.connected:
            logger.debug("MongoDB not connected - skipping save")
            return None
        
        try:
            # Add timestamp
            prediction_data['timestamp'] = datetime.utcnow()
            
            # Insert into predictions collection
            result = self.db.predictions.insert_one(prediction_data)
            
            # Update analytics
            self._update_analytics(prediction_data)
            
            logger.debug(f"Prediction saved: {result.inserted_id}")
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Failed to save prediction: {e}")
            self.connected = False
            return None
    
    def _update_analytics(self, prediction_data: Dict):
        """Update daily analytics counters"""
        try:
            today = datetime.utcnow().date().isoformat()
            
            # Increment counters
            self.db.analytics.update_one(
                {'date': today},
                {
                    '$inc': {
                        'total_predictions': 1,
                        'fake_predictions': 1 if prediction_data.get('is_fake') else 0,
                        'real_predictions': 0 if prediction_data.get('is_fake') else 1,
                        f"by_type.{prediction_data.get('prediction_type', 'unknown')}": 1
                    },
                    '$setOnInsert': {'created_at': datetime.utcnow()}
                },
                upsert=True
            )
        except Exception as e:
            logger.warning(f"Analytics update failed: {e}")
    
    def get_recent_predictions(
        self,
        limit: int = 50,
        prediction_type: Optional[str] = None,
        user_email: Optional[str] = None
    ) -> List[Dict]:
        """
        Get recent predictions from database
        
        Args:
            limit: Maximum number of predictions to return
            prediction_type: Filter by type (text, url, image, claim)
            
        Returns:
            List of prediction documents
        """
        if not self.connected:
            return []
        
        try:
            query = {}
            if prediction_type:
                query['prediction_type'] = prediction_type
            if user_email:
                query['user_email'] = user_email.strip().lower()
            
            predictions = self.db.predictions.find(query).sort('timestamp', DESCENDING).limit(limit)
            
            result = []
            for pred in predictions:
                pred['_id'] = str(pred['_id'])  # Convert ObjectId to string
                result.append(pred)
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to fetch predictions: {e}")
            self.connected = False
            return []
    
    def get_analytics(self, days: int = 30, user_email: Optional[str] = None) -> Dict:
        """
        Get analytics data for specified number of days
        
        Args:
            days: Number of days to fetch analytics for
            
        Returns:
            Dictionary with analytics data
        """
        if not self.connected:
            return {'error': 'Database not connected'}
        
        try:
            start_date = datetime.utcnow() - timedelta(days=max(days, 1))
            query: Dict = {'timestamp': {'$gte': start_date}}
            if user_email:
                query['user_email'] = user_email.strip().lower()

            predictions = list(self.db.predictions.find(query))

            daily_map: Dict[str, Dict] = {}
            total_predictions = 0
            total_fake = 0
            total_real = 0

            for pred in predictions:
                ts = pred.get('timestamp')
                if isinstance(ts, datetime):
                    day_key = ts.date().isoformat()
                else:
                    day_key = datetime.utcnow().date().isoformat()

                if day_key not in daily_map:
                    daily_map[day_key] = {
                        'date': day_key,
                        'total_predictions': 0,
                        'fake_predictions': 0,
                        'real_predictions': 0,
                        'by_type': {}
                    }

                item = daily_map[day_key]
                item['total_predictions'] += 1
                p_type = pred.get('prediction_type', 'unknown')
                item['by_type'][p_type] = item['by_type'].get(p_type, 0) + 1

                is_fake = bool(pred.get('is_fake'))
                if is_fake:
                    item['fake_predictions'] += 1
                    total_fake += 1
                else:
                    item['real_predictions'] += 1
                    total_real += 1

                total_predictions += 1

            daily_stats = sorted(daily_map.values(), key=lambda x: x['date'], reverse=True)[:days]

            return {
                'daily_stats': daily_stats,
                'summary': {
                    'total_predictions': total_predictions,
                    'fake_predictions': total_fake,
                    'real_predictions': total_real,
                    'fake_percentage': round((total_fake / total_predictions * 100) if total_predictions > 0 else 0, 2)
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to fetch analytics: {e}")
            self.connected = False
            return {'error': str(e)}
    
    def get_stats(self, user_email: Optional[str] = None) -> Dict:
        """
        Get overall database statistics
        
        Returns:
            Dictionary with database stats
        """
        if not self.connected:
            return {'connected': False}
        
        try:
            query: Dict = {}
            if user_email:
                query['user_email'] = user_email.strip().lower()

            total_predictions = self.db.predictions.count_documents(query)

            fake_query = dict(query)
            fake_query['is_fake'] = True
            real_query = dict(query)
            real_query['is_fake'] = False

            fake_count = self.db.predictions.count_documents(fake_query)
            real_count = self.db.predictions.count_documents(real_query)
            
            # Count by type
            text_query = dict(query)
            text_query['prediction_type'] = 'text'
            url_query = dict(query)
            url_query['prediction_type'] = 'url'
            image_query = dict(query)
            image_query['prediction_type'] = 'image'
            claim_query = dict(query)
            claim_query['prediction_type'] = 'claim'

            text_count = self.db.predictions.count_documents(text_query)
            url_count = self.db.predictions.count_documents(url_query)
            image_count = self.db.predictions.count_documents(image_query)
            claim_count = self.db.predictions.count_documents(claim_query)
            
            return {
                'connected': True,
                'total_predictions': total_predictions,
                'fake_predictions': fake_count,
                'real_predictions': real_count,
                'by_type': {
                    'text': text_count,
                    'url': url_count,
                    'image': image_count,
                    'claim': claim_count
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to fetch stats: {e}")
            self.connected = False
            return {'connected': False, 'error': str(e)}

    def get_user_profile(self, profile_id: str = 'default') -> Dict:
        """
        Get a user profile document.

        Args:
            profile_id: Logical profile identifier (single-user mode uses 'default').

        Returns:
            Profile dictionary or empty defaults when not found.
        """
        default_profile = {
            'profile_id': profile_id,
            'name': '',
            'email': '',
            'phone': '',
            'organization': '',
            'role': '',
            'bio': '',
            'updated_at': None,
        }

        if not self._ensure_connection():
            return default_profile

        try:
            profile = self.db.user_profiles.find_one({'profile_id': profile_id})
            if not profile:
                return default_profile

            profile['_id'] = str(profile['_id'])
            return {
                'profile_id': profile.get('profile_id', profile_id),
                'name': profile.get('name', ''),
                'email': profile.get('email', ''),
                'phone': profile.get('phone', ''),
                'organization': profile.get('organization', ''),
                'role': profile.get('role', ''),
                'bio': profile.get('bio', ''),
                'updated_at': profile.get('updated_at'),
            }
        except Exception as e:
            logger.error(f"Failed to fetch user profile: {e}")
            self.connected = False

            # One reconnect retry for transient DNS/network drops.
            if self._ensure_connection():
                try:
                    profile = self.db.user_profiles.find_one({'profile_id': profile_id})
                    if profile:
                        profile['_id'] = str(profile['_id'])
                        return {
                            'profile_id': profile.get('profile_id', profile_id),
                            'name': profile.get('name', ''),
                            'email': profile.get('email', ''),
                            'phone': profile.get('phone', ''),
                            'organization': profile.get('organization', ''),
                            'role': profile.get('role', ''),
                            'bio': profile.get('bio', ''),
                            'updated_at': profile.get('updated_at'),
                        }
                except Exception:
                    self.connected = False
            return default_profile

    def save_user_profile(self, profile_data: Dict, profile_id: str = 'default') -> bool:
        """
        Save (upsert) a user profile document.

        Args:
            profile_data: Profile fields to persist.
            profile_id: Logical profile identifier.

        Returns:
            True on success, False on failure.
        """
        if not self._ensure_connection():
            logger.debug("MongoDB not connected - skipping profile save")
            return False

        try:
            payload = {
                'name': str(profile_data.get('name', '')).strip(),
                'email': str(profile_data.get('email', '')).strip(),
                'phone': str(profile_data.get('phone', '')).strip(),
                'organization': str(profile_data.get('organization', '')).strip(),
                'role': str(profile_data.get('role', '')).strip(),
                'bio': str(profile_data.get('bio', '')).strip(),
                'updated_at': datetime.utcnow(),
            }

            self.db.user_profiles.update_one(
                {'profile_id': profile_id},
                {
                    '$set': payload,
                    '$setOnInsert': {
                        'profile_id': profile_id,
                        'created_at': datetime.utcnow(),
                    }
                },
                upsert=True
            )
            return True
        except Exception as e:
            logger.error(f"Failed to save user profile: {e}")
            self.connected = False
            return False

    def change_user_password(self, profile_id: str, current_password: str, new_password: str) -> Dict:
        """
        Change user password using bcrypt hashing.

        Args:
            profile_id: Logical profile/user identifier (email-based in app flow).
            current_password: Current plaintext password entered by user.
            new_password: New plaintext password to store as bcrypt hash.

        Returns:
            Result dict with success flag and optional reason.
        """
        if not self._ensure_connection():
            return {'success': False, 'reason': 'Database not connected'}

        try:
            profile = self.db.user_profiles.find_one({'profile_id': profile_id}) or {}
            existing_hash = profile.get('password_hash')

            # Verify current password only when an existing hash is present.
            if existing_hash:
                existing_hash_bytes = str(existing_hash).encode('utf-8')
                if not bcrypt.checkpw(current_password.encode('utf-8'), existing_hash_bytes):
                    return {'success': False, 'reason': 'Current password is incorrect'}

            new_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')

            self.db.user_profiles.update_one(
                {'profile_id': profile_id},
                {
                    '$set': {
                        'password_hash': new_hash,
                        'updated_at': datetime.utcnow(),
                    },
                    '$setOnInsert': {
                        'profile_id': profile_id,
                        'created_at': datetime.utcnow(),
                    }
                },
                upsert=True
            )

            return {'success': True}
        except Exception as e:
            logger.error(f"Failed to change password for profile '{profile_id}': {e}")
            self.connected = False
            return {'success': False, 'reason': 'Failed to update password'}

    def delete_user_account(self, profile_id: str) -> Dict:
        """
        Permanently delete a user account and its user-scoped prediction data.

        Args:
            profile_id: User identifier (email-based in app flow).

        Returns:
            Result dictionary with deletion counts.
        """
        if not self._ensure_connection():
            return {'success': False, 'reason': 'Database not connected'}

        try:
            normalized_id = str(profile_id or '').strip().lower()
            if not normalized_id:
                return {'success': False, 'reason': 'Invalid user identifier'}

            profile_result = self.db.user_profiles.delete_one({'profile_id': normalized_id})
            predictions_result = self.db.predictions.delete_many({'user_email': normalized_id})

            return {
                'success': True,
                'profile_deleted': profile_result.deleted_count,
                'predictions_deleted': predictions_result.deleted_count,
            }
        except Exception as e:
            logger.error(f"Failed to delete account for profile '{profile_id}': {e}")
            self.connected = False
            return {'success': False, 'reason': 'Failed to delete account'}
    
    def clear_all_data(self) -> Dict:
        """
        Clear all predictions and analytics data from database
        WARNING: This will delete all data permanently!
        
        Returns:
            Dictionary with deletion results
        """
        if not self.connected:
            return {'success': False, 'error': 'MongoDB not connected'}
        
        try:
            # Delete all predictions
            predictions_result = self.db.predictions.delete_many({})
            
            # Delete all analytics
            analytics_result = self.db.analytics.delete_many({})
            
            logger.info(f"🗑️ Database cleared - Deleted {predictions_result.deleted_count} predictions and {analytics_result.deleted_count} analytics entries")
            
            return {
                'success': True,
                'predictions_deleted': predictions_result.deleted_count,
                'analytics_deleted': analytics_result.deleted_count
            }
            
        except Exception as e:
            logger.error(f"Failed to clear database: {e}")
            return {'success': False, 'error': str(e)}
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")


# Singleton instance
_mongodb_service = None

def get_mongodb_service(connection_string: Optional[str] = None) -> MongoDBService:
    """Get or create MongoDB service instance"""
    global _mongodb_service
    if _mongodb_service is None:
        _mongodb_service = MongoDBService(connection_string)
    return _mongodb_service
