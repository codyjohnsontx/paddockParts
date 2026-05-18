export type SafetyCategory = "green" | "yellow" | "red" | "source_only";
export type Side = "left" | "right" | "front" | "rear" | "universal" | "unknown";
export type UseType = "track" | "race" | "street" | "mixed";
export type AvailabilityStatus =
  | "lend"
  | "sell"
  | "trade"
  | "emergency_only"
  | "private";
export type Visibility = "public_at_event" | "on_request" | "private" | "friends_team";
export type RequestStatus = "open" | "pending" | "resolved" | "cancelled";
export type RequestType = "borrow" | "buy" | "trade" | "help";
export type Urgency = "session_critical" | "today" | "low";
export type ResponseType =
  | "have_this"
  | "may_fit"
  | "have_tools"
  | "vendor_has_one"
  | "do_not_ride";

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  homeTrack?: string;
  profilePhoto?: string;
};

export type Bike = {
  id: string;
  userId: string;
  year: number;
  make: string;
  model: string;
  nickname: string;
  useType: UseType;
  notes: string;
  photos: string[];
};

export type InstalledPart = {
  id: string;
  bikeId: string;
  name: string;
  category: string;
  brand: string;
  partNumber?: string;
  side: Side;
  compatibilityTags: string[];
  notes: string;
  photos: string[];
  safetyCategory: SafetyCategory;
};

export type SparePart = {
  id: string;
  userId: string;
  ownerName: string;
  name: string;
  category: string;
  brand: string;
  partNumber?: string;
  quantity: number;
  condition: string;
  side: Side;
  compatibilityTags: string[];
  availabilityStatus: AvailabilityStatus;
  price?: number;
  depositRequired?: string;
  notes: string;
  photos: string[];
  safetyCategory: SafetyCategory;
  visibility: Visibility;
  visibleAtEvents: string[];
  fitmentAttributes?: Record<string, string | number | boolean>;
};

export type TrackEvent = {
  id: string;
  trackName: string;
  organizer: string;
  startDate: string;
  endDate: string;
  location: string;
  notes: string;
};

export type EventCheckIn = {
  id: string;
  eventId: string;
  userId: string;
  riderName: string;
  paddockLocation?: string;
  visibleInventoryEnabled: boolean;
  checkedInAt: string;
};

export type PartRequest = {
  id: string;
  eventId: string;
  userId: string;
  bikeId: string;
  title: string;
  partNeeded: string;
  category: string;
  urgency: Urgency;
  side: Side;
  description: string;
  photos: string[];
  compatibilityTags: string[];
  status: RequestStatus;
  requestType: RequestType;
  createdAt: string;
  resolvedAt?: string;
};

export type RequestResponse = {
  id: string;
  requestId: string;
  responderUserId: string;
  responderName: string;
  message: string;
  offeredSparePartId?: string;
  responseType: ResponseType;
  createdAt: string;
};

export type PrintableFile = {
  id: string;
  partId: string;
  fileUrl: string;
  fileType: "stl" | "step" | "cad" | "other";
  material: string;
  printTimeEstimate: string;
  printerRequirements: string;
  notes: string;
  safetyCategory: SafetyCategory;
  version: string;
};

export type MatchResult = {
  part: SparePart;
  score: number;
  confidence: "Exact match" | "Likely fit" | "May fit" | "Ask owner to verify";
  reasons: string[];
};
