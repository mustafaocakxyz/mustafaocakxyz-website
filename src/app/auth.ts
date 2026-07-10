export type AppRole = 'student' | 'admin';

export type AppUser = {
  id: string;
  username: string;
  password: string;
  role: AppRole;
  displayName: string;
};

export const FAKE_USERS: AppUser[] = [
  {
    id: 'student-1',
    username: 'ogrenci',
    password: 'ogrenci123',
    role: 'student',
    displayName: 'Ayşe Yılmaz',
  },
  {
    id: 'admin-1',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    displayName: 'Mustafa Ocak',
  },
];

export function authenticate(username: string, password: string): AppUser | null {
  const normalized = username.trim().toLowerCase();
  const user = FAKE_USERS.find(
    (entry) => entry.username.toLowerCase() === normalized && entry.password === password,
  );
  return user ?? null;
}
