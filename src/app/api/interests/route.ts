import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { searches } = await req.json();

    if (!searches || !Array.isArray(searches) || searches.length === 0) {
      return NextResponse.json({ error: "Search queries array is required" }, { status: 400 });
    }

    // Comprehensive interest categories covering both academic AND entertainment/lifestyle
    const categories: Record<string, { keywords: string[]; icon: string; color: string }> = {
      "Computer Science & Tech": {
        keywords: ["programming", "coding", "python", "java", "javascript", "algorithm", "data structure", "software", "web development", "app", "database", "api", "react", "node", "html", "css", "machine learning", "ai", "deep learning", "neural", "compiler", "os", "operating system", "devops", "docker", "kubernetes", "flutter", "android", "ios", "swift", "typescript", "rust", "golang", "linux", "github", "vscode", "tech", "chatgpt", "openai", "gemini ai", "prompt engineering", "cybersecurity", "hacking", "ethical hack", "full stack", "frontend", "backend", "cloud computing", "aws", "azure"],
        icon: "💻",
        color: "purple",
      },
      "Mathematics": {
        keywords: ["math", "calculus", "algebra", "geometry", "statistics", "probability", "linear algebra", "differential", "integral", "trigonometry", "number theory", "maths", "equation", "theorem"],
        icon: "📐",
        color: "blue",
      },
      "Science": {
        keywords: ["physics", "quantum", "mechanics", "thermodynamics", "electromagnetism", "optics", "relativity", "particle", "nuclear", "astrophysics", "biology", "cell", "genetics", "evolution", "anatomy", "ecology", "microbiology", "biochemistry", "molecular", "dna", "organism", "chemistry", "organic chemistry", "inorganic", "chemical", "reaction", "element", "compound", "molecule", "periodic table", "acid", "base", "space", "nasa", "astronomy", "planet", "universe", "cosmos", "telescope", "mars", "black hole"],
        icon: "🔬",
        color: "green",
      },
      "Engineering": {
        keywords: ["engineering", "circuit", "electronics", "mechanical", "civil engineering", "electrical", "structural", "material", "fluid", "cad", "autocad", "solidworks", "3d printing", "robotics", "arduino", "raspberry pi", "iot", "embedded", "signal processing"],
        icon: "⚙️",
        color: "orange",
      },
      "Business & Finance": {
        keywords: ["business", "finance", "economics", "marketing", "accounting", "investment", "stock", "entrepreneurship", "management", "strategy", "startup", "crypto", "bitcoin", "trading", "forex", "real estate", "passive income", "money", "wealth", "side hustle", "freelancing", "ecommerce", "dropshipping", "amazon fba", "digital marketing", "seo", "affiliate", "branding"],
        icon: "💼",
        color: "green",
      },
      "Medicine & Health": {
        keywords: ["medical", "health", "disease", "treatment", "anatomy", "pharmacology", "nursing", "surgery", "clinical", "diagnosis", "doctor", "hospital", "patient", "mental health", "therapy", "psychology", "anxiety", "depression", "wellness", "nutrition", "vitamin", "supplement", "diet plan", "weight loss", "skincare", "dermatology", "dental"],
        icon: "🏥",
        color: "red",
      },
      "Movies & TV Shows": {
        keywords: ["movie", "film", "trailer", "review", "cinema", "hollywood", "bollywood", "lollywood", "netflix", "series", "tv show", "drama", "season", "episode", "actor", "actress", "director", "oscar", "imdb", "marvel", "dc", "avengers", "spider-man", "batman", "horror movie", "action movie", "romantic movie", "thriller", "sci-fi", "documentary", "anime movie", "k-drama", "turkish drama", "pakistani drama", "indian drama", "ary digital", "hum tv", "geo tv", "korean drama", "cdrama", "historical drama", "crime series", "web series", "binge", "streaming", "disney", "hbo", "prime video", "hulu", "dubbed", "subtitle"],
        icon: "🎬",
        color: "red",
      },
      "Music": {
        keywords: ["song", "music", "singer", "album", "lyrics", "concert", "playlist", "rap", "hip hop", "pop", "rock", "jazz", "classical music", "beat", "remix", "dj", "spotify", "music video", "ost", "soundtrack", "band", "guitar", "piano", "vocal", "karaoke", "naat", "nasheed", "qawwali", "bollywood songs", "coke studio", "unplugged"],
        icon: "🎵",
        color: "purple",
      },
      "Gaming": {
        keywords: ["game", "gaming", "gamer", "gameplay", "walkthrough", "playthrough", "gta", "minecraft", "fortnite", "pubg", "valorant", "call of duty", "cod", "fifa", "elden ring", "ps5", "xbox", "nintendo", "steam", "esports", "twitch", "streamer", "let's play", "speedrun", "roblox", "among us", "apex legends", "league of legends", "dota", "mobile game", "free fire"],
        icon: "🎮",
        color: "blue",
      },
      "Cooking & Food": {
        keywords: ["recipe", "cooking", "food", "cook", "baking", "kitchen", "chef", "meal", "dinner", "lunch", "breakfast", "dessert", "cake", "biryani", "pizza", "burger", "pasta", "chicken", "bbq", "grill", "restaurant", "street food", "mukbang", "food review", "iftar", "eid recipe", "desi food", "pakistani food", "indian food", "chinese food"],
        icon: "🍳",
        color: "orange",
      },
      "Sports & Fitness": {
        keywords: ["sport", "football", "cricket", "soccer", "basketball", "tennis", "workout", "gym", "exercise", "fitness", "yoga", "running", "bodybuilding", "match", "highlights", "goal", "world cup", "psl", "ipl", "premier league", "champions league", "boxing", "mma", "ufc", "wrestling", "olympics", "athlete", "training", "abs", "cardio", "crossfit"],
        icon: "⚽",
        color: "green",
      },
      "Fashion & Beauty": {
        keywords: ["fashion", "style", "outfit", "clothing", "dress", "makeup", "beauty", "skincare", "hairstyle", "hair", "nail", "cosmetics", "lipstick", "foundation", "tutorial makeup", "grwm", "get ready with me", "ootd", "shopping", "haul", "unboxing", "brand", "zara", "shein", "meesho"],
        icon: "👗",
        color: "purple",
      },
      "Travel & Vlogs": {
        keywords: ["travel", "vlog", "tour", "tourist", "vacation", "trip", "hotel", "flight", "airline", "beach", "mountain", "city tour", "road trip", "backpacking", "explore", "destination", "pakistan travel", "dubai", "turkey", "london", "paris", "new york", "daily vlog", "day in my life", "routine"],
        icon: "✈️",
        color: "blue",
      },
      "Education & Learning": {
        keywords: ["lecture", "tutorial", "course", "class", "lesson", "education", "university", "professor", "academic", "seminar", "workshop", "training", "learning", "teach", "study", "syllabus", "curriculum", "exam", "assignment", "chapter", "module", "school", "college", "test prep", "sat", "gre", "ielts", "toefl", "css exam", "fpsc", "nts", "ecat", "mdcat", "board exam", "past paper", "notes", "o level", "a level", "matric", "fsc", "bsc", "msc"],
        icon: "📚",
        color: "blue",
      },
      "Religion & Spirituality": {
        keywords: ["islam", "quran", "hadith", "sunnah", "prayer", "namaz", "ramadan", "islamic", "mufti", "scholar", "bayan", "dua", "dhikr", "tafseer", "fiqh", "halal", "haram", "jumma", "masjid", "mosque", "bible", "church", "christian", "hindu", "meditation", "spiritual", "faith", "religion", "allah", "prophet", "seerah"],
        icon: "🕌",
        color: "green",
      },
      "News & Politics": {
        keywords: ["news", "breaking news", "politics", "election", "government", "parliament", "prime minister", "president", "protest", "economy", "gdp", "inflation", "geo news", "ary news", "express news", "dawn news", "samaa", "bbc", "cnn", "al jazeera", "current affairs", "debate", "interview", "press conference"],
        icon: "📰",
        color: "red",
      },
      "DIY & How-To": {
        keywords: ["diy", "how to", "tutorial", "hack", "tips", "tricks", "life hack", "repair", "fix", "build", "craft", "handmade", "homemade", "project", "decoration", "home decor", "interior", "gardening", "plant", "cleaning", "organization"],
        icon: "🔧",
        color: "orange",
      },
      "Comedy & Entertainment": {
        keywords: ["funny", "comedy", "meme", "prank", "roast", "standup", "stand up", "joke", "parody", "skit", "vine", "tiktok", "shorts", "viral", "fail", "reaction", "react", "challenge", "try not to laugh", "entertainment", "celebrity", "gossip", "rumor", "scandal"],
        icon: "😂",
        color: "orange",
      },
      "Anime & Cartoons": {
        keywords: ["anime", "manga", "naruto", "one piece", "dragon ball", "attack on titan", "demon slayer", "jujutsu kaisen", "my hero academia", "bleach", "death note", "hunter x hunter", "cartoon", "animated", "animation", "studio ghibli", "crunchyroll", "sub", "dub", "waifu", "otaku", "cosplay"],
        icon: "🎌",
        color: "purple",
      },
      "Languages & Literature": {
        keywords: ["language", "literature", "grammar", "writing", "poetry", "novel", "linguistic", "english", "reading", "vocabulary", "urdu", "arabic", "french", "spanish", "german", "chinese", "japanese", "korean", "learn english", "spoken english", "ielts speaking", "translation", "dictionary", "essay"],
        icon: "📖",
        color: "blue",
      },
      "History & Social Science": {
        keywords: ["history", "political", "geography", "sociology", "anthropology", "philosophy", "culture", "civilization", "archaeology", "ancient", "world war", "ottoman", "mughal", "british", "empire", "dynasty", "independence", "revolution", "historical"],
        icon: "🏛️",
        color: "orange",
      },
      "Art & Design": {
        keywords: ["art", "design", "photography", "drawing", "painting", "graphic design", "illustration", "creative", "photoshop", "illustrator", "figma", "canva", "ui design", "ux", "logo design", "poster", "thumbnail", "editing", "video editing", "premiere", "after effects", "davinci"],
        icon: "🎨",
        color: "red",
      },
    };

    // Analyze searches with smarter matching
    const interestScores: Record<string, { score: number; matchedTerms: string[]; matchedSearches: string[] }> = {};

    for (const [category, { keywords }] of Object.entries(categories)) {
      interestScores[category] = { score: 0, matchedTerms: [], matchedSearches: [] };

      for (const search of searches) {
        const searchLower = search.toLowerCase().trim();
        if (!searchLower) continue;

        let matched = false;
        for (const keyword of keywords) {
          // Use word boundary matching for short keywords to avoid false positives
          let isMatch = false;
          if (keyword.length <= 3) {
            // For very short keywords, require word boundary
            const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
            isMatch = regex.test(searchLower);
          } else {
            isMatch = searchLower.includes(keyword);
          }

          if (isMatch) {
            if (!matched) {
              interestScores[category].score += 1;
              matched = true;
            }
            if (!interestScores[category].matchedTerms.includes(keyword)) {
              interestScores[category].matchedTerms.push(keyword);
            }
          }
        }

        if (matched && !interestScores[category].matchedSearches.includes(search)) {
          interestScores[category].matchedSearches.push(search);
        }
      }
    }

    // Filter and sort
    const interests = Object.entries(interestScores)
      .filter(([, data]) => data.score > 0)
      .sort(([, a], [, b]) => b.score - a.score)
      .map(([category, data]) => ({
        category,
        score: data.score,
        matchedTerms: data.matchedTerms,
        matchedSearches: data.matchedSearches.slice(0, 5), // Top 5 example searches
        percentage: 0,
        icon: categories[category].icon,
        color: categories[category].color,
      }));

    // Calculate percentages relative to total searches
    const totalMatches = interests.reduce((sum, i) => sum + i.score, 0) || 1;
    interests.forEach((i) => {
      i.percentage = Math.round((i.score / totalMatches) * 100);
    });

    return NextResponse.json({ interests, totalSearches: searches.length });
  } catch (error) {
    console.error("Interests error:", error);
    return NextResponse.json({ error: "Failed to analyze interests" }, { status: 500 });
  }
}
