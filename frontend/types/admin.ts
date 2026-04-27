export type DailyCount = { date: string; count: number };

export type UserStats = {
  total: number;
  todayNew: number;
  thisMonthNew: number;
  last30Days: DailyCount[];
  socialCount: number;
  emailCount: number;
};

export type RoomStats = {
  total: number;
  upcoming: number;
  thisMonthNew: number;
  last30Days: DailyCount[];
  byCategory: { category: string | null; count: number }[];
};

export type ScheduleStats = {
  total: number;
  thisMonthCount: number;
  next90Days: DailyCount[];
};

export type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  createdAt: string;
  _count: { roomMembers: number };
};

export type AdminUserListResponse = {
  items: AdminUser[];
  total: number;
};

export type AdminRoomSummary = {
  id: string;
  name: string | null;
  type: string;
  category: string | null;
  coverImage: string | null;
  date: string | null;
  shortDescription: string | null;
};

export type AdminUserDetail = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  description: string | null;
  role: string;
  createdAt: string;
  ownedRooms: AdminRoomSummary[];
  joinedRooms: AdminRoomSummary[];
};

export type AdminRoomListItem = {
  id: string;
  name: string | null;
  type: string;
  category: string | null;
  coverImage: string | null;
  date: string | null;
  shortDescription: string | null;
  createdAt: string;
  _count: { members: number };
  members: {
    role: string;
    user: { id: string; name: string | null; image: string | null };
  }[];
};

export type AdminRoomListResponse = {
  items: AdminRoomListItem[];
  total: number;
};

export type AdminRoomDetail = {
  id: string;
  name: string | null;
  type: string;
  category: string | null;
  coverImage: string | null;
  profileImage: string | null;
  description: string | null;
  shortDescription: string | null;
  memberLimit: number | null;
  address: string | null;
  date: string | null;
  createdAt: string;
  members: {
    id: string;
    role: string;
    createdAt: string;
    user: { id: string; name: string | null; email: string | null; image: string | null };
  }[];
  schedules: { id: string; name: string; time: string }[];
  _count: { messages: number; likes: number };
};

export const CATEGORY_LABELS: Record<string, string> = {
  STUDY: '스터디',
  SPORTS: '스포츠',
  FOOD: '맛집',
  TRAVEL: '여행',
  HOBBY: '취미',
  CULTURE: '문화/예술',
  TECH: 'IT/기술',
  ETC: '기타',
};
