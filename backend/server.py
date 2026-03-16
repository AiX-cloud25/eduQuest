from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret_key')
JWT_ALGORITHM = "HS256"

# Create media directory
MEDIA_DIR = ROOT_DIR / "media"
MEDIA_DIR.mkdir(exist_ok=True)
for subdir in ["videos", "gifs", "images", "pdfs"]:
    (MEDIA_DIR / subdir).mkdir(exist_ok=True)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# ==================== MODELS ====================

class UserBase(BaseModel):
    email: EmailStr
    role: str = "student"  # student or admin

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "student"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    user: UserResponse

class MediaBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    filePath: Optional[str] = None
    url: Optional[str] = None
    sourceType: str = "local"  # local or url
    linkedTo: str  # path like class9/science/biology/chapter14
    linkLevel: str = "chapter"  # chapter or topic
    type: str  # video, gif, image, pdf
    uploadedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))

class MediaCreate(BaseModel):
    title: str
    filePath: Optional[str] = None
    url: Optional[str] = None
    sourceType: str = "local"
    linkedTo: str
    linkLevel: str = "chapter"
    type: str

class ChapterContent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    classId: str
    subject: str
    topic: str
    chapterNumber: int
    title: str
    content: dict  # Full chapter content as structured data

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7  # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user.email,
        "name": user.name,
        "password": hash_password(user.password),
        "role": user.role,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user.email, user.role)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, email=user.email, name=user.name, role=user.role)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"], user["role"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user["id"], email=user["email"], name=user["name"], role=user["role"])
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(id=user["id"], email=user["email"], name=user["name"], role=user["role"])

# ==================== MEDIA ROUTES ====================

@api_router.get("/media", response_model=List[MediaBase])
async def get_all_media(type: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if type:
        query["type"] = type
    media = await db.media.find(query, {"_id": 0}).to_list(1000)
    return media

@api_router.get("/media/{media_id}", response_model=MediaBase)
async def get_media(media_id: str, user: dict = Depends(get_current_user)):
    media = await db.media.find_one({"id": media_id}, {"_id": 0})
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return media

@api_router.post("/media", response_model=MediaBase)
async def create_media(media: MediaCreate, user: dict = Depends(require_admin)):
    media_doc = {
        "id": str(uuid.uuid4()),
        "title": media.title,
        "filePath": media.filePath,
        "url": media.url,
        "sourceType": media.sourceType,
        "linkedTo": media.linkedTo,
        "linkLevel": media.linkLevel,
        "type": media.type,
        "uploadedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d")
    }
    await db.media.insert_one(media_doc)
    return MediaBase(**media_doc)

@api_router.put("/media/{media_id}", response_model=MediaBase)
async def update_media(media_id: str, media: MediaCreate, user: dict = Depends(require_admin)):
    result = await db.media.update_one(
        {"id": media_id},
        {"$set": {
            "title": media.title,
            "filePath": media.filePath,
            "url": media.url,
            "sourceType": media.sourceType,
            "linkedTo": media.linkedTo,
            "linkLevel": media.linkLevel,
            "type": media.type
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Media not found")
    
    updated = await db.media.find_one({"id": media_id}, {"_id": 0})
    return MediaBase(**updated)

@api_router.delete("/media/{media_id}")
async def delete_media(media_id: str, user: dict = Depends(require_admin)):
    result = await db.media.delete_one({"id": media_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Media not found")
    return {"message": "Media deleted successfully"}

@api_router.post("/media/upload")
async def upload_media(
    file: UploadFile = File(...),
    type: str = Form(...),
    title: str = Form(...),
    linkedTo: str = Form(...),
    linkLevel: str = Form("chapter"),
    user: dict = Depends(require_admin)
):
    # Determine directory based on type
    type_dirs = {"video": "videos", "gif": "gifs", "image": "images", "pdf": "pdfs"}
    subdir = type_dirs.get(type, "files")
    
    # Create path based on linkedTo
    path_parts = linkedTo.split("/")
    file_dir = MEDIA_DIR / subdir / "/".join(path_parts)
    file_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_path = file_dir / file.filename
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    relative_path = f"{subdir}/{linkedTo}/{file.filename}"
    
    # Create media record
    media_doc = {
        "id": str(uuid.uuid4()),
        "title": title,
        "filePath": relative_path,
        "url": None,
        "sourceType": "local",
        "linkedTo": linkedTo,
        "linkLevel": linkLevel,
        "type": type,
        "uploadedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d")
    }
    await db.media.insert_one(media_doc)
    return MediaBase(**media_doc)

@api_router.get("/media/by-path/{path:path}")
async def get_media_by_path(path: str, user: dict = Depends(get_current_user)):
    media = await db.media.find({"linkedTo": path}, {"_id": 0}).to_list(100)
    return media

# ==================== CHAPTER CONTENT ====================

CHAPTER_14_CONTENT = {
    "id": "ch14-respiratory-system",
    "classId": "9",
    "subject": "science",
    "topic": "biology",
    "chapterNumber": 14,
    "title": "The Respiratory System",
    "sections": [
        {
            "id": "14.1",
            "slug": "need-for-respiration",
            "title": "14.1 The Need for Respiration",
            "content": [
                {"type": "paragraph", "text": "Respiration is the chemical process of releasing energy by breaking down glucose for carrying out life processes. This chemical breakdown occurs by utilizing oxygen and is represented by the following overall reaction:"},
                {"type": "equation", "text": "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy"},
                {"type": "paragraph", "text": "There are five important points to remember about this chemical reaction in respiration:"},
                {"type": "list", "items": [
                    "This part of respiration, yielding energy, occurs inside the living cells and hence, it is better known as cellular or tissue respiration.",
                    "The breakdown of glucose (C₆H₁₂O₆) to carbon dioxide and water does not occur in a single step but in a series of chemical steps. Some of these steps occur in the cytoplasm of the cell and some inside the mitochondria.",
                    "Each breakdown step is due to a particular enzyme.",
                    "The energy liberated in the breakdown of the glucose molecule is not all in the form of heat, but a large part of it is converted into chemical energy in the form of ATP (adenosine triphosphate).",
                    "The essential steps of cellular respiration are same in plants and animals."
                ]},
                {"type": "callout", "title": "WHY WE NEED ENERGY", "text": "Body cells need energy for a vast variety of activities: Synthesis of proteins from amino acids, Production of enzymes, Contraction of muscles for movement, Conduction of electrical impulse in a nerve cell, Production of new cells by cell division, In keeping the body warm (in warm-blooded animals)."}
            ]
        },
        {
            "id": "14.2",
            "slug": "animals-need-more-energy",
            "title": "14.2 Animals Need More Energy",
            "content": [
                {"type": "paragraph", "text": "The need for production of energy is greater in animals than in plants. This is because animals consume more energy in doing physical work."},
                {"type": "list", "items": [
                    "They have to move about for obtaining food or run away to escape enemies.",
                    "They have to chew their food and have to look after their eggs or young ones, and so on."
                ]},
                {"type": "paragraph", "text": "The birds and mammals including ourselves have also to produce a lot of heat for keeping the body warm. This heat comes through respiration in the cells. The amount of heat to keep the body warm is quite large."},
                {"type": "callout", "title": "Did you know?", "text": "Shivering and clattering of teeth (when one feels too cold) is an emergency activity of the muscle cells to produce extra heat."}
            ]
        },
        {
            "id": "14.3",
            "slug": "glucose-no-alternative",
            "title": "14.3 Glucose Has No Alternative for Respiration",
            "content": [
                {"type": "paragraph", "text": "If the simple carbohydrate (glucose) is not available directly, the cells may break down the proteins or fats to produce glucose for respiratory needs."},
                {"type": "paragraph", "text": "Think for a while about the wild animals which are totally flesh-eaters. The main constituent of their diet is protein with very little carbohydrates. The excess amino acids absorbed through protein-digestion are broken down in the liver to produce sugar (glucose) and the nitrogenous part is converted into urea which gets excreted out."}
            ]
        },
        {
            "id": "14.4",
            "slug": "aerobic-anaerobic",
            "title": "14.4 Two Kinds of Respiration — Aerobic and Anaerobic",
            "content": [
                {"type": "paragraph", "text": "In animals there is normally aerobic respiration using oxygen. Anaerobic respiration (in the absence of oxygen) is only exceptional in some cases as in the tapeworms living inside the human intestines."},
                {"type": "paragraph", "text": "Anaerobic respiration may occur even in our own body in the fast-working skeletal muscles temporarily. During continuous physical exercise as in fast running, walking over long distances, swimming, wrestling, weight-lifting, etc., our muscles work too fast but not getting enough oxygen."},
                {"type": "heading", "text": "Aerobic Respiration in Animals"},
                {"type": "equation", "text": "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 686 kcal/mole"},
                {"type": "paragraph", "text": "The above equation depicts the chemical substances in mole. Thus by taking 180 g of glucose the energy released is 686 kilocalories."},
                {"type": "heading", "text": "Anaerobic Respiration in Animals"},
                {"type": "equation", "text": "C₆H₁₂O₆ → lactic acid + 2ATP + heat energy"},
                {"type": "table", "title": "Table 14.1: Differences in anaerobic respiration in plants and animals", "headers": ["Anaerobic in PLANTS", "Anaerobic in ANIMALS"], "rows": [
                    ["Products of glucose are ethanol and CO₂", "Product of glucose is lactic acid (and no CO₂)"],
                    ["Released heat energy is more", "Released heat energy is less"],
                    ["CO₂ released causes foaming", "No CO₂ released, so no foaming"]
                ]}
            ]
        },
        {
            "id": "14.5",
            "slug": "parts-of-respiration",
            "title": "14.5 Parts of Respiration",
            "content": [
                {"type": "paragraph", "text": "In humans (as in most other animals) there are four major parts of respiration:"},
                {"type": "list", "items": [
                    "Breathing: This is a physical process in which the atmospheric air is taken in and forced out of the oxygen-absorbing organs, the lungs.",
                    "Gaseous transport: The oxygen absorbed by the blood in the lungs is carried by the RBCs as oxyhaemoglobin throughout the body by means of arteries.",
                    "Tissue respiration: The terminal blood vessels, i.e., the capillaries deliver the oxygen to the body cells or tissues where oxygen diffuses through their thin walls.",
                    "Cellular respiration: The complex chemical changes which occur inside the cell to release energy from glucose."
                ]},
                {"type": "callout", "title": "Where does respiration occur in a cell?", "text": "Glycolysis occurs in the cytoplasm (anaerobic, very little energy released). Krebs cycle occurs inside mitochondria (needs oxygen, much energy produced as ATP and CO₂)."}
            ]
        },
        {
            "id": "14.6",
            "slug": "respiratory-organs",
            "title": "14.6 Respiratory Organs (Breathing)",
            "content": [
                {"type": "paragraph", "text": "The respiratory system in humans consists of air passages (nose, pharynx, larynx, trachea, bronchi) and the lungs."},
                {"type": "heading", "text": "The Nose"},
                {"type": "paragraph", "text": "The external part of the nose bears two nostrils separated by a cartilaginous septum. The hairs present in the nostrils prevent large particles from entering the system. The inner lining of the nasal chambers performs three functions: It warms the air, It adds moisture to the air, Its mucous secretion entraps harmful particles."},
                {"type": "heading", "text": "The Pharynx"},
                {"type": "paragraph", "text": "The nasal chambers open at the back into a wide cavity, the pharynx, situated at the back of the mouth. It is a common passage for air and food."},
                {"type": "heading", "text": "The Larynx"},
                {"type": "paragraph", "text": "The larynx or the voice-box (popularly called 'Adam's apple') is a hollow cartilaginous structure located at the start of the windpipe. It contains two ligamentous folds called vocal cords."},
                {"type": "heading", "text": "The Trachea"},
                {"type": "paragraph", "text": "The trachea or the windpipe emerges from the larynx. Its walls are strengthened by C-shaped rings of cartilage."},
                {"type": "heading", "text": "The Bronchi"},
                {"type": "paragraph", "text": "Close to the lungs, the trachea divides into two tubes, called the bronchi, which enter the respective lungs. Bronchioles are the subsequent still finer tubes which ultimately end in a cluster of tiny air chambers called the air sacs or alveoli."},
                {"type": "heading", "text": "The Lungs"},
                {"type": "paragraph", "text": "The lungs are a pair of spongy and elastic organs. The two lungs are roughly cone-shaped, tapering at the top and broad at the bottom. The left lung has two lobes and the right lung has three."},
                {"type": "callout", "title": "Amazing Fact!", "text": "The number of alveoli in the two lungs in an adult human is about 700 million. Total surface area of the alveoli is about 70 square metres — nearly equal to the area of a tennis court!"}
            ]
        },
        {
            "id": "14.7",
            "slug": "breathing-cycle",
            "title": "14.7 Breathing — Respiratory Cycle",
            "content": [
                {"type": "paragraph", "text": "The respiratory cycle consists of inspiration (breathing in), expiration (breathing out) and a very short respiratory pause. In normal adults, the breathing rate is 12-18 breaths per minute."},
                {"type": "heading", "text": "Inspiration (Inhalation)"},
                {"type": "paragraph", "text": "Inspiration is the result of increase in the size of thoracic cavity due to the combined action of the ribs and the diaphragm. The ribs are moved upward and outward due to the contraction of the external intercostal muscles."},
                {"type": "paragraph", "text": "The diaphragm, a sheet of muscular tissue which normally remains arched upward like a dome, contracts and flattens, contributing to the enlargement of the chest cavity lengthwise."},
                {"type": "heading", "text": "Expiration (Exhalation)"},
                {"type": "paragraph", "text": "Expiration is the result of reverse movements of the ribs and diaphragm. The external intercostal muscles relax and the ribs move in automatically. The diaphragm is relaxed and moves upwards to its dome-like outline."},
                {"type": "table", "title": "Table 14.2: Breathing movements in humans", "headers": ["Part", "Inspiration", "Expiration"], "rows": [
                    ["Diaphragm", "Contracts and flattens downwards", "Relaxes and moves upwards"],
                    ["External intercostal muscles", "Contract", "Relax"],
                    ["Rib cage", "Moves upward and outward", "Moves downward and inward"],
                    ["Thoracic cavity", "Increases", "Decreases"],
                    ["Air pressure", "Decreases inside", "Increases inside"]
                ]},
                {"type": "callout", "title": "Control of Breathing", "text": "The breathing movements are largely controlled by a respiratory centre located in the medulla oblongata of the brain. This centre is stimulated by the carbon dioxide content of the blood."}
            ]
        },
        {
            "id": "14.8",
            "slug": "lung-capacities",
            "title": "14.8 Capacities of the Lungs",
            "content": [
                {"type": "paragraph", "text": "Capacities of the lungs or the Respiratory volumes in a normal human adult are approximately as follows:"},
                {"type": "list", "items": [
                    "Tidal volume: Air breathed in and out in normal quiet breathing = 500 mL",
                    "Dead air space: Tidal air left in respiratory passages = 150 mL",
                    "Alveolar air: The tidal air contained in air sacs = 350 mL",
                    "Inspiratory reserve volume: Air that can be drawn in forcibly over and above tidal air = 3000 mL",
                    "Inspiratory capacity: Total volume of air a person can breathe in after normal expiration = 3500 mL",
                    "Expiratory reserve volume: Air that can be forcibly expelled after normal expiration = 1000 mL",
                    "Vital capacity: Volume of air that can be taken in and expelled out by maximum inspiration and expiration = 4500 mL",
                    "Residual volume: Air always left in the lungs even after forcibly breathing out = 1500 mL",
                    "Total lung capacity: Maximum air which can at any time be held in the two lungs = 6000 mL"
                ]}
            ]
        },
        {
            "id": "14.9",
            "slug": "inspired-expired-air",
            "title": "14.9 Inspired Air vs Expired Air",
            "content": [
                {"type": "paragraph", "text": "The air inside the lungs is never replaced completely. It is always a mixture of the air left inside and the air inspired."},
                {"type": "paragraph", "text": "The expired air differs from inspired air in the following respects:"},
                {"type": "list", "items": [
                    "It contains less oxygen (16.4% vs 20.96%)",
                    "It contains more carbon dioxide (4.0% vs 0.04%)",
                    "It contains more water vapour",
                    "It is warmer (at body temperature)",
                    "It may contain some bacteria"
                ]},
                {"type": "table", "title": "Table 14.3: Composition of inspired and expired air", "headers": ["Component", "Inspired air", "Expired air"], "rows": [
                    ["Oxygen", "20.96%", "16.4%"],
                    ["Carbon dioxide", "0.04%", "4.0%"],
                    ["Nitrogen", "79.00%", "79.6%"],
                    ["Water vapour", "Low", "High"],
                    ["Temperature", "Variable", "~37°C"]
                ]}
            ]
        },
        {
            "id": "14.10",
            "slug": "hypoxia",
            "title": "14.10 Hypoxia and Asphyxiation",
            "content": [
                {"type": "heading", "text": "Effect of Altitude on Breathing"},
                {"type": "paragraph", "text": "As we go higher up, the air we breathe in decreases in pressure accompanied by a gradual decrease in oxygen content. At about 4,500 metres above sea level, one may suffer from air sickness, in which lack of oxygen leads to dizziness, unsteady vision, loss of hearing, lack of muscular coordination and even complete blackouts."},
                {"type": "heading", "text": "Hypoxia"},
                {"type": "paragraph", "text": "Hypoxia is the deficiency of oxygen reaching the tissues. It may result due to sitting for long hours in a crowded room with poor ventilation. It may also be experienced at high altitudes where the oxygen content of the air is low."},
                {"type": "heading", "text": "Asphyxiation"},
                {"type": "paragraph", "text": "Asphyxiation is a condition in which the blood becomes more venous by accumulation of more carbon dioxide and the oxygen supply is diminished. This may result due to several causes, such as strangulation, drowning, or any obstruction in the respiratory tract."}
            ]
        },
        {
            "id": "14.11",
            "slug": "experiments",
            "title": "14.11 Some Experiments on Breathing and Respiration",
            "content": [
                {"type": "heading", "text": "Experiment 1: Water Loss During Breathing"},
                {"type": "paragraph", "text": "Gently breathe upon a cold surface such as a piece of glass or slate; the water droplets appearing on the surface prove the presence of moisture in expired air."},
                {"type": "heading", "text": "Experiment 2: CO₂ in Breathing"},
                {"type": "paragraph", "text": "Using lime water in two flasks, one for inspired air and one for expired air, the lime water in the expired air flask turns milky much faster, proving that expired air contains more carbon dioxide."},
                {"type": "heading", "text": "Experiment 3: Diaphragm Action"},
                {"type": "paragraph", "text": "Using a bell jar with a rubber sheet at the bottom and balloons inside, pulling the sheet downward (representing diaphragm contraction) causes the balloons to inflate, demonstrating inspiration."},
                {"type": "heading", "text": "Experiment 4: Measuring Expired Air Volume"},
                {"type": "paragraph", "text": "By blowing into an inverted water-filled container, the displaced water volume equals the volume of expired air."}
            ]
        }
    ],
    "progressChecks": [
        {
            "sectionId": "14.3",
            "questions": [
                "Respiration is a process of releasing _____ for carrying out _____ processes.",
                "Write the overall chemical equation representing respiration.",
                "In what form is the energy liberated in respiration?",
                "Give two examples of life activities which need energy."
            ]
        },
        {
            "sectionId": "14.5",
            "questions": [
                "Is strenuous physical exercise fatigue due to CO₂ accumulation? (T/F)",
                "No CO₂ is produced in anaerobic respiration in the human body. (T/F)",
                "Breathing and gaseous transport are the same thing. (T/F)"
            ]
        }
    ]
}

@api_router.get("/chapters/{class_id}/{subject}/{topic}/{chapter_num}")
async def get_chapter(class_id: str, subject: str, topic: str, chapter_num: int):
    # For now, only Chapter 14 Biology is fully implemented
    if class_id == "9" and subject == "science" and topic == "biology" and chapter_num == 14:
        return CHAPTER_14_CONTENT
    
    # Return placeholder for other chapters
    return {
        "id": f"ch{chapter_num}-placeholder",
        "classId": class_id,
        "subject": subject,
        "topic": topic,
        "chapterNumber": chapter_num,
        "title": f"Chapter {chapter_num}",
        "sections": [
            {
                "id": f"{chapter_num}.1",
                "slug": "introduction",
                "title": f"{chapter_num}.1 Introduction",
                "content": [
                    {"type": "paragraph", "text": "This chapter content is coming soon. Check back later for the full content."}
                ]
            }
        ],
        "progressChecks": []
    }

@api_router.get("/explainers/{path:path}")
async def get_explainer(path: str, user: dict = Depends(get_current_user)):
    """Get explainer media (GIF/image) for a specific topic"""
    media = await db.media.find_one(
        {"linkedTo": path, "type": {"$in": ["gif", "image"]}},
        {"_id": 0}
    )
    return media

# ==================== CURRICULUM DATA ====================

@api_router.get("/curriculum/classes")
async def get_classes():
    classes = []
    for i in range(1, 11):
        classes.append({
            "id": str(i),
            "name": f"Class {i}",
            "hasContent": i == 9  # Only class 9 has full content
        })
    return classes

@api_router.get("/curriculum/subjects/{class_id}")
async def get_subjects(class_id: str):
    return [
        {"id": "science", "name": "Science", "icon": "flask"},
        {"id": "maths", "name": "Mathematics", "icon": "calculator"}
    ]

@api_router.get("/curriculum/topics/{class_id}/{subject_id}")
async def get_topics(class_id: str, subject_id: str):
    if subject_id == "science":
        return [
            {"id": "physics", "name": "Physics"},
            {"id": "chemistry", "name": "Chemistry"},
            {"id": "biology", "name": "Biology"}
        ]
    else:
        return [
            {"id": "linear-equations", "name": "Linear Equations"},
            {"id": "algebra", "name": "Algebra"}
        ]

@api_router.get("/curriculum/chapters/{class_id}/{subject_id}/{topic_id}")
async def get_chapters(class_id: str, subject_id: str, topic_id: str):
    # Return sample chapters, with chapter 14 for biology being fully implemented
    chapters = []
    num_chapters = 15 if topic_id == "biology" else 10
    
    for i in range(1, num_chapters + 1):
        chapter = {
            "id": str(i),
            "number": i,
            "title": f"Chapter {i}",
            "hasFullContent": class_id == "9" and subject_id == "science" and topic_id == "biology" and i == 14
        }
        
        # Add specific title for Chapter 14 Biology
        if topic_id == "biology" and i == 14:
            chapter["title"] = "The Respiratory System"
        
        chapters.append(chapter)
    
    return chapters

# ==================== ROOT ROUTE ====================

@api_router.get("/")
async def root():
    return {"message": "EduQuest API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

# Mount static files for media under /api prefix for proper routing through ingress
app.mount("/api/media", StaticFiles(directory=str(MEDIA_DIR), html=False), name="media")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== STARTUP: SEED DEFAULT ADMIN ====================

@app.on_event("startup")
async def startup_event():
    # Create default admin user if not exists
    admin = await db.users.find_one({"email": "admin@eduquest.com"})
    if not admin:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": "admin@eduquest.com",
            "name": "Admin User",
            "password": hash_password("admin123"),
            "role": "admin",
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        logger.info("Default admin user created: admin@eduquest.com / admin123")
    
    # Seed explainer media entries for Chapter 14
    explainer_topics = [
        {"slug": "need-for-respiration", "title": "Need for Respiration", "concept": "Glucose breaking down to release energy (ATP)"},
        {"slug": "aerobic-anaerobic", "title": "Aerobic vs Anaerobic Respiration", "concept": "Difference between aerobic (with O₂) and anaerobic (without O₂)"},
        {"slug": "parts-of-respiration", "title": "Parts of Respiration", "concept": "Four parts: breathing, gaseous transport, tissue respiration, cellular respiration"},
        {"slug": "respiratory-organs", "title": "Respiratory Organs", "concept": "Path of air: nose → pharynx → trachea → bronchi → alveoli"},
        {"slug": "breathing-cycle", "title": "Breathing Cycle", "concept": "Chest and diaphragm movement during inhalation and exhalation"},
        {"slug": "lung-capacities", "title": "Lung Capacities", "concept": "Different lung volume measurements"},
        {"slug": "inspired-expired-air", "title": "Inspired vs Expired Air", "concept": "Difference in composition between air breathed in and out"},
        {"slug": "hypoxia", "title": "Hypoxia", "concept": "Oxygen levels dropping in blood cells"}
    ]
    
    for topic in explainer_topics:
        path = f"class9/science/biology/chapter14/{topic['slug']}"
        existing = await db.media.find_one({"linkedTo": path, "type": "gif"})
        if not existing:
            media_doc = {
                "id": str(uuid.uuid4()),
                "title": f"{topic['title']} Explainer",
                "filePath": f"gifs/{path}.png",
                "url": None,
                "sourceType": "local",
                "linkedTo": path,
                "linkLevel": "topic",
                "type": "gif",
                "concept": topic["concept"],
                "uploadedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d")
            }
            await db.media.insert_one(media_doc)
    
    logger.info("Chapter 14 explainer media entries seeded")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
