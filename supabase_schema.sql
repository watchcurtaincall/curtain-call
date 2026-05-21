-- ========================================================
-- CURTAIN CALL - SUPABASE SQL SCHEMA & MOCK SEEDING
-- ========================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. APPROVED CRITICS WHITELIST ──
CREATE TABLE IF NOT EXISTS approved_critics (
    email TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial default approved critics
INSERT INTO approved_critics (email) VALUES
('critic@example.com'),
('editor@example.com'),
('verify@example.com'),
('adaeze@example.com')
ON CONFLICT (email) DO NOTHING;

-- ── 2. CRITIC APPLICATIONS ──
CREATE TABLE IF NOT EXISTS critic_applications (
    id TEXT PRIMARY KEY DEFAULT 'critic_app_' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    publication TEXT,
    link1 TEXT,
    link2 TEXT,
    file_name TEXT,
    curation_status TEXT DEFAULT 'Pending' CHECK (curation_status IN ('Pending', 'Approved', 'Declined')),
    timestamp TEXT DEFAULT CURRENT_DATE::TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. ARTISTS TABLE ──
CREATE TABLE IF NOT EXISTS artists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role_type TEXT NOT NULL,
    headshot_url TEXT,
    bio TEXT,
    date_of_birth TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    submitter_email TEXT,
    curation_status TEXT DEFAULT 'Approved' CHECK (curation_status IN ('Pending', 'Approved', 'Declined')),
    is_deceased BOOLEAN DEFAULT FALSE,
    date_of_death TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed dynamic default artists
INSERT INTO artists (id, name, role_type, headshot_url, bio, curation_status) VALUES
('a1', 'Bolanle Austen-Peters', 'Director / Producer', '/images/bolanle_headshot_real.png', 'Bolanle Austen-Peters is a Nigerian movie director, theatre producer, and lawyer. She is the founder of Terra Kulture, a leading Nigerian arts, culture, and lifestyle center, and the production company Bolanle Austen-Peters Productions (BAP Productions) which pioneered large-scale stage musicals.', 'Approved'),
('a2', 'Wole Soyinka', 'Playwright / Nobel Laureate', '/images/wole_soyinka_headshot_real.png', 'Akinwande Oluwole Babatunde Soyinka, known as Wole Soyinka, is a Nigerian playwright, novelist, poet, and essayist in the English language. He was awarded the 1986 Nobel Prize in Literature, the first sub-Saharan African to be honored in that category, for works like Death and the King''s Horseman.', 'Approved'),
('a3', 'Joke Silva', 'Actor / Director', '/images/joke_silva_headshot_real.png', 'Joke Silva, MFR is a legendary Nigerian actress, director, and businesswoman. She has starred in numerous stage plays and films, co-founded the Lufodo Academy of Performing Arts, and is widely regarded as the matriarch of modern Nigerian stage and screen.', 'Approved'),
('a4', 'Lola Shoneyin', 'Playwright / Novelist / Poet', '/images/lola_shoneyin_headshot_real.png', 'Titilola Atinuke Alexandrah Shoneyin, known as Lola Shoneyin, is a prominent Nigerian poet and novelist. She is the author of the critically acclaimed novel The Secret Lives of Baba Segi''s Wives, which was adapted into a highly successful international stage play.', 'Approved')
ON CONFLICT (id) DO NOTHING;

-- ── 4. PRODUCTIONS TABLE ──
CREATE TABLE IF NOT EXISTS productions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    synopsis TEXT NOT NULL,
    genre TEXT NOT NULL,
    runtime TEXT DEFAULT '120 mins',
    venue TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Currently Showing', 'Coming Soon', 'Past Production')),
    poster_url TEXT,
    critic_score INTEGER,
    audience_score NUMERIC,
    total_reviews INTEGER DEFAULT 0,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    submitter_email TEXT,
    curation_status TEXT DEFAULT 'Approved' CHECK (curation_status IN ('Pending', 'Approved', 'Declined')),
    cast_and_crew JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed dynamic default productions
INSERT INTO productions (id, title, synopsis, genre, runtime, venue, status, poster_url, critic_score, audience_score, total_reviews, gallery_images, cast_and_crew) VALUES
('p1', 'Motherland The Musical', 'A rollercoaster of emotions that chronicles Nigeria''s history—from 1957 to the present—through the lens of romance, politics, and the generational divide. Produced by BAP Productions.', 'Musical', '150 mins', 'Terra Kulture Arena', 'Past Production', '/images/moremi_poster.png', 94, 9.6, 1045, '[]'::jsonb, '[]'::jsonb),
('p2', 'WATERSIDE', 'Set in the Niger Delta, this critically resonant two-hander follows brothers Osarume and Oghenovo whose lives are upended after killing a sacred totem. An emotionally soaking exploration of animism and survival.', 'Drama', '110 mins', 'MUSON Centre', 'Currently Showing', '/images/kurunmi_poster.png', 91, 8.9, 320, '[]'::jsonb, '[]'::jsonb),
('p3', 'Oba Ovonramwen Nogbaisi: The Rising Sun', 'An epic historical play depicting the history of the Benin Kingdom and the British invasion of 1897. Written and directed by William Benson.', 'Historical', '140 mins', 'MUSON Centre', 'Currently Showing', '/images/kings_horseman_poster.png', 88, 9.2, 415, '[]'::jsonb, '[]'::jsonb),
('p4', 'Fela and the Kalakuta Queens', 'A vibrant production chronicling the life of Afrobeat legend Fela Kuti and the remarkable women in his band. A staple BAP production.', 'Musical', '180 mins', 'Terra Kulture Arena', 'Past Production', '/images/fela_poster.png', 96, 9.8, 2150, '[]'::jsonb, '[]'::jsonb),
('p5', 'Baba Segi''s Wives', 'Lola Shoneyin''s acclaimed comedic drama exploring patriarch Baba Segi''s household secrets and modern polygamous lives.', 'Comedy', '120 mins', 'Terra Kulture Arena', 'Currently Showing', '/images/baba_segi_poster.png', 92, 9.4, 830, '[]'::jsonb, '[]'::jsonb),
('p6', 'Death and the King''s Horseman', 'Wole Soyinka''s classic tragedy exploring ritual suicide, cosmic order, and colonial disruption in Yorubaland.', 'Historical', '160 mins', 'National Theatre, Lagos', 'Past Production', '/images/kings_horseman_poster.png', 98, 9.7, 1205, '[]'::jsonb, '[]'::jsonb),
('p7', 'Hear Word! Naija Woman Talk True', 'A groundbreaking performance piece documenting struggles, triumphs, and aspirations of Nigerian women.', 'Drama', '105 mins', 'MUSON Centre', 'Coming Soon', '/images/hear_word_poster.png', 95, 9.3, 612, '[]'::jsonb, '[]'::jsonb),
('p8', 'Saro The Musical', 'An epic theatrical odyssey following four village boys migrating to Lagos in search of dreams, fame, and fortune.', 'Musical', '145 mins', 'Terra Kulture Arena', 'Past Production', '/images/saro_poster.png', 90, 9.1, 950, '[]'::jsonb, '[]'::jsonb),
('p9', 'The Lion and the Jewel', 'Soyinka''s quick-witted, satirical comedy surrounding the rivalry of village chief Baroka and progressive schoolteacher Lakunle for beautiful Sidi.', 'Comedy', '95 mins', 'Arts Theatre, Ibadan', 'Coming Soon', '/images/lion_jewel_poster.png', 89, 9.0, 185, '[]'::jsonb, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ── 5. ARTICLES TABLE (EDITORIALS) ──
CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    date TEXT NOT NULL,
    author TEXT NOT NULL,
    image_url TEXT,
    content TEXT,
    submitter_email TEXT,
    curation_status TEXT DEFAULT 'Approved' CHECK (curation_status IN ('Pending', 'Approved', 'Declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed dynamic default articles
INSERT INTO articles (id, title, excerpt, date, author, image_url) VALUES
('art1', 'The Renaissance of Nigerian Historical Epics on Stage', 'How directors like William Benson and Bolanle Austen-Peters are redefining how we consume pre-colonial African history.', 'May 18, 2026', 'Curtain Call Editorial', '/images/kings_horseman_poster.png'),
('art2', 'Interview: Joshua Alabi on Directing WATERSIDE', 'The award-winning director breaks down the intense emotional process of staging the critically acclaimed two-hander.', 'May 12, 2026', 'Curtain Call Editorial', '/images/kurunmi_poster.png'),
('art3', '5 Upcoming Premieres You Cannot Miss This Summer', 'From satirical comedies to full-scale musicals, here is your definitive guide to the Lagos theatre season.', 'May 05, 2026', 'Curtain Call Editorial', '/images/baba_segi_poster.png')
ON CONFLICT (id) DO NOTHING;

-- ── 6. REVIEWS TABLE ──
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    production_id TEXT NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    rating INTEGER NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Critic', 'Audience')),
    headline TEXT,
    date TEXT DEFAULT 'Recently',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial mock reviews
INSERT INTO reviews (id, production_id, author, rating, content, type, headline, date) VALUES
('rev1', 'p2', 'Olusegun Adeniyi', 90, 'An absolutely immersive masterpiece. Joshua Alabi directs with a precision that makes the MUSON center feel like the swamps of the Niger Delta.', 'Critic', 'A Niger Delta Masterpiece', 'May 14, 2026'),
('rev2', 'p2', 'Chinedu Obi', 80, 'The acting is spectacular. A powerful commentary on survival and the spiritual cost of modern environmental disruption.', 'Audience', 'Amazing Performances', 'May 15, 2026')
ON CONFLICT (id) DO NOTHING;

-- Disable Row Level Security (RLS) for simple, unauthenticated anonymous testing operations
ALTER TABLE approved_critics DISABLE ROW LEVEL SECURITY;
ALTER TABLE critic_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE artists DISABLE ROW LEVEL SECURITY;
ALTER TABLE productions DISABLE ROW LEVEL SECURITY;
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
