"""
Database Models for Photo Sorter WASM
Моделі бази даних для додатку сортування фото
"""

from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    """Модель користувача"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    is_premium = db.Column(db.Boolean, default=False)
    premium_expires = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    email_verified = db.Column(db.Boolean, default=False)
    
    # Статистика використання
    usage_count = db.Column(db.Integer, default=0)
    total_photos_processed = db.Column(db.Integer, default=0)
    total_processing_time = db.Column(db.Float, default=0.0)
    
    # Налаштування
    language = db.Column(db.String(10), default='uk')
    timezone = db.Column(db.String(50), default='Europe/Kiev')
    notifications_enabled = db.Column(db.Boolean, default=True)
    
    # Зв'язки
    subscriptions = db.relationship('Subscription', backref='user', lazy=True, cascade='all, delete-orphan')
    usage_logs = db.relationship('UsageLog', backref='user', lazy=True, cascade='all, delete-orphan')
    feedbacks = db.relationship('Feedback', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Встановлює пароль користувача"""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        """Перевіряє пароль користувача"""
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def is_premium_active(self):
        """Перевіряє чи активна преміум підписка"""
        if not self.is_premium:
            return False
        if self.premium_expires and self.premium_expires < datetime.utcnow():
            return False
        return True
    
    def get_remaining_photos(self):
        """Отримує кількість фото, що залишилися для безкоштовних користувачів"""
        if self.is_premium_active():
            return float('inf')
        return max(0, 1000 - self.usage_count)
    
    def can_process_photos(self, count):
        """Перевіряє чи може користувач обробити вказану кількість фото"""
        if self.is_premium_active():
            return True
        return self.usage_count + count <= 1000
    
    def to_dict(self):
        """Конвертує об'єкт в словник"""
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'is_premium': self.is_premium_active(),
            'premium_expires': self.premium_expires.isoformat() if self.premium_expires else None,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'is_active': self.is_active,
            'email_verified': self.email_verified,
            'usage_count': self.usage_count,
            'total_photos_processed': self.total_photos_processed,
            'total_processing_time': self.total_processing_time,
            'language': self.language,
            'timezone': self.timezone,
            'notifications_enabled': self.notifications_enabled,
            'remaining_photos': self.get_remaining_photos()
        }
    
    def __repr__(self):
        return f'<User {self.email}>'

class Subscription(db.Model):
    """Модель підписки"""
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    stripe_subscription_id = db.Column(db.String(255), unique=True, index=True)
    stripe_customer_id = db.Column(db.String(255), index=True)
    stripe_price_id = db.Column(db.String(255))
    
    # Статус підписки
    status = db.Column(db.String(50), default='active')  # active, cancelled, past_due, unpaid
    current_period_start = db.Column(db.DateTime)
    current_period_end = db.Column(db.DateTime)
    cancel_at_period_end = db.Column(db.Boolean, default=False)
    cancelled_at = db.Column(db.DateTime)
    
    # Метадані
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def is_active(self):
        """Перевіряє чи активна підписка"""
        return self.status in ['active', 'trialing'] and not self.cancel_at_period_end
    
    def days_remaining(self):
        """Отримує кількість днів до закінчення підписки"""
        if not self.current_period_end:
            return 0
        delta = self.current_period_end - datetime.utcnow()
        return max(0, delta.days)
    
    def to_dict(self):
        """Конвертує об'єкт в словник"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'stripe_subscription_id': self.stripe_subscription_id,
            'stripe_customer_id': self.stripe_customer_id,
            'stripe_price_id': self.stripe_price_id,
            'status': self.status,
            'current_period_start': self.current_period_start.isoformat() if self.current_period_start else None,
            'current_period_end': self.current_period_end.isoformat() if self.current_period_end else None,
            'cancel_at_period_end': self.cancel_at_period_end,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_active': self.is_active(),
            'days_remaining': self.days_remaining()
        }
    
    def __repr__(self):
        return f'<Subscription {self.stripe_subscription_id}>'

class UsageLog(db.Model):
    """Модель логу використання"""
    __tablename__ = 'usage_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_id = db.Column(db.String(255), index=True)
    
    # Дані про обробку
    photos_processed = db.Column(db.Integer, default=0)
    photos_with_errors = db.Column(db.Integer, default=0)
    photos_skipped = db.Column(db.Integer, default=0)
    processing_time = db.Column(db.Float)  # в секундах
    total_file_size = db.Column(db.BigInteger)  # в байтах
    
    # Налаштування обробки
    processing_mode = db.Column(db.String(20))  # copy, move
    sort_criteria = db.Column(db.String(50))  # date_taken, date_modified, file_size, camera
    create_subfolders = db.Column(db.Boolean, default=True)
    handle_duplicates = db.Column(db.Boolean, default=True)
    
    # Метадані
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    
    def get_success_rate(self):
        """Отримує відсоток успішно оброблених фото"""
        if self.photos_processed == 0:
            return 0
        successful = self.photos_processed - self.photos_with_errors - self.photos_skipped
        return (successful / self.photos_processed) * 100
    
    def get_average_processing_time(self):
        """Отримує середній час обробки одного фото"""
        if self.photos_processed == 0 or not self.processing_time:
            return 0
        return self.processing_time / self.photos_processed
    
    def to_dict(self):
        """Конвертує об'єкт в словник"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'photos_processed': self.photos_processed,
            'photos_with_errors': self.photos_with_errors,
            'photos_skipped': self.photos_skipped,
            'processing_time': self.processing_time,
            'total_file_size': self.total_file_size,
            'processing_mode': self.processing_mode,
            'sort_criteria': self.sort_criteria,
            'create_subfolders': self.create_subfolders,
            'handle_duplicates': self.handle_duplicates,
            'created_at': self.created_at.isoformat(),
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'success_rate': self.get_success_rate(),
            'average_processing_time': self.get_average_processing_time()
        }
    
    def __repr__(self):
        return f'<UsageLog {self.session_id}>'

class Feedback(db.Model):
    """Модель відгуків"""
    __tablename__ = 'feedbacks'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Зміст відгуку
    rating = db.Column(db.Integer)  # 1-5 зірок
    title = db.Column(db.String(200))
    message = db.Column(db.Text)
    category = db.Column(db.String(50))  # bug, feature, general, praise
    
    # Статус
    status = db.Column(db.String(20), default='new')  # new, read, replied, closed
    admin_reply = db.Column(db.Text)
    admin_replied_at = db.Column(db.DateTime)
    
    # Метадані
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Конвертує об'єкт в словник"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'rating': self.rating,
            'title': self.title,
            'message': self.message,
            'category': self.category,
            'status': self.status,
            'admin_reply': self.admin_reply,
            'admin_replied_at': self.admin_replied_at.isoformat() if self.admin_replied_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Feedback {self.id}>'

class SystemStats(db.Model):
    """Модель системної статистики"""
    __tablename__ = 'system_stats'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, unique=True, nullable=False, index=True)
    
    # Статистика користувачів
    total_users = db.Column(db.Integer, default=0)
    new_users = db.Column(db.Integer, default=0)
    active_users = db.Column(db.Integer, default=0)
    premium_users = db.Column(db.Integer, default=0)
    
    # Статистика використання
    total_photos_processed = db.Column(db.Integer, default=0)
    total_processing_time = db.Column(db.Float, default=0.0)
    total_sessions = db.Column(db.Integer, default=0)
    
    # Статистика помилок
    total_errors = db.Column(db.Integer, default=0)
    error_rate = db.Column(db.Float, default=0.0)
    
    # Метадані
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Конвертує об'єкт в словник"""
        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'total_users': self.total_users,
            'new_users': self.new_users,
            'active_users': self.active_users,
            'premium_users': self.premium_users,
            'total_photos_processed': self.total_photos_processed,
            'total_processing_time': self.total_processing_time,
            'total_sessions': self.total_sessions,
            'total_errors': self.total_errors,
            'error_rate': self.error_rate,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<SystemStats {self.date}>'

class ApiKey(db.Model):
    """Модель API ключів"""
    __tablename__ = 'api_keys'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Дані ключа
    key_hash = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    # Права доступу
    can_read = db.Column(db.Boolean, default=True)
    can_write = db.Column(db.Boolean, default=False)
    can_delete = db.Column(db.Boolean, default=False)
    
    # Статус
    is_active = db.Column(db.Boolean, default=True)
    last_used = db.Column(db.DateTime)
    usage_count = db.Column(db.Integer, default=0)
    
    # Метадані
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    
    def is_valid(self):
        """Перевіряє чи дійсний ключ"""
        if not self.is_active:
            return False
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        return True
    
    def to_dict(self):
        """Конвертує об'єкт в словник"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'can_read': self.can_read,
            'can_write': self.can_write,
            'can_delete': self.can_delete,
            'is_active': self.is_active,
            'last_used': self.last_used.isoformat() if self.last_used else None,
            'usage_count': self.usage_count,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_valid': self.is_valid()
        }
    
    def __repr__(self):
        return f'<ApiKey {self.name}>'
