"""
Photo Sorter WASM - Flask Backend
API сервер для монетизації та управління користувачами
"""

import os
import json
import hashlib
import secrets
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from flask_mail import Mail, Message
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import stripe

# Завантажуємо змінні середовища
load_dotenv()

# Ініціалізація Flask додатку
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app/data/photo_sorter.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', secrets.token_hex(32))
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

# Налаштування Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

# Налаштування пошти
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')

# Ініціалізація розширень
db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)
mail = Mail(app)
CORS(app)

# Моделі бази даних
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_premium = db.Column(db.Boolean, default=False)
    premium_expires = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    usage_count = db.Column(db.Integer, default=0)
    total_photos_processed = db.Column(db.Integer, default=0)
    
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def is_premium_active(self):
        if not self.is_premium:
            return False
        if self.premium_expires and self.premium_expires < datetime.utcnow():
            return False
        return True
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'is_premium': self.is_premium_active(),
            'premium_expires': self.premium_expires.isoformat() if self.premium_expires else None,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'usage_count': self.usage_count,
            'total_photos_processed': self.total_photos_processed
        }

class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    stripe_subscription_id = db.Column(db.String(255), unique=True)
    stripe_customer_id = db.Column(db.String(255))
    status = db.Column(db.String(50), default='active')
    current_period_start = db.Column(db.DateTime)
    current_period_end = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('subscriptions', lazy=True))

class UsageLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    session_id = db.Column(db.String(255))
    photos_processed = db.Column(db.Integer, default=0)
    processing_time = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('usage_logs', lazy=True))

# Декоратор для перевірки преміум статусу
def premium_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not user.is_premium_active():
            return jsonify({'error': 'Преміум підписка потрібна'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Декоратор для обмеження використання
def usage_limit(max_photos=1000):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = get_jwt_identity()
            if user_id:
                user = User.query.get(user_id)
                if user and not user.is_premium_active():
                    # Перевіряємо ліміт для безкоштовних користувачів
                    if user.usage_count >= max_photos:
                        return jsonify({'error': f'Досягнуто ліміт {max_photos} фото на сесію'}), 429
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# API маршрути
@app.route('/api/health', methods=['GET'])
def health_check():
    """Перевірка стану сервера"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/register', methods=['POST'])
def register():
    """Реєстрація нового користувача"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email та пароль обов\'язкові'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Користувач з таким email вже існує'}), 409
        
        user = User(email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Створюємо токен доступу
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'Користувач успішно зареєстрований',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Вхід користувача"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email та пароль обов\'язкові'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Невірний email або пароль'}), 401
        
        # Оновлюємо час останнього входу
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Створюємо токен доступу
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'Успішний вхід',
            'access_token': access_token,
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Отримання профілю користувача"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Користувач не знайдений'}), 404
        
        return jsonify({'user': user.to_dict()})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/usage', methods=['POST'])
@jwt_required()
@usage_limit(max_photos=1000)
def log_usage():
    """Логування використання"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Користувач не знайдений'}), 404
        
        photos_processed = data.get('photos_processed', 0)
        processing_time = data.get('processing_time', 0)
        session_id = data.get('session_id', secrets.token_hex(16))
        
        # Оновлюємо статистику користувача
        user.usage_count += photos_processed
        user.total_photos_processed += photos_processed
        
        # Створюємо запис в логі
        usage_log = UsageLog(
            user_id=user_id,
            session_id=session_id,
            photos_processed=photos_processed,
            processing_time=processing_time
        )
        
        db.session.add(usage_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Використання залоговано',
            'usage_count': user.usage_count,
            'total_photos_processed': user.total_photos_processed
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/subscription/create', methods=['POST'])
@jwt_required()
def create_subscription():
    """Створення підписки"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Користувач не знайдений'}), 404
        
        # Створюємо Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': os.environ.get('STRIPE_PRICE_ID', 'price_1234567890'),
                'quantity': 1,
            }],
            mode='subscription',
            success_url=request.host_url + 'success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=request.host_url + 'cancel',
            customer_email=user.email,
            metadata={
                'user_id': str(user_id)
            }
        )
        
        return jsonify({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/subscription/webhook', methods=['POST'])
def stripe_webhook():
    """Webhook для обробки подій Stripe"""
    try:
        payload = request.get_data()
        sig_header = request.headers.get('Stripe-Signature')
        endpoint_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
        
        if endpoint_secret:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        else:
            event = json.loads(payload)
        
        # Обробляємо різні типи подій
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            user_id = int(session['metadata']['user_id'])
            
            # Оновлюємо статус користувача
            user = User.query.get(user_id)
            if user:
                user.is_premium = True
                user.premium_expires = datetime.utcnow() + timedelta(days=30)
                db.session.commit()
        
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            stripe_subscription_id = subscription['id']
            
            # Знаходимо підписку в базі даних
            db_subscription = Subscription.query.filter_by(
                stripe_subscription_id=stripe_subscription_id
            ).first()
            
            if db_subscription:
                # Оновлюємо статус користувача
                user = db_subscription.user
                user.is_premium = False
                user.premium_expires = None
                db_subscription.status = 'cancelled'
                db.session.commit()
        
        return jsonify({'status': 'success'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/subscription/status', methods=['GET'])
@jwt_required()
def get_subscription_status():
    """Отримання статусу підписки"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Користувач не знайдений'}), 404
        
        return jsonify({
            'is_premium': user.is_premium_active(),
            'premium_expires': user.premium_expires.isoformat() if user.premium_expires else None,
            'usage_count': user.usage_count,
            'total_photos_processed': user.total_photos_processed
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/statistics', methods=['GET'])
@jwt_required()
def get_statistics():
    """Отримання статистики користувача"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Користувач не знайдений'}), 404
        
        # Отримуємо статистику за останні 30 днів
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_logs = UsageLog.query.filter(
            UsageLog.user_id == user_id,
            UsageLog.created_at >= thirty_days_ago
        ).all()
        
        total_photos = sum(log.photos_processed for log in recent_logs)
        total_time = sum(log.processing_time for log in recent_logs if log.processing_time)
        sessions_count = len(recent_logs)
        
        return jsonify({
            'total_photos_processed': user.total_photos_processed,
            'recent_photos_processed': total_photos,
            'recent_processing_time': total_time,
            'recent_sessions': sessions_count,
            'is_premium': user.is_premium_active(),
            'usage_count': user.usage_count
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/feedback', methods=['POST'])
@jwt_required()
def submit_feedback():
    """Надсилання відгуку"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Користувач не знайдений'}), 404
        
        feedback_text = data.get('feedback', '')
        rating = data.get('rating', 0)
        
        if not feedback_text:
            return jsonify({'error': 'Текст відгуку обов\'язковий'}), 400
        
        # Тут можна додати логіку збереження відгуку в базу даних
        # або надсилання на email
        
        return jsonify({'message': 'Відгук успішно надіслано'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Статичні файли
@app.route('/')
def serve_frontend():
    """Обслуговування фронтенду"""
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Обслуговування статичних файлів"""
    return send_from_directory('../frontend', path)

# Обробка помилок
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Ресурс не знайдено'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Внутрішня помилка сервера'}), 500

@app.errorhandler(413)
def too_large(error):
    return jsonify({'error': 'Файл занадто великий'}), 413

# Ініціалізація бази даних
def create_tables():
    with app.app_context():
        db.create_all()

# Створюємо таблиці при запуску
create_tables()

# Запуск сервера
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5005))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    app.run(host='0.0.0.0', port=port, debug=debug)
