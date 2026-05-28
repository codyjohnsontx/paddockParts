// Centralized demo lookups. Replace with real joins once Supabase reads land.

const OWNER_NAMES: Record<string, string> = {
  "u-marco": "Marco V.",
  "u-jess": "Jess T.",
  "u-owen": "Owen K.",
  "u-sami": "Sami R.",
  "u-ana": "Ana P.",
  "u-jay": "Jay Patel",
  "u-mia": "Mia Torres",
  "u-devon": "Devon S.",
  "u-heru": "Heru Fab",
};

const BIKE_LABELS: Record<string, string> = {
  "u-marco": "2020 Yamaha R6",
  "u-jess": "2017 Ducati 959",
  "u-owen": "2008 Suzuki SV650",
  "u-sami": "2019 Kawasaki ZX-6R",
  "u-ana": "2015 Yamaha R6",
};

export function ownerNameOf(userId: string, fallback = "Rider"): string {
  return OWNER_NAMES[userId] ?? fallback;
}

export function bikeLabelOf(userId: string, fallback = "2020 Yamaha R6"): string {
  return BIKE_LABELS[userId] ?? fallback;
}
