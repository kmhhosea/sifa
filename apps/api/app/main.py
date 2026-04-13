import os
import uuid
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Optional
from contextlib import asynccontextmanager

import bcrypt
import jwt
from fastapi import FastAPI, HTTPException, Depends, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DB_PATH = os.environ.get("DATABASE_PATH", "/data/app.db")
JWT_SECRET = os.environ.get("JWT_SECRET", "sifa-dev-secret-change-in-production")


def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    d = os.path.dirname(DB_PATH)
    if d:
        os.makedirs(d, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS hymn_books (
            id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, short_name TEXT UNIQUE NOT NULL,
            description TEXT, language TEXT DEFAULT 'sw', total_songs INTEGER NOT NULL,
            cover_image_url TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS songs (
            id TEXT PRIMARY KEY, hymn_book_id TEXT NOT NULL REFERENCES hymn_books(id),
            song_number INTEGER NOT NULL, title TEXT NOT NULL, lyrics TEXT NOT NULL,
            category TEXT, theme TEXT, worship_context TEXT, language TEXT DEFAULT 'sw',
            key TEXT, time_signature TEXT, has_chorus INTEGER DEFAULT 0, verse_count INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
            UNIQUE(hymn_book_id, song_number)
        );
        CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
        CREATE INDEX IF NOT EXISTS idx_songs_category ON songs(category);
        CREATE INDEX IF NOT EXISTS idx_songs_theme ON songs(theme);
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
            display_name TEXT NOT NULL, role TEXT DEFAULT 'user', avatar_url TEXT,
            language TEXT DEFAULT 'sw', created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS favorites (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
            created_at TEXT DEFAULT (datetime('now')), UNIQUE(user_id, song_id)
        );
        CREATE TABLE IF NOT EXISTS playlists (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL, description TEXT, is_service_plan INTEGER DEFAULT 0,
            service_date TEXT, notes TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS playlist_items (
            id TEXT PRIMARY KEY, playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
            song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
            position INTEGER NOT NULL, notes TEXT, created_at TEXT DEFAULT (datetime('now')),
            UNIQUE(playlist_id, position)
        );
    """)
    conn.commit()
    conn.close()


def seed_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    existing = conn.execute("SELECT COUNT(*) as c FROM songs").fetchone()["c"]
    if existing > 0:
        conn.close()
        return

    tmw_id = str(uuid.uuid4())
    tzr_id = str(uuid.uuid4())
    conn.execute("INSERT OR IGNORE INTO hymn_books (id, name, short_name, description, language, total_songs) VALUES (?, ?, ?, ?, ?, ?)",
        (tmw_id, "Tumwabudu Mungu Wetu", "TMW", "Kitabu cha nyimbo za ibada za Kikristo.", "sw", 440))
    conn.execute("INSERT OR IGNORE INTO hymn_books (id, name, short_name, description, language, total_songs) VALUES (?, ?, ?, ?, ?, ?)",
        (tzr_id, "Tenzi za Rohoni", "TZR", "Mkusanyiko wa nyimbo za kiroho za sifa na ibada.", "sw", 144))

    tmw = [
        (1, "Mungu Ni Mwema", "1. Mungu ni mwema, Mungu ni mwema,\nMungu ni mwema, ni mwema sana.\n\nKiitikio:\nMungu ni mwema, ni mwema sana.\n\n2. Yesu ni mwema, Yesu ni mwema,\nYesu ni mwema, ni mwema sana.\n\n3. Roho ni mwema, Roho ni mwema,\nRoho ni mwema, ni mwema sana.", "Sifa", "praise", "opening", 1, 3, "C"),
        (2, "Bwana Yesu Karibu", "1. Bwana Yesu karibu, Bwana Yesu karibu,\nTukuabudu, tukuabudu,\nBwana Yesu karibu.\n\n2. Njoo utawale, njoo utawale,\nTukuabudu, tukuabudu,\nNjoo utawale.", "Ibada", "worship", "opening", 0, 2, "D"),
        (3, "Hakuna Mungu Kama Wewe", "1. Hakuna Mungu kama wewe,\nMbinguni na duniani,\nHakuna Mungu kama wewe.\n\nKiitikio:\nHakuna, hakuna, hakuna,\nHakuna Mungu kama wewe.", "Sifa", "praise", "worship", 1, 1, "G"),
        (4, "Ni Nani Kama Bwana", "1. Ni nani kama Bwana,\nNi nani kama Yesu,\nNi nani kama Mfalme wangu,\nHakuna, hakuna!\n\nKiitikio:\nHakuna kama Yesu, hakuna kama Yesu.", "Sifa", "victory", "worship", 1, 1, "A"),
        (5, "Tumsifu Mungu Wetu", "1. Tumsifu Mungu wetu,\nTumsifu kwa furaha,\nYeye ndiye Bwana.\n\nKiitikio:\nTumsifu, tumsifu, tumsifu Mungu wetu.\n\n2. Tumshukuru Bwana,\nKwa wema wake wote.\n\n3. Tuminini Bwana,\nKwa nguvu zake zote.", "Sifa", "praise", "opening", 1, 3, "F"),
        (6, "Ee Bwana Usikie Sala Yangu", "1. Ee Bwana usikie sala yangu,\nNinakuja mbele zako.\n\n2. Ee Bwana unihurumie,\nDhambi zangu ni nyingi.\n\n3. Ee Bwana unitakase,\nNifanye kuwa safi.", "Sala", "prayer", "prayer", 0, 3, "Dm"),
        (7, "Neema Ya Ajabu", "1. Neema ya ajabu, tamu sana,\nIliyoniokoa mimi mwenye dhambi!\nNilikuwa nimepotea, sasa nimepatikana.\n\n2. Neema ilinifundisha kuogopa,\nNeema iliondoa hofu yangu.\n\n3. Kupitia hatari nyingi na taabu,\nNeema imenileta hadi hapa.", "Neema", "grace", "worship", 0, 3, "G"),
        (8, "Msalaba Wa Yesu", "1. Msalaba wa Yesu ndio tumaini langu,\nPale Kalvari aliteseka.\n\nKiitikio:\nMsalaba, msalaba, msalaba wa Yesu.", "Msalaba", "redemption", "communion", 1, 1, "Eb"),
        (9, "Yesu Ni Jiwe Kuu", "1. Yesu ni jiwe kuu la pembeni,\nJuu yake kanisa limejengwa.\n\nKiitikio:\nSimama, simama, kanisa la Bwana simama.", "Kanisa", "church", "worship", 1, 1, "Bb"),
        (10, "Nitaimba Kwa Bwana", "1. Nitaimba kwa Bwana,\nKwa kuwa amenitendea makuu.\n\nKiitikio:\nNitaimba, nitaimba, nitaimba kwa Bwana.\n\n2. Nitacheza kwa Bwana.\n\n3. Nitamsifu Bwana.", "Sifa", "joy", "praise", 1, 3, "D"),
        (11, "Baba Yetu", "1. Baba yetu uliye mbinguni,\nJina lako litukuzwe,\nUfalme wako uje.\n\n2. Utupe leo riziki yetu,\nUtusamehe makosa yetu.\n\n3. Usitutie majaribuni,\nUtuokoe na yule mwovu. Amina.", "Sala", "prayer", "prayer", 0, 3, "C"),
        (12, "Tazama Pendo La Mungu", "1. Tazama pendo la Mungu lilivyo kuu,\nAlimtoa Mwanae wa pekee.\n\nKiitikio:\nPendo la Mungu, pendo la Mungu,\nLilivyo kuu sana!", "Upendo", "love", "worship", 1, 1, "G"),
        (13, "Nimekuja Mbele Zako", "1. Nimekuja mbele zako, Bwana,\nMoyo wangu umejaa sifa.\n\n2. Pokea sifa zangu, Bwana.\n\n3. Nifundishe njia yako, Bwana.", "Ibada", "surrender", "worship", 0, 3, "E"),
        (14, "Nguvu Za Juu", "1. Nguvu za juu zinashuka sasa,\nRoho Mtakatifu anakuja.\n\nKiitikio:\nShuka, shuka, Roho Mtakatifu shuka.", "Roho Mtakatifu", "holy_spirit", "worship", 1, 1, "A"),
        (15, "Yesu Nakupenda", "1. Yesu nakupenda, kwa moyo wangu wote.\n\n2. Yesu nakuabudu, kwa roho yangu yote.\n\n3. Yesu nakufuata, popote uendapo.", "Upendo", "devotion", "worship", 0, 3, "D"),
        (16, "Ee Mungu Nguvu Yetu", "1. Ee Mungu nguvu yetu na ngome yetu,\nMsaada wetu katika shida na taabu.", "Tumaini", "refuge", "worship", 0, 1, "F"),
        (17, "Twende Mbele Kwa Yesu", "1. Twende mbele kwa Yesu,\nYeye ndiye njia yetu.\n\nKiitikio:\nTwende, twende, hatutarudi nyuma!", "Safari", "perseverance", "closing", 1, 1, "Bb"),
        (18, "Utukufu Kwa Mungu", "1. Utukufu kwa Mungu aliye juu,\nNa duniani amani kwa watu.\n\n2. Tunakuabudu, tunakutukuza.", "Ibada", "glory", "opening", 0, 2, "C"),
        (19, "Mimi Ni Mtu Mdogo", "1. Mimi ni mtu mdogo,\nLakini Mungu wangu ni mkubwa.\n\nKiitikio:\nMungu wangu ni mkubwa, ni mkubwa sana!", "Imani", "faith", "worship", 1, 1, "G"),
        (20, "Njoo Kwangu", "1. Njoo kwangu, ninyi nyote msumbukao,\nNami nitawapumzisha.\n\n2. Jifunzeni kwangu.\n\n3. Nira yangu ni laini.", "Faraja", "comfort", "worship", 0, 3, "Eb"),
        (21, "Asante Yesu", "1. Asante Yesu, kwa yote uliyonifanyia.\n\n2. Umeniponya, kutoka dhambi zangu.\n\n3. Umenilinda, katika njia zangu zote.", "Shukrani", "thanksgiving", "thanksgiving", 0, 3, "F"),
        (22, "Siku Njema", "1. Siku njema asubuhi na mapema,\nNimemwona Yesu Bwana wangu.\n\nKiitikio:\nSiku njema, siku njema!", "Furaha", "joy", "opening", 1, 1, "A"),
        (23, "Mchungaji Mwema", "1. Bwana ndiye mchungaji wangu,\nSitapungukiwa na kitu.\n\n2. Huniburudisha nafsi yangu.\n\n3. Nijapopita katika bonde la uvuli wa mauti,\nSitaogopa mabaya.", "Tumaini", "guidance", "worship", 0, 3, "D"),
        (24, "Hosana Mbinguni", "1. Hosana, hosana, hosana mbinguni!\nBwana anakuja, Mfalme wa utukufu.", "Sifa", "triumph", "praise", 0, 1, "G"),
        (25, "Nibadilishe Bwana", "1. Nibadilishe Bwana, nifanye upya.\n\n2. Nijaze Bwana, kwa upendo wako.\n\n3. Nitumie Bwana, katika kazi yako.", "Kujitolea", "transformation", "altar_call", 0, 3, "C"),
    ]

    tzr = [
        (1, "Yesu Ni Wangu", "1. Yesu ni wangu, mimi ni wake,\nAmenikomboa kwa damu yake.\n\nKiitikio:\nYesu ni wangu, mimi ni wake, milele.", "Uhakika", "assurance", "worship", 1, 1, "G"),
        (2, "Nakuamini Bwana", "1. Nakuamini Bwana, kwa moyo wangu wote.\n\n2. Nakuamini Bwana, ingawa sioni.\n\n3. Nakuamini Bwana, katika shida na raha.", "Imani", "trust", "worship", 0, 3, "D"),
        (3, "Mwamba Wangu", "1. Mwamba wangu, ngome yangu,\nWewe ni kimbilio langu.\n\nKiitikio:\nWewe ni mwamba wangu, mwamba wa milele.", "Tumaini", "refuge", "worship", 1, 1, "Bb"),
        (4, "Bwana U Sehemu Yangu", "1. Bwana u sehemu yangu,\nWewe ndiwe yote kwangu.\n\n2. Mipaka yangu imeangukia mahali pazuri.\n\n3. Nimemweka Bwana mbele yangu daima.", "Kuridhika", "contentment", "worship", 0, 3, "E"),
        (5, "Upendo Wa Yesu", "1. Upendo wa Yesu ni wa ajabu,\nHauwezi kupimwa.\n\nKiitikio:\nUpendo, upendo, upendo wa Yesu, ni wa milele.", "Upendo", "love", "worship", 1, 1, "F"),
        (6, "Ni Wewe Peke Yako", "1. Ni wewe peke yako unayestahili sifa.\n\n2. Ni wewe peke yako uliyeumba vyote.\n\n3. Ni wewe peke yako uliyetuokoa.", "Ibada", "worship", "worship", 0, 3, "C"),
        (7, "Roho Mtakatifu Njoo", "1. Roho Mtakatifu njoo, jaza maisha yetu.\n\nKiitikio:\nNjoo Roho, Roho Mtakatifu njoo.", "Roho Mtakatifu", "holy_spirit", "invocation", 1, 1, "Am"),
        (8, "Neno La Mungu", "1. Neno la Mungu ni taa ya miguu yangu.\n\n2. Neno la Mungu ni hai na lenye nguvu.\n\n3. Neno la Mungu litadumu milele.", "Neno", "scripture", "teaching", 0, 3, "D"),
        (9, "Furaha Yangu", "1. Furaha yangu ni Yesu Kristo,\nYeye ni yote kwangu.\n\nKiitikio:\nFuraha, furaha, furaha yangu ni Yesu!", "Furaha", "joy", "praise", 1, 1, "G"),
        (10, "Tutakapokutana", "1. Tutakapokutana huko mbinguni,\nFuraha yetu itakuwa kubwa.\n\n2. Tutakapokutana na wapendwa wetu.\n\n3. Tutaimba wimbo mpya wa ukombozi. Amina.", "Mbingu", "heaven", "closing", 0, 3, "Eb"),
        (11, "Nipe Moyo Safi", "1. Nipe moyo safi, Ee Mungu,\nNa roho mpya uifanye ndani yangu.", "Toba", "repentance", "prayer", 0, 1, "Dm"),
        (12, "Bariki Afrika", "1. Mungu ibariki Afrika,\nUsikie maombi yetu.\n\n2. Ondoa vita na dhuluma.\n\n3. Watoto wake uwalinde.", "Taifa", "nation", "intercession", 0, 3, "F"),
        (13, "Kama Ayala", "1. Kama ayala aioneavyo maji ya kijito,\nNdivyo nafsi yangu inavyokuonea wewe.\n\nKiitikio:\nNafsi yangu inamwonea kiu Mungu aliye hai.", "Kiu", "longing", "worship", 1, 1, "A"),
        (14, "Shukrani Kwa Bwana", "1. Shukrani kwa Bwana, kwa wema wake.\n\n2. Kwa pumzi ya uhai, tunashukuru.\n\n3. Kwa wokovu wa Yesu, tunashukuru.", "Shukrani", "thanksgiving", "thanksgiving", 0, 3, "C"),
        (15, "Msalaba Unanibeba", "1. Msalaba unanibeba kuelekea mbinguni.\n\n2. Msalaba unanifundisha kupenda.\n\n3. Msalaba ni ushindi wangu.", "Msalaba", "cross", "communion", 0, 3, "G"),
    ]

    for s in tmw:
        conn.execute("INSERT OR IGNORE INTO songs (id, hymn_book_id, song_number, title, lyrics, category, theme, worship_context, has_chorus, verse_count, key, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), tmw_id, s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], "sw"))
    for s in tzr:
        conn.execute("INSERT OR IGNORE INTO songs (id, hymn_book_id, song_number, title, lyrics, category, theme, worship_context, has_chorus, verse_count, key, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), tzr_id, s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], "sw"))

    admin_hash = bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode()
    user_hash = bcrypt.hashpw(b"user123", bcrypt.gensalt()).decode()
    conn.execute("INSERT OR IGNORE INTO users (id, email, password_hash, display_name, role, language) VALUES (?, ?, ?, ?, ?, ?)",
        (str(uuid.uuid4()), "admin@sifa.app", admin_hash, "Sifa Admin", "admin", "sw"))
    conn.execute("INSERT OR IGNORE INTO users (id, email, password_hash, display_name, role, language) VALUES (?, ?, ?, ?, ?, ?)",
        (str(uuid.uuid4()), "demo@sifa.app", user_hash, "Demo User", "user", "sw"))
    conn.commit()
    conn.close()


# --------------- Auth Helpers ---------------

def create_token(user_id: str, role: str) -> str:
    payload = {"userId": user_id, "role": role, "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def get_current_user(authorization: Optional[str] = Header(None), db: sqlite3.Connection = Depends(get_db)) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = db.execute("SELECT * FROM users WHERE id = ?", (payload["userId"],)).fetchone()
        if user:
            return dict(user)
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        pass
    return None


def require_auth(authorization: Optional[str] = Header(None), db: sqlite3.Connection = Depends(get_db)) -> dict:
    user = get_current_user(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


# --------------- Pydantic Models ---------------

class RegisterRequest(BaseModel):
    email: str
    password: str
    displayName: str
    language: str = "sw"


class LoginRequest(BaseModel):
    email: str
    password: str


class CreatePlaylistRequest(BaseModel):
    name: str
    description: Optional[str] = None
    isServicePlan: bool = False
    serviceDate: Optional[str] = None
    notes: Optional[str] = None


class AddPlaylistItemRequest(BaseModel):
    songId: str
    position: Optional[int] = None
    notes: Optional[str] = None


# --------------- Helpers ---------------

def format_song(row: dict) -> dict:
    return {
        "id": row["id"], "hymnBookId": row["hymn_book_id"], "songNumber": row["song_number"],
        "title": row["title"], "lyrics": row["lyrics"], "category": row.get("category"),
        "theme": row.get("theme"), "worshipContext": row.get("worship_context"),
        "language": row.get("language", "sw"), "key": row.get("key"),
        "timeSignature": row.get("time_signature"), "hasChorus": bool(row.get("has_chorus", 0)),
        "verseCount": row.get("verse_count", 1),
        "hymnBook": {"id": row.get("book_id") or row.get("hymn_book_id"), "name": row.get("book_name", ""), "shortName": row.get("book_short_name", "")},
    }


def format_song_detail(row: dict) -> dict:
    song = format_song(row)
    song["hymnBook"] = {
        "id": row.get("book_id") or row.get("hymn_book_id"), "name": row.get("book_name", ""),
        "shortName": row.get("book_short_name", ""), "description": row.get("book_description"),
        "language": row.get("book_language"), "totalSongs": row.get("book_total_songs"),
        "coverImageUrl": row.get("book_cover_image_url"),
    }
    song["referenceSources"] = []
    song["generatedAudios"] = []
    song["generatedVideos"] = []
    return song


# --------------- App Lifecycle ---------------

@asynccontextmanager
async def lifespan(app_inst: FastAPI):
    init_db()
    seed_db()
    yield


app = FastAPI(title="Sifa API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------- Health ---------------

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/api/health")
async def api_health():
    return {"status": "ok", "service": "sifa-api", "version": "1.0.0"}


# --------------- Auth Routes ---------------

@app.post("/api/auth/register", status_code=201)
async def register(req: RegisterRequest, db: sqlite3.Connection = Depends(get_db)):
    existing = db.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user_id = str(uuid.uuid4())
    password_hash = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
    db.execute("INSERT INTO users (id, email, password_hash, display_name, role, language) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, req.email, password_hash, req.displayName, "user", req.language))
    db.commit()
    token = create_token(user_id, "user")
    return {"user": {"id": user_id, "email": req.email, "displayName": req.displayName, "role": "user", "language": req.language}, "token": token}


@app.post("/api/auth/login")
async def login(req: LoginRequest, db: sqlite3.Connection = Depends(get_db)):
    user = db.execute("SELECT * FROM users WHERE email = ?", (req.email,)).fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user = dict(user)
    if not bcrypt.checkpw(req.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], user["role"])
    return {"user": {"id": user["id"], "email": user["email"], "displayName": user["display_name"], "role": user["role"], "language": user["language"]}, "token": token}


@app.get("/api/auth/me")
async def get_me(user: dict = Depends(require_auth)):
    return {"user": {"id": user["id"], "email": user["email"], "displayName": user["display_name"], "role": user["role"], "language": user["language"], "avatarUrl": user["avatar_url"], "createdAt": user["created_at"]}}


# --------------- Song Routes ---------------

@app.get("/api/songs/books")
async def list_books(db: sqlite3.Connection = Depends(get_db)):
    books = db.execute("SELECT hb.*, COUNT(s.id) as song_count FROM hymn_books hb LEFT JOIN songs s ON s.hymn_book_id = hb.id GROUP BY hb.id ORDER BY hb.name").fetchall()
    return {"books": [{"id": b["id"], "name": b["name"], "shortName": b["short_name"], "description": b["description"], "language": b["language"], "totalSongs": b["total_songs"], "coverImageUrl": b["cover_image_url"], "_count": {"songs": b["song_count"]}} for b in books]}


@app.get("/api/songs/meta/categories")
async def list_categories(db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT DISTINCT category FROM songs WHERE category IS NOT NULL ORDER BY category").fetchall()
    return {"categories": [r["category"] for r in rows]}


@app.get("/api/songs/meta/themes")
async def list_themes(db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT DISTINCT theme FROM songs WHERE theme IS NOT NULL ORDER BY theme").fetchall()
    return {"themes": [r["theme"] for r in rows]}


@app.get("/api/songs/book/{short_name}/{number}")
async def get_song_by_book_and_number(short_name: str, number: int, db: sqlite3.Connection = Depends(get_db)):
    book = db.execute("SELECT * FROM hymn_books WHERE short_name = ?", (short_name.upper(),)).fetchone()
    if not book:
        raise HTTPException(status_code=404, detail="Hymn book not found")
    song = db.execute("SELECT s.*, hb.name as book_name, hb.short_name as book_short_name FROM songs s JOIN hymn_books hb ON s.hymn_book_id = hb.id WHERE s.hymn_book_id = ? AND s.song_number = ?", (book["id"], number)).fetchone()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return {"song": format_song(dict(song))}


@app.get("/api/songs/{song_id}")
async def get_song(song_id: str, db: sqlite3.Connection = Depends(get_db), user: Optional[dict] = Depends(get_current_user)):
    song = db.execute("SELECT s.*, hb.id as book_id, hb.name as book_name, hb.short_name as book_short_name, hb.description as book_description, hb.language as book_language, hb.total_songs as book_total_songs, hb.cover_image_url as book_cover_image_url FROM songs s JOIN hymn_books hb ON s.hymn_book_id = hb.id WHERE s.id = ?", (song_id,)).fetchone()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    song_dict = format_song_detail(dict(song))
    if user:
        fav = db.execute("SELECT id FROM favorites WHERE user_id = ? AND song_id = ?", (user["id"], song_id)).fetchone()
        song_dict["isFavorite"] = fav is not None
    else:
        song_dict["isFavorite"] = False
    fav_count = db.execute("SELECT COUNT(*) as c FROM favorites WHERE song_id = ?", (song_id,)).fetchone()["c"]
    song_dict["_count"] = {"favorites": fav_count}
    return {"song": song_dict}


@app.get("/api/songs")
async def list_songs(
    bookId: Optional[str] = None, category: Optional[str] = None,
    theme: Optional[str] = None, language: Optional[str] = None,
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=50),
    sort: str = "songNumber", order: str = "asc",
    db: sqlite3.Connection = Depends(get_db),
    user: Optional[dict] = Depends(get_current_user),
):
    valid_sorts = {"songNumber": "s.song_number", "title": "s.title", "createdAt": "s.created_at"}
    sort_col = valid_sorts.get(sort, "s.song_number")
    sort_dir = "DESC" if order == "desc" else "ASC"
    conditions: list[str] = []
    params: list = []
    if bookId:
        conditions.append("s.hymn_book_id = ?")
        params.append(bookId)
    if category:
        conditions.append("s.category = ?")
        params.append(category)
    if theme:
        conditions.append("s.theme = ?")
        params.append(theme)
    if language:
        conditions.append("s.language = ?")
        params.append(language)
    where = "WHERE " + " AND ".join(conditions) if conditions else ""
    offset = (page - 1) * limit
    songs = db.execute(
        f"SELECT s.*, hb.id as book_id, hb.name as book_name, hb.short_name as book_short_name FROM songs s JOIN hymn_books hb ON s.hymn_book_id = hb.id {where} ORDER BY {sort_col} {sort_dir} LIMIT ? OFFSET ?",
        params + [limit, offset],
    ).fetchall()
    total = db.execute(f"SELECT COUNT(*) as c FROM songs s {where}", params).fetchone()["c"]
    result_songs = []
    for s in songs:
        sd = format_song(dict(s))
        if user:
            fav = db.execute("SELECT id FROM favorites WHERE user_id = ? AND song_id = ?", (user["id"], s["id"])).fetchone()
            sd["isFavorite"] = fav is not None
        else:
            sd["isFavorite"] = False
        result_songs.append(sd)
    return {"songs": result_songs, "pagination": {"page": page, "limit": limit, "total": total, "totalPages": -(-total // limit)}}


# --------------- Search Routes ---------------

@app.get("/api/search")
async def search_songs(
    q: str = "", bookId: Optional[str] = None,
    category: Optional[str] = None, theme: Optional[str] = None,
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=50),
    db: sqlite3.Connection = Depends(get_db),
    user: Optional[dict] = Depends(get_current_user),
):
    if not q.strip():
        return {"songs": [], "query": q, "pagination": {"page": 1, "limit": 20, "total": 0, "totalPages": 0}}
    query = q.strip()
    conditions: list[str] = []
    params: list = []
    search_parts: list[str] = []
    try:
        num = int(query)
        if num > 0:
            search_parts.append("s.song_number = ?")
            params.append(num)
    except ValueError:
        pass
    search_parts.append("s.title LIKE ?")
    params.append(f"%{query}%")
    search_parts.append("s.lyrics LIKE ?")
    params.append(f"%{query}%")
    search_parts.append("s.category LIKE ?")
    params.append(f"%{query}%")
    search_parts.append("s.theme LIKE ?")
    params.append(f"%{query}%")
    conditions.append(f"({' OR '.join(search_parts)})")
    if bookId:
        conditions.append("s.hymn_book_id = ?")
        params.append(bookId)
    if category:
        conditions.append("s.category = ?")
        params.append(category)
    if theme:
        conditions.append("s.theme = ?")
        params.append(theme)
    where = "WHERE " + " AND ".join(conditions) if conditions else ""
    offset = (page - 1) * limit
    songs = db.execute(
        f"SELECT s.*, hb.id as book_id, hb.name as book_name, hb.short_name as book_short_name FROM songs s JOIN hymn_books hb ON s.hymn_book_id = hb.id {where} ORDER BY s.song_number ASC LIMIT ? OFFSET ?",
        params + [limit, offset],
    ).fetchall()
    total = db.execute(f"SELECT COUNT(*) as c FROM songs s {where}", params).fetchone()["c"]
    result_songs = []
    for s in songs:
        sd = format_song(dict(s))
        if user:
            fav = db.execute("SELECT id FROM favorites WHERE user_id = ? AND song_id = ?", (user["id"], s["id"])).fetchone()
            sd["isFavorite"] = fav is not None
        else:
            sd["isFavorite"] = False
        result_songs.append(sd)
    return {"songs": result_songs, "query": query, "pagination": {"page": page, "limit": limit, "total": total, "totalPages": -(-total // limit)}}


# --------------- Favorites Routes ---------------

@app.get("/api/favorites")
async def list_favorites(
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=50),
    db: sqlite3.Connection = Depends(get_db), user: dict = Depends(require_auth),
):
    offset = (page - 1) * limit
    favorites = db.execute(
        "SELECT f.id as fav_id, f.created_at as fav_created_at, s.*, hb.id as book_id, hb.name as book_name, hb.short_name as book_short_name FROM favorites f JOIN songs s ON f.song_id = s.id JOIN hymn_books hb ON s.hymn_book_id = hb.id WHERE f.user_id = ? ORDER BY f.created_at DESC LIMIT ? OFFSET ?",
        (user["id"], limit, offset),
    ).fetchall()
    total = db.execute("SELECT COUNT(*) as c FROM favorites WHERE user_id = ?", (user["id"],)).fetchone()["c"]
    result = []
    for f in favorites:
        fd = dict(f)
        song = format_song(fd)
        song["isFavorite"] = True
        result.append({"id": fd["fav_id"], "song": song, "createdAt": fd["fav_created_at"]})
    return {"favorites": result, "pagination": {"page": page, "limit": limit, "total": total, "totalPages": -(-total // limit)}}


@app.post("/api/favorites/{song_id}")
async def toggle_favorite(song_id: str, db: sqlite3.Connection = Depends(get_db), user: dict = Depends(require_auth)):
    song = db.execute("SELECT id FROM songs WHERE id = ?", (song_id,)).fetchone()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    existing = db.execute("SELECT id FROM favorites WHERE user_id = ? AND song_id = ?", (user["id"], song_id)).fetchone()
    if existing:
        db.execute("DELETE FROM favorites WHERE id = ?", (existing["id"],))
        db.commit()
        return {"isFavorite": False, "message": "Removed from favorites"}
    else:
        db.execute("INSERT INTO favorites (id, user_id, song_id) VALUES (?, ?, ?)", (str(uuid.uuid4()), user["id"], song_id))
        db.commit()
        return {"isFavorite": True, "message": "Added to favorites"}


# --------------- Playlist Routes ---------------

@app.get("/api/playlists")
async def list_playlists(db: sqlite3.Connection = Depends(get_db), user: dict = Depends(require_auth)):
    playlists = db.execute(
        "SELECT p.*, COUNT(pi.id) as item_count FROM playlists p LEFT JOIN playlist_items pi ON pi.playlist_id = p.id WHERE p.user_id = ? GROUP BY p.id ORDER BY p.updated_at DESC",
        (user["id"],),
    ).fetchall()
    return {"playlists": [{"id": p["id"], "name": p["name"], "description": p["description"], "isServicePlan": bool(p["is_service_plan"]), "serviceDate": p["service_date"], "notes": p["notes"], "createdAt": p["created_at"], "updatedAt": p["updated_at"], "_count": {"items": p["item_count"]}} for p in playlists]}


@app.post("/api/playlists", status_code=201)
async def create_playlist(req: CreatePlaylistRequest, db: sqlite3.Connection = Depends(get_db), user: dict = Depends(require_auth)):
    playlist_id = str(uuid.uuid4())
    db.execute(
        "INSERT INTO playlists (id, user_id, name, description, is_service_plan, service_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (playlist_id, user["id"], req.name, req.description, int(req.isServicePlan), req.serviceDate, req.notes),
    )
    db.commit()
    return {"playlist": {"id": playlist_id, "name": req.name, "description": req.description}}


@app.get("/api/playlists/{playlist_id}")
async def get_playlist(playlist_id: str, db: sqlite3.Connection = Depends(get_db), user: dict = Depends(require_auth)):
    playlist = db.execute("SELECT * FROM playlists WHERE id = ? AND user_id = ?", (playlist_id, user["id"])).fetchone()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    items = db.execute(
        "SELECT pi.*, s.*, hb.name as book_name, hb.short_name as book_short_name FROM playlist_items pi JOIN songs s ON pi.song_id = s.id JOIN hymn_books hb ON s.hymn_book_id = hb.id WHERE pi.playlist_id = ? ORDER BY pi.position",
        (playlist_id,),
    ).fetchall()
    return {"playlist": {**dict(playlist), "items": [{"id": i["id"], "position": i["position"], "notes": i["notes"], "song": format_song(dict(i))} for i in items]}}


@app.post("/api/playlists/{playlist_id}/items", status_code=201)
async def add_playlist_item(playlist_id: str, req: AddPlaylistItemRequest, db: sqlite3.Connection = Depends(get_db), user: dict = Depends(require_auth)):
    playlist = db.execute("SELECT * FROM playlists WHERE id = ? AND user_id = ?", (playlist_id, user["id"])).fetchone()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    if req.position is not None:
        position = req.position
    else:
        count = db.execute("SELECT COUNT(*) as c FROM playlist_items WHERE playlist_id = ?", (playlist_id,)).fetchone()["c"]
        position = count
    item_id = str(uuid.uuid4())
    db.execute(
        "INSERT INTO playlist_items (id, playlist_id, song_id, position, notes) VALUES (?, ?, ?, ?, ?)",
        (item_id, playlist_id, req.songId, position, req.notes),
    )
    db.commit()
    return {"item": {"id": item_id, "songId": req.songId, "position": position}}


@app.delete("/api/playlists/{playlist_id}")
async def delete_playlist(playlist_id: str, db: sqlite3.Connection = Depends(get_db), user: dict = Depends(require_auth)):
    playlist = db.execute("SELECT * FROM playlists WHERE id = ? AND user_id = ?", (playlist_id, user["id"])).fetchone()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    db.execute("DELETE FROM playlists WHERE id = ?", (playlist_id,))
    db.commit()
    return {"message": "Playlist deleted"}
