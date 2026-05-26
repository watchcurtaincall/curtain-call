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
    bio: 'Bolanle Austen-Peters is a Nigerian movie director, theatre producer, and lawyer. She is the founder of Terra Kulture, a leading Nigerian arts, culture, and lifestyle center, and the production company Bolanle Austen-Peters Productions (BAP Productions) which pioneered large-scale stage musicals.',
    scenography: [
      { productionId: 'p1', productionTitle: 'Motherland The Musical', role: 'Director / Producer' },
      { productionId: 'p4', productionTitle: 'Fela and the Kalakuta Queens', role: 'Director / Producer' },
      { productionId: 'p8', productionTitle: 'Saro The Musical', role: 'Director / Producer' }
    ],
    career: 'Bolanle Austen-Peters is a pivotal figure in the contemporary West African theatrical renaissance. In 2013, she founded BAP Productions, a powerhouse that changed the commercial landscape of Nigerian theatre by staging high-budget, broadway-grade musical ensembles celebrating legendary African figures and historical milestones.',
    style: 'Her directing style is marked by grand scale scale visual arrangements, spectacular costuming, large-ensemble dance routines, and high-energy Afrobeat orchestration, making her musicals instantly recognizable global cultural phenomena.',
    achievements: [
      'Pioneered premium commercial musical theatre in Nigeria',
      'Staged global tours of African musicals in London, Pretoria, and Cairo',
      'Honored by the Federal Government for Outstanding Cultural Legacy Development'
    ]
  },
  {
    id: 'a2',
    name: 'Wole Soyinka',
    roleType: 'Playwright / Nobel Laureate',
    headshotUrl: '/images/wole_soyinka_headshot_real.png',
    bio: 'Akinwande Oluwole Babatunde Soyinka, known as Wole Soyinka, is a Nigerian playwright, novelist, poet, and essayist in the English language. He was awarded the 1986 Nobel Prize in Literature, the first sub-Saharan African to be honored in that category, for works like Death and the King\'s Horseman.',
    scenography: [
      { productionId: 'p6', productionTitle: 'Death and the King\'s Horseman', role: 'Playwright' },
      { productionId: 'p9', productionTitle: 'The Lion and the Jewel', role: 'Playwright' }
    ],
    career: 'Wole Soyinka has spent over six decades at the absolute pinnacle of global literature and drama. Educated at University College Ibadan and the University of Leeds, his plays have been performed worldwide, establishing him as one of the most intellectually fierce and creatively sublime voices in post-colonial literature.',
    style: 'His plays utilize rich Yoruba cosmology, complex political satire, ritual dance-dramas, and high-style poetic English to investigate themes of individual honor, colonial friction, and the cosmic transition between life and death.',
    achievements: [
      'Awarded the Nobel Prize in Literature in 1986',
      'Commander of the Federal Republic (CFR) of Nigeria',
      'Founder of the Orisun Theatre Company and prominent civil rights advocate'
    ]
  },
  {
    id: 'a3',
    name: 'Joke Silva',
    roleType: 'Actor / Director',
    headshotUrl: '/images/joke_silva_headshot_real.png',
    bio: 'Joke Silva, MFR is a legendary Nigerian actress, director, and businesswoman. She has starred in numerous stage plays and films, co-founded the Lufodo Academy of Performing Arts, and is widely regarded as the matriarch of modern Nigerian stage and screen.',
    scenography: [
      { productionId: 'p7', productionTitle: 'Hear Word! Naija Woman Talk True', role: 'Lead Actor' }
    ],
    career: 'Joke Silva graduated from the Webber Douglas Academy of Dramatic Art in London and the University of Lagos. Across four decades of theatrical performance, her immense vocal clarity and emotional depth have anchored some of the most influential dramatic stage ensembles in West African history.',
    style: 'Renowned for intense dramatic realism, pristine elocution, and profound maternal gravity, her stage roles present complex, strong-willed female leads fighting for equity and systemic reform.',
    achievements: [
      'Member of the Order of the Federal Republic (MFR)',
      'Co-founder of the Lufodo Group and Academy of Performing Arts',
      'Recipient of multiple Lifetime Achievement Awards for Stage and Screen Performance'
    ]
  },
  {
    id: 'a4',
    name: 'Lola Shoneyin',
    roleType: 'Playwright / Novelist / Poet',
    headshotUrl: '/images/lola_shoneyin_headshot_real.png',
    bio: 'Titilola Atinuke Alexandrah Shoneyin, known as Lola Shoneyin, is a prominent Nigerian poet and novelist. She is the author of the critically acclaimed novel The Secret Lives of Baba Segi\'s Wives, which was adapted into a highly successful international stage play.',
    scenography: [
      { productionId: 'p5', productionTitle: 'Baba Segi\'s Wives', role: 'Playwright / Original Author' }
    ],
    career: 'Lola Shoneyin has gained international renown for her literature dissecting Nigerian domestic life. Her landmark novel, The Secret Lives of Baba Segi\'s Wives, was adapted for the stage by Rotimi Babatunde and has been produced across Nigeria, the UK, and Germany to sold-out audiences.',
    style: 'Her writing style is defined by sharp wit, unflinching humor, subversion of domestic patriarchies, and rich, relatable character monologues that resonate powerfully with diverse audiences.',
    achievements: [
      'Authored the internationally acclaimed and bestselling novel Baba Segi\'s Wives',
      'Director of the Aké Arts and Book Festival, promoting African cultural discourse',
      'Produced globally recognized theatrical adaptations of African literature'
    ]
  },
  {
    id: 'a5',
    name: 'Femi Odugbemi',
    roleType: 'Director / Producer / Filmmaker',
    headshotUrl: '/images/femi_odugbemi_headshot_real.png',
    bio: 'Femi Odugbemi is a Nigerian documentary filmmaker, screen producer, writer, director, and photographer. He is the co-founder of the iRepresent International Documentary Film Festival and a voting member of the Academy of Motion Picture Arts and Sciences (Oscars).',
    scenography: []
  },
  {
    id: 'a6',
    name: 'Temi Otedola',
    roleType: 'Actor / Creative',
    headshotUrl: '/images/temi_headshot_real.png',
    bio: 'Temi Otedola is a Nigerian actor and creative who made her professional stage debut playing the role of Young Hassana in Bolanle Austen-Peters\' critically acclaimed musical Motherland The Musical.',
    scenography: [
      { productionId: 'p1', productionTitle: 'Motherland The Musical', role: 'Actor (Young Hassana)' }
    ],
    career: 'Temi Otedola transitioned from fashion curation and digital style critique to professional acting in 2020. Her performance in the feature film Citation led to her highly anticipated stage debut in Motherland The Musical, where she demonstrated exceptional vocal and performance capabilities.',
    style: 'Bringing a fresh, earnest, and emotionally raw vulnerability to the stage, her performances capture the optimism and conflicts of contemporary African youth.',
    achievements: [
      'Successfully debuted in major commercial musical theatre at Terra Kulture Arena',
      'Winner of Best Actress in a Leading Role at the African Movie Academy Awards (Citation)'
    ]
  },
  {
    id: 'a7',
    name: 'Uzo Osimkpa',
    roleType: 'Actor / Creative',
    headshotUrl: '/images/uzo_headshot_real.png',
    bio: 'Uzo Osimkpa is a seasoned Nigerian actor known for her powerful stage performances, most notably starring in the groundbreaking ensemble production Hear Word! Naija Woman Talk True.',
    scenography: [
      { productionId: 'p7', productionTitle: 'Hear Word! Naija Woman Talk True', role: 'Actor / Creative' }
    ],
    career: 'Uzo Osimkpa has spent over fifteen years perfecting her craft across television drama and live stage productions in Nigeria. Her participation in Hear Word! has toured international institutions, including Harvard University, bringing global focus to Nigerian feminist stage craft.',
    style: 'Characterized by high physical dynamism, expressive comedic timing, and visceral delivery of serious social monologues, she commands a powerful, versatile presence on stage.',
    achievements: [
      'Performed in international tours of premium Nigerian feminist stage pieces',
      'Celebrated lead actress across numerous high-profile stage comedies and dramas'
    ]
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
