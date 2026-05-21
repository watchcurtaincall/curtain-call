import { Production, Artist } from './types';

export const MOCK_PRODUCTIONS: Production[] = [
  {
    id: 'p1',
    title: 'Motherland The Musical',
    synopsis: 'A rollercoaster of emotions that chronicles Nigeria\'s history—from 1957 to the present—through the lens of romance, politics, and the generational divide. Produced by BAP Productions.',
    genre: 'Musical',
    runtime: '150 mins',
    venue: 'Terra Kulture Arena',
    status: 'Past Production',
    posterUrl: '/images/moremi_poster.png',
    criticScore: 94,
    audienceScore: 9.6,
    totalReviews: 1045,
  },
  {
    id: 'p2',
    title: 'WATERSIDE',
    synopsis: 'Set in the Niger Delta, this critically resonant two-hander follows brothers Osarume and Oghenovo whose lives are upended after killing a sacred totem. An emotionally soaking exploration of animism and survival.',
    genre: 'Drama',
    runtime: '110 mins',
    venue: 'MUSON Centre',
    status: 'Currently Showing',
    posterUrl: '/images/kurunmi_poster.png',
    criticScore: 91,
    audienceScore: 8.9,
    totalReviews: 320,
  },
  {
    id: 'p3',
    title: 'Oba Ovonramwen Nogbaisi: The Rising Sun',
    synopsis: 'An epic historical play depicting the history of the Benin Kingdom and the British invasion of 1897. Written and directed by William Benson.',
    genre: 'Historical',
    runtime: '140 mins',
    venue: 'MUSON Centre',
    status: 'Currently Showing',
    posterUrl: '/images/kings_horseman_poster.png',
    criticScore: 88,
    audienceScore: 9.2,
    totalReviews: 415,
  },
  {
    id: 'p4',
    title: 'Fela and the Kalakuta Queens',
    synopsis: 'A vibrant production chronicling the life of Afrobeat legend Fela Kuti and the remarkable women in his band. A staple BAP production.',
    genre: 'Musical',
    runtime: '180 mins',
    venue: 'Terra Kulture Arena',
    status: 'Past Production',
    posterUrl: '/images/fela_poster.png',
    criticScore: 96,
    audienceScore: 9.8,
    totalReviews: 2150,
  },
  {
    id: 'p5',
    title: 'Baba Segi\'s Wives',
    synopsis: 'Lola Shoneyin\'s acclaimed comedic drama exploring patriarch Baba Segi\'s household secrets and modern polygamous lives.',
    genre: 'Comedy',
    runtime: '120 mins',
    venue: 'Terra Kulture Arena',
    status: 'Currently Showing',
    posterUrl: '/images/baba_segi_poster.png',
    criticScore: 92,
    audienceScore: 9.4,
    totalReviews: 830,
  },
  {
    id: 'p6',
    title: 'Death and the King\'s Horseman',
    synopsis: 'Wole Soyinka\'s classic tragedy exploring ritual suicide, cosmic order, and colonial disruption in Yorubaland.',
    genre: 'Historical',
    runtime: '160 mins',
    venue: 'National Theatre, Lagos',
    status: 'Past Production',
    posterUrl: '/images/kings_horseman_poster.png',
    criticScore: 98,
    audienceScore: 9.7,
    totalReviews: 1205,
  },
  {
    id: 'p7',
    title: 'Hear Word! Naija Woman Talk True',
    synopsis: 'A groundbreaking performance piece documenting struggles, triumphs, and aspirations of Nigerian women.',
    genre: 'Drama',
    runtime: '105 mins',
    venue: 'MUSON Centre',
    status: 'Coming Soon',
    posterUrl: '/images/hear_word_poster.png',
    criticScore: 95,
    audienceScore: 9.3,
    totalReviews: 612,
  },
  {
    id: 'p8',
    title: 'Saro The Musical',
    synopsis: 'An epic theatrical odyssey following four village boys migrating to Lagos in search of dreams, fame, and fortune.',
    genre: 'Musical',
    runtime: '145 mins',
    venue: 'Terra Kulture Arena',
    status: 'Past Production',
    posterUrl: '/images/saro_poster.png',
    criticScore: 90,
    audienceScore: 9.1,
    totalReviews: 950,
  },
  {
    id: 'p9',
    title: 'The Lion and the Jewel',
    synopsis: 'Soyinka\'s quick-witted, satirical comedy surrounding the rivalry of village chief Baroka and progressive schoolteacher Lakunle for beautiful Sidi.',
    genre: 'Comedy',
    runtime: '95 mins',
    venue: 'Arts Theatre, Ibadan',
    status: 'Coming Soon',
    posterUrl: '/images/lion_jewel_poster.png',
    criticScore: 89,
    audienceScore: 9.0,
    totalReviews: 185,
  }
];

export const MOCK_ARTISTS: Artist[] = [
  {
    id: 'a1',
    name: 'Bolanle Austen-Peters',
    roleType: 'Director / Producer',
    headshotUrl: '/images/bolanle_headshot_real.png',
    bio: 'Bolanle Austen-Peters is a Nigerian movie director, theatre producer, and lawyer. She is the founder of Terra Kulture, a leading Nigerian arts, culture, and lifestyle center, and the production company Bolanle Austen-Peters Productions (BAP Productions) which pioneered large-scale stage musicals.'
  },
  {
    id: 'a2',
    name: 'Wole Soyinka',
    roleType: 'Playwright / Nobel Laureate',
    headshotUrl: '/images/wole_soyinka_headshot_real.png',
    bio: 'Akinwande Oluwole Babatunde Soyinka, known as Wole Soyinka, is a Nigerian playwright, novelist, poet, and essayist in the English language. He was awarded the 1986 Nobel Prize in Literature, the first sub-Saharan African to be honored in that category, for works like Death and the King\'s Horseman.'
  },
  {
    id: 'a3',
    name: 'Joke Silva',
    roleType: 'Actor / Director',
    headshotUrl: '/images/joke_silva_headshot_real.png',
    bio: 'Joke Silva, MFR is a legendary Nigerian actress, director, and businesswoman. She has starred in numerous stage plays and films, co-founded the Lufodo Academy of Performing Arts, and is widely regarded as the matriarch of modern Nigerian stage and screen.'
  },
  {
    id: 'a4',
    name: 'Lola Shoneyin',
    roleType: 'Playwright / Novelist / Poet',
    headshotUrl: '/images/lola_shoneyin_headshot_real.png',
    bio: 'Titilola Atinuke Alexandrah Shoneyin, known as Lola Shoneyin, is a prominent Nigerian poet and novelist. She is the author of the critically acclaimed novel The Secret Lives of Baba Segi\'s Wives, which was adapted into a highly successful international stage play.'
  },
  {
    id: 'a5',
    name: 'Femi Odugbemi',
    roleType: 'Director / Producer / Filmmaker',
    headshotUrl: '/images/femi_odugbemi_headshot_real.png',
    bio: 'Femi Odugbemi is a Nigerian documentary filmmaker, screen producer, writer, director, and photographer. He is the co-founder of the iRepresent International Documentary Film Festival and a voting member of the Academy of Motion Picture Arts and Sciences (Oscars).'
  },
  {
    id: 'a6',
    name: 'Temi Otedola',
    roleType: 'Actor / Creative',
    headshotUrl: '/images/temi_headshot_real.png',
    bio: 'Temi Otedola is a Nigerian actor and creative who made her professional stage debut playing the role of Young Hassana in Bolanle Austen-Peters\' critically acclaimed musical Motherland The Musical.'
  },
  {
    id: 'a7',
    name: 'Uzo Osimkpa',
    roleType: 'Actor / Creative',
    headshotUrl: '/images/uzo_headshot_real.png',
    bio: 'Uzo Osimkpa is a seasoned Nigerian actor known for her powerful stage performances, most notably starring in the groundbreaking ensemble production Hear Word! Naija Woman Talk True.'
  }
];

export const MOCK_REVIEWS = [
  {
    id: 'r1',
    productionId: 'p1', // Motherland
    author: 'BusinessDay Arts',
    rating: 95,
    content: 'A record-breaking premium theatrical experience. The production seamlessly integrates music, dance, lighting, and stage design.',
    type: 'Critic'
  },
  {
    id: 'r2',
    productionId: 'p2', // Waterside
    author: 'Gazelle Africa',
    rating: 90,
    content: 'An emotionally soaking, funny, mystical, and unflinchingly intense exploration of animism and survival. Joshua Alabi directs a masterful two-hander.',
    type: 'Critic'
  },
  {
    id: 'r3',
    productionId: 'p2', // Waterside
    author: 'The Lagos Review',
    rating: 92,
    content: 'A brilliant exploration of Niger Delta folklore. The acting is visceral and immediate.',
    type: 'Critic'
  },
  {
    id: 'r4',
    productionId: 'p2', // Waterside
    author: 'John Doe',
    rating: 85,
    content: 'Very intense play. The two actors gave it their all. The pacing was a bit slow in the middle but the climax was worth it.',
    type: 'Audience',
    date: '2 days ago'
  },
  {
    id: 'r5',
    productionId: 'p2', // Waterside
    author: 'Sarah K.',
    rating: 100,
    content: 'Mind-blowing performance. I have never seen anything like this in Lagos. The staging was minimal but so effective.',
    type: 'Audience',
    date: '1 week ago'
  },
  {
    id: 'r6',
    productionId: 'p1', // Motherland
    author: 'Vanguard Arts',
    rating: 88,
    content: 'A visual spectacle. Some pacing issues in the second act, but overall a triumphant return to form for Bolanle Austen-Peters.',
    type: 'Critic'
  },
  {
    id: 'r7',
    productionId: 'p1', // Motherland
    author: 'Michael B.',
    rating: 90,
    content: 'Took my family to see this and we loved every minute. The costumes were beautiful.',
    type: 'Audience',
    date: '3 weeks ago'
  }
];
