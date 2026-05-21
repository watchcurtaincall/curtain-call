import { NextResponse } from 'next/server';

// Intelligent helper function to perform search, retrieve biography details,
// and verify if the person/play matches theatrical or film contexts on Wikipedia.
async function performWikipediaCrawl(queryName: string, type: 'artist' | 'play') {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      queryName
    )}&format=json&origin=*&srlimit=10`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const searchResults: { title: string; snippet: string }[] =
      searchData.query?.search ?? [];

    if (searchResults.length === 0) return null;

    // Remove fallback suffixes from name comparison
    const cleanName = queryName
      .replace(/\s+(theatre|film|actor|play|stage|director|writer|producer)$/i, '')
      .toLowerCase()
      .trim();

    const theatreKeywords = [
      'theatre', 'theater', 'play', 'stage', 'drama', 'dramatist', 'playwright',
      'actor', 'actress', 'director', 'film', 'cinema', 'broadway', 'musical',
      'movie', 'show', 'stageplay', 'stageography', 'billing', 'cast', 'opera',
      'screenplay', 'television', 'thespian', 'dramatic', 'performance'
    ];

    let bestResult = null;
    let bestScore = -2000;

    for (const result of searchResults) {
      const titleLower = result.title.toLowerCase();
      const snippetLower = (result.snippet || '').toLowerCase();

      let score = 0;

      // A: Exact title match or direct parenthetical match
      if (titleLower === cleanName) {
        score += 1000;
      } else if (titleLower.startsWith(cleanName + ' (')) {
        score += 900;
      } else if (titleLower.includes(cleanName)) {
        score += 200;
      }

      // B: Match type-specific disambiguation parentheticals
      if (type === 'play') {
        if (
          titleLower.includes('(play)') ||
          titleLower.includes('(theatre)') ||
          titleLower.includes('(musical)') ||
          titleLower.includes('(opera)')
        ) {
          score += 500;
        }
      } else {
        if (
          titleLower.includes('(actor)') ||
          titleLower.includes('(actress)') ||
          titleLower.includes('(director)') ||
          titleLower.includes('(playwright)') ||
          titleLower.includes('(theatre)') ||
          titleLower.includes('(producer)') ||
          titleLower.includes('(thespian)')
        ) {
          score += 500;
        }
      }

      // C: Keyword matches in Wikipedia's search snippet
      const keywordMatches = theatreKeywords.reduce(
        (acc, kw) =>
          acc + (snippetLower.includes(kw) ? 12 : 0) + (titleLower.includes(kw) ? 20 : 0),
        0
      );
      score += keywordMatches;

      // Penalize unrelated or general domains (politicians, sports figures, scientists)
      const generalKeywords = [
        'footballer', 'politician', 'cricketer', 'senator', 'football', 'soccer',
        'athlete', 'physicist', 'chemist', 'rugby', 'hockey', 'baseball', 'governor',
        'parliament', 'congressman', 'album', 'song', 'discography', 'band'
      ];
      const negativeMatches = generalKeywords.reduce(
        (acc, kw) => acc + (snippetLower.includes(kw) ? 200 : 0),
        0
      );
      score -= negativeMatches;

      // Heavy penalty for general disambiguation lists
      if (titleLower.includes('(disambiguation)') || snippetLower.includes('may refer to:')) {
        score -= 3000;
      }

      if (score > bestScore) {
        bestScore = score;
        bestResult = result;
      }
    }

    // Fail if top candidate is clearly unrelated or heavily penalized
    if (!bestResult || bestScore < -500) return null;

    const pageTitle = bestResult.title;

    // Fetch full extract bio and original high-res poster/headshot image
    const detailUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro=1&explaintext=1&piprop=original&titles=${encodeURIComponent(
      pageTitle
    )}&format=json&origin=*`;

    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();
    const pages = detailData.query?.pages;

    if (!pages) return null;

    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    if (pageId === '-1' || !page) return null;

    const fullBio = page.extract || '';
    const bioLower = fullBio.toLowerCase();

    // STRICT VERIFICATION: The summary bio must contain at least one theatre/film keyword
    const isTheatreOrFilm = theatreKeywords.some((kw) => bioLower.includes(kw));
    if (!isTheatreOrFilm) return null;

    return {
      page,
      pageId,
      pageTitle,
      fullBio,
      imageUrl: page.original?.source ?? '',
    };
  } catch {
    return null;
  }
}

// Reliable Wikipedia-based crawl for theatre & film profiles and stage productions.
// Usage:
//   /api/crawl?name=Joke+Silva             → artist profile (default)
//   /api/crawl?name=Death+and+the+King&type=play → play / production details
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const type = searchParams.get('type') || 'artist'; // 'artist' | 'play'

  if (!name) {
    return NextResponse.json(
      { error: 'Provide a name query. Example: /api/crawl?name=Joke+Silva' },
      { status: 400 }
    );
  }

  try {
    // ── TWO-STAGE Targeted Wikipedia crawling strategy ──
    let crawledResult = await performWikipediaCrawl(name, type as 'artist' | 'play');

    // If first direct search yielded a non-theatrical person or failed, attempt search refinement
    if (!crawledResult) {
      const fallbackQuery = type === 'play' ? `${name} play` : `${name} theatre`;
      crawledResult = await performWikipediaCrawl(fallbackQuery, type as 'artist' | 'play');
    }

    if (!crawledResult) {
      const secondaryFallbackQuery = type === 'play' ? `${name} theatre` : `${name} actor`;
      crawledResult = await performWikipediaCrawl(secondaryFallbackQuery, type as 'artist' | 'play');
    }

    // If still failed or unrelated, return verified 404
    if (!crawledResult) {
      return NextResponse.json(
        {
          error: `Could not find a verified ${
            type === 'play' ? 'stage play' : 'theatre/film profile'
          } for "${name}" on Wikipedia. Try a more specific name.`,
        },
        { status: 404 }
      );
    }

    const { page, pageId, pageTitle, fullBio, imageUrl } = crawledResult;

    // ── Play details ──
    if (type === 'play') {
      const synopsis = fullBio
        .split('\n')
        .filter((l: string) => l.trim().length > 40)
        .slice(0, 3)
        .join(' ');

      // Infer genre
      const bioLower = fullBio.toLowerCase();
      let genre = 'Drama';
      if (bioLower.includes('comedy') || bioLower.includes('comic')) genre = 'Comedy';
      else if (bioLower.includes('tragedy') || bioLower.includes('tragic')) genre = 'Tragedy';
      else if (bioLower.includes('musical')) genre = 'Musical';
      else if (bioLower.includes('opera')) genre = 'Opera';
      else if (bioLower.includes('satire') || bioLower.includes('satirical')) genre = 'Satire';
      else if (bioLower.includes('epic')) genre = 'Epic Drama';

      // Parse playwright
      const playwrightMatch = fullBio.match(/written by ([A-Z][a-zA-Z\s]+?)(?:\.|,|\n|;)/);
      const playwright = playwrightMatch?.[1]?.trim() ?? '';

      const crawledPlay = {
        source: 'Wikipedia (Verified)',
        wikiPageTitle: pageTitle,
        id: `crawled_play_${pageId}`,
        title: page.title,
        synopsis: synopsis || fullBio.split('\n')[0] || '',
        genre,
        playwright,
        posterUrl: imageUrl, // Empty if none found (triggers profile placeholder icon in UI)
        verifiedSourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(
          pageTitle.replace(/ /g, '_')
        )}`,
      };

      return NextResponse.json({
        success: true,
        message: `Crawled verified play specifications for "${page.title}" from Wikipedia.`,
        data: crawledPlay,
      });
    }

    // ── Artist profile ──
    const bioLower = fullBio.toLowerCase();
    const disciplines: string[] = [];
    if (bioLower.includes('actor') || bioLower.includes('actress')) disciplines.push('Actor');
    if (bioLower.includes('director')) disciplines.push('Director');
    if (bioLower.includes('playwright') || bioLower.includes('dramatist')) disciplines.push('Playwright');
    if (bioLower.includes('producer')) disciplines.push('Producer');
    if (bioLower.includes('set designer') || bioLower.includes('scenic designer'))
      disciplines.push('Set Designer');
    if (bioLower.includes('costume designer')) disciplines.push('Costume Designer');
    const roleType = disciplines.length > 0 ? disciplines.join(' / ') : 'Theatre Maker';

    // Parse DOB using regex patterns
    const parseBirthDate = (bio: string): string => {
      const mo =
        '(January|February|March|April|May|June|July|August|September|October|November|December)';
      const monthIdx = (m: string) =>
        String(
          [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ].indexOf(m.toLowerCase()) + 1
        ).padStart(2, '0');

      const patterns: RegExp[] = [
        new RegExp(`born\\s+(\\d{1,2})\\s+${mo}\\s+(\\d{4})`, 'i'),
        new RegExp(`born\\s+${mo}\\s+(\\d{1,2}),?\\s+(\\d{4})`, 'i'),
        new RegExp(`\\(${mo}\\s+(\\d{1,2}),?\\s+(\\d{4})`, 'i'),
        new RegExp(`\\((\\d{1,2})\\s+${mo}\\s+(\\d{4})`, 'i'),
      ];

      for (const rx of patterns) {
        const m = bio.match(rx);
        if (m) {
          if (rx === patterns[0]) return `${m[3]}-${monthIdx(m[2])}-${m[1].padStart(2, '0')}`;
          if (rx === patterns[1]) return `${m[3]}-${monthIdx(m[1])}-${m[2].padStart(2, '0')}`;
          if (rx === patterns[2]) return `${m[3]}-${monthIdx(m[1])}-${m[2].padStart(2, '0')}`;
          if (rx === patterns[3]) return `${m[3]}-${monthIdx(m[2])}-${m[1].padStart(2, '0')}`;
        }
      }
      return '';
    };

    const crawledArtist = {
      source: 'Wikipedia (Verified)',
      wikiPageTitle: pageTitle,
      id: `crawled_${pageId}`,
      name: page.title,
      roleType,
      headshotUrl: imageUrl, // Empty if none found (triggers profile placeholder icon in UI)
      bio: fullBio.split('\n')[0] || '',
      fullBioDetails: fullBio,
      dateOfBirth: parseBirthDate(fullBio) || undefined,
      verifiedSourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(
        pageTitle.replace(/ /g, '_')
      )}`,
    };

    return NextResponse.json({
      success: true,
      message: `Crawled verified theatrical profile for "${page.title}".`,
      data: crawledArtist,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Crawl engine exception', details: msg }, { status: 500 });
  }
}
