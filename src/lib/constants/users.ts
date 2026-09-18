import { User } from '../types/user';

export const SEEDED_USERS: User[] = [
  {
    id: 'u1',
    name: 'Eslam Al-Mohandes',
    name_ar: 'إسلام المهندس',
    email: 'eslam.almohandes@almespar.com',
    password_hash: 'e820a14d8dc993c223a5c368ad64f02d07765da8d0d7cdc9ad729aa0c75c6dd0', // Es1234
    role: 'sales_engineer',
    avatar_color: '#8FC2F0',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    title: 'Senior Sales Engineer',
    territory: 'Western Region (Jeddah, Makkah, Medina)'
  },
  {
    id: 'u2',
    name: 'Abdelrahman Mohamed',
    name_ar: 'عبدالرحمن محمد',
    email: 'abdelrahman.mohamed@almespar.com',
    password_hash: '8beb0c1ff03eec74fc00cd88ec5959650fa3ddbee0bd23a13c9f0f4586abd5fd', // Ar1234
    role: 'sales_engineer',
    avatar_color: '#77CE69',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    title: 'Sales Engineer',
    territory: 'Central Region (Riyadh)'
  },
  {
    id: 'u3',
    name: 'Abdurahman Al-Kaffas',
    name_ar: 'عبدالرحمن الكفاص',
    email: 'ar.alkaffas@almespar.com',
    password_hash: '7a7b269c9c92cc84f1f05a4248914034999e127917aac213e1471ef108b25100', // Kaffas1234
    role: 'sales_manager',
    avatar_color: '#F59E0B',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    title: 'Regional Sales Manager',
    territory: 'Kingdom-Wide (KSA)'
  },
  {
    id: 'u4',
    name: 'Karim Abdelazeez',
    name_ar: 'كريم عبدالعزيز',
    email: 'karim.abdelazeez@almespar.com',
    password_hash: '9e2abb80a729736ee16952285c176e271e29b6ad0de48763a18c3c7776cbdaee', // Kr1234
    role: 'sales_engineer',
    avatar_color: '#8B5CF6',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    title: 'Sales Engineer',
    territory: 'Eastern Region (Dammam, Khobar)'
  },
  {
    id: 'u5',
    name: 'Eslam',
    name_ar: 'إسلام',
    email: 'ideslam0@gmail.com',
    password_hash: '3ef8f8a842fe8b8e99777a47339a6ca4d5fbaa87bf42476bb29c8f93725a8e34', // 0125995614
    role: 'admin',
    avatar_color: '#EF4444',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    title: 'System Administrator & Commercial Director',
    territory: 'Headquarters'
  }
];
