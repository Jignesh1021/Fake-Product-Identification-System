from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import qrcode
import io
import base64
from passlib.context import CryptContext
import jwt
from google.auth.transport import requests
from google.oauth2 import id_token
from blockchain import register_product_on_chain, is_product_registered_on_chain

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "hashnity-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200

security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    company_name: Optional[str] = None
    full_name: Optional[str] = None
    user_type: str = "customer"  # 'customer' or 'manufacturer'

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleTokenRequest(BaseModel):
    token: str
    user_type: Optional[str] = None  # For registration: 'customer' or 'manufacturer'

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    user_type: str = "customer"  # 'customer' or 'manufacturer'
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductRegister(BaseModel):
    name: str = Form(...)
    description: str = Form(...)
    category: str = Form(...)
    manufacturing_date: str = Form(...)
    batch_number: str = Form(...)

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str
    manufacturing_date: str
    batch_number: str
    product_hash: str
    manufacturer_id: str
    manufacturer_email: Optional[str] = None
    manufacturer_company: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    verification_count: int = 0
    first_scan_at: Optional[datetime] = None
    chain_tx: Optional[str] = None  # optional blockchain tx hash
    chain_registered: Optional[bool] = None
    image_url: Optional[str] = None

class VerificationRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str
    product_name: str

class VerificationResponse(BaseModel):
    status: str
    message: str
    product: Optional[Product] = None
    scan_count: int = 0
    chain_registered: Optional[bool] = None

# Utility functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_product_hash(product_data: dict) -> str:
    """Generate SHA-256 hash for product data"""
    hash_string = f"{product_data['name']}{product_data['batch_number']}{product_data['manufacturing_date']}{product_data['category']}"
    return hashlib.sha256(hash_string.encode()).hexdigest()

def generate_qr_code(product_id: str) -> str:
    """Generate QR code and return as base64 string"""
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(product_id)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_str = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    try:
        existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = hash_password(user_data.password)
        user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            company_name=user_data.company_name,
            user_type=user_data.user_type
        )
        
        user_dict = user.model_dump()
        user_dict['hashed_password'] = hashed_password
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        
        result = await db.users.insert_one(user_dict)
        logger.info(f"User registered: {user_data.email} as {user_data.user_type}")
        
        access_token = create_access_token(data={"sub": user.id, "email": user.email})
        return {"access_token": access_token, "token_type": "bearer", "user": user}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    try:
        user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
        if not user or not verify_password(user_data.password, user['hashed_password']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        if user.get('user_type') == 'customer' and user.get('company_name'):
            await db.users.update_one({"email": user['email']}, {"$set": {"user_type": "manufacturer"}})
            user['user_type'] = "manufacturer"
        
        access_token = create_access_token(data={"sub": user['id'], "email": user['email']})
        user_obj = User(**user)
        logger.info(f"User logged in: {user_data.email}")
        return {"access_token": access_token, "token_type": "bearer", "user": user_obj}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")
    user_obj = User(**user)
    return {"access_token": access_token, "token_type": "bearer", "user": user_obj}

@api_router.post("/auth/google")
async def google_login(request: GoogleTokenRequest):
    """Handle Google OAuth login and auto-register if needed"""
    try:
        # Verify the Google token
        google_client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
        
        if not google_client_id:
            raise HTTPException(status_code=500, detail="Google OAuth not configured")
        
        # Verify the token using Google's public certificates
        try:
            idinfo = id_token.verify_oauth2_token(
                request.token, 
                requests.Request(), 
                google_client_id,
                clock_skew_in_seconds=60
            )
            
            # Additional check: ensure token wasn't expired or tampered
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Invalid issuer')
                
        except ValueError as e:
            logging.error(f"Token verification failed: {str(e)}")
            raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")
        except Exception as e:
            logging.error(f"Token verification error: {str(e)}")
            raise HTTPException(status_code=401, detail="Failed to verify Google token")
        
        email = idinfo.get('email')
        name = idinfo.get('name')
        
        if not email:
            raise HTTPException(status_code=400, detail="Could not retrieve email from Google")
        
        # Check if user exists
        user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if not user:
            # Auto-register the user with provided role (default to customer)
            user_type = request.user_type if request.user_type in ['customer', 'manufacturer'] else 'customer'
            user_id = str(uuid.uuid4())
            
            new_user = User(
                id=user_id,
                email=email,
                user_type=user_type,
                company_name=None,
                full_name=name
            )
            
            user_dict = new_user.model_dump()
            user_dict['hashed_password'] = hash_password(str(uuid.uuid4()))  # Random password for OAuth users
            user_dict['created_at'] = user_dict['created_at'].isoformat()
            user_dict['oauth_provider'] = 'google'
            
            await db.users.insert_one(user_dict)
            user = user_dict
            logging.info(f"New user registered via Google OAuth: {email} as {user_type}")
        else:
            # Update OAuth provider if not already set
            update_data = {}
            if 'oauth_provider' not in user:
                update_data["oauth_provider"] = "google"
                
            if user.get('user_type') == 'customer' and user.get('company_name'):
                update_data["user_type"] = "manufacturer"
                user['user_type'] = "manufacturer"
                
            if update_data:
                await db.users.update_one(
                    {"email": email},
                    {"$set": update_data}
                )
        
        # Create access token
        user_id = user.get('id', str(uuid.uuid4()))
        access_token = create_access_token(data={"sub": user_id, "email": email})
        
        # Create user response object
        user_response = {
            'id': user_id,
            'email': email,
            'user_type': user.get('user_type', 'customer'),
            'company_name': user.get('company_name')
        }
        
        return {"access_token": access_token, "token_type": "bearer", "user": user_response}
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Google OAuth error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Google authentication failed: {str(e)}")

@api_router.post("/products/register")
async def register_product(
    name: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    manufacturing_date: str = Form(...),
    batch_number: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    product_dict = {
        "name": name,
        "description": description,
        "category": category,
        "manufacturing_date": manufacturing_date,
        "batch_number": batch_number
    }
    product_hash = generate_product_hash(product_dict)
    
    # Check if product already exists
    existing = await db.products.find_one({"product_hash": product_hash}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Product already registered with same details")
    
    image_url = None
    if image:
        # Save image
        upload_dir = ROOT_DIR / "uploads"
        upload_dir.mkdir(exist_ok=True)
        
        file_extension = Path(image.filename).suffix
        filename = f"{uuid.uuid4()}{file_extension}"
        file_path = upload_dir / filename
        
        with open(file_path, "wb") as buffer:
            content = await image.read()
            buffer.write(content)
        
        image_url = f"/uploads/{filename}"

    product = Product(
        **product_dict,
        product_hash=product_hash,
        manufacturer_id=current_user['id'],
        manufacturer_email=current_user['email'],
        manufacturer_company=current_user['company_name'],
        image_url=image_url
    )
    
    product_doc = product.model_dump()
    product_doc['created_at'] = product_doc['created_at'].isoformat()
    
    await db.products.insert_one(product_doc)
    
    # Optional blockchain registration (Disabled as Frontend MetaMask now handles this)
    # chain_tx = register_product_on_chain(product_hash, product.id, current_user['id'])
    
    # Generate QR code
    qr_code = generate_qr_code(product.id)
    product_response = product.model_dump()
    product_response['chain_tx'] = None # chain_tx

    product_response['qr_code'] = qr_code
    
    return product_response

@api_router.get("/products", response_model=List[Product])
async def get_products(current_user: dict = Depends(get_current_user)):
    products = await db.products.find(
        {"manufacturer_id": current_user['id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    for product in products:
        if isinstance(product['created_at'], str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
        if product.get('first_scan_at') and isinstance(product['first_scan_at'], str):
            product['first_scan_at'] = datetime.fromisoformat(product['first_scan_at'])
    
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({
        "$or": [{"id": product_id}, {"product_hash": product_id}],
        "manufacturer_id": current_user['id']
    }, {"_id": 0})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product['created_at'], str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    if product.get('first_scan_at') and isinstance(product['first_scan_at'], str):
        product['first_scan_at'] = datetime.fromisoformat(product['first_scan_at'])
    
    return product

@api_router.post("/verify/{product_id}", response_model=VerificationResponse)
async def verify_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    
    if not product:
        # Record failed verification
        verification = VerificationRecord(
            product_id=product_id,
            status="fake",
            product_name="Unknown"
        )
        verification_dict = verification.model_dump()
        verification_dict['timestamp'] = verification_dict['timestamp'].isoformat()
        await db.verifications.insert_one(verification_dict)
        
        return VerificationResponse(
            status="fake",
            message="Product not found in registry. This may be a counterfeit item.",
            scan_count=0
        )
    
    # Convert datetime strings to datetime objects
    if isinstance(product['created_at'], str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    if product.get('first_scan_at') and isinstance(product['first_scan_at'], str):
        product['first_scan_at'] = datetime.fromisoformat(product['first_scan_at'])
    
    verification_count = product.get('verification_count', 0)
    chain_registered = is_product_registered_on_chain(product.get('product_hash', ''))
    first_scan = product.get('first_scan_at')
    
    # Update product verification data
    update_data = {
        "verification_count": verification_count + 1
    }
    
    if verification_count == 0:
        # First scan - mark as genuine
        update_data['first_scan_at'] = datetime.now(timezone.utc).isoformat()
        status = "genuine"
        message = "✓ Authentic Product Verified"
    else:
        # Already scanned
        status = "already_scanned"
        message = f"⚠ Warning: This product was already verified {verification_count} time(s)"
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    
    # Record verification
    verification = VerificationRecord(
        product_id=product_id,
        status=status,
        product_name=product['name']
    )
    verification_dict = verification.model_dump()
    verification_dict['timestamp'] = verification_dict['timestamp'].isoformat()
    await db.verifications.insert_one(verification_dict)
    
    product_obj = Product(**product)
    product_obj.chain_registered = chain_registered
    product_obj.verification_count = verification_count + 1
    
    return VerificationResponse(
        status=status,
        message=message,
        product=product_obj,
        scan_count=verification_count + 1,
        chain_registered=chain_registered
    )

@api_router.post("/manufacturer/verify/{product_id}", response_model=Product)
async def manufacturer_verify_product(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({
        "$or": [{"id": product_id}, {"product_hash": product_id}],
        "manufacturer_id": current_user['id']
    }, {"_id": 0})
    
    if not product:
        raise HTTPException(status_code=404, detail="Asset not found in your company registry.")
        
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    if product.get('first_scan_at') and isinstance(product['first_scan_at'], str):
        product['first_scan_at'] = datetime.fromisoformat(product['first_scan_at'])
        
    return product

@api_router.get("/products/{product_id}/history", response_model=List[VerificationRecord])
async def get_verification_history(product_id: str, current_user: dict = Depends(get_current_user)):
    # Verify product belongs to manufacturer
    product = await db.products.find_one(
        {"id": product_id, "manufacturer_id": current_user['id']},
        {"_id": 0}
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    verifications = await db.verifications.find(
        {"product_id": product_id},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(1000)
    
    for verification in verifications:
        if isinstance(verification['timestamp'], str):
            verification['timestamp'] = datetime.fromisoformat(verification['timestamp'])
    
    return verifications

@api_router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    total_products = await db.products.count_documents({"manufacturer_id": current_user['id']})
    
    products = await db.products.find(
        {"manufacturer_id": current_user['id']},
        {"_id": 0, "verification_count": 1}
    ).to_list(1000)
    
    total_scans = sum(p.get('verification_count', 0) for p in products)
    verified_products = sum(1 for p in products if p.get('verification_count', 0) > 0)
    
    return {
        "total_products": total_products,
        "total_scans": total_scans,
        "verified_products": verified_products,
        "unverified_products": total_products - verified_products
    }

# Include router
@api_router.get("/health")
async def health_check():
    """Health check endpoint to verify backend is running"""
    return {"status": "ok", "message": "Backend is running"}

app.include_router(api_router)
app.mount("/uploads", StaticFiles(directory=str(ROOT_DIR / "uploads")), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Uvicorn startup
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
