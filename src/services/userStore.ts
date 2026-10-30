import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProfileRecord, CreateUserInput } from '../types/auth';

const STORAGE_KEYS = {
  USERS: 'voltacc_pos_user_profiles_v1',
};

const SEED_USERS: UserProfileRecord[] = [
  {
    id: 'c51a7042-8709-4e78-98e9-e31b51e0892f',
    email: 'root@voltacc.pos',
    firstName: 'Admin',
    lastName: 'Root Sistema',
    role: 'admin',
    branchId: null,
    branchName: 'Acceso Global / Todas',
    phone: '+54 9 11 4892-0012',
    status: true,
    avatarInitials: 'AR',
    createdAt: '2024-01-10T12:00:00.000Z',
    updatedAt: '2024-10-24T18:32:00.000Z',
  },
  {
    id: '8e22f491-1204-4b51-87aa-f938aa8d9101',
    email: 'c.vega@voltacc.pos',
    firstName: 'Camila',
    lastName: 'Vega',
    role: 'cashier',
    branchId: 'central-104',
    branchName: 'Sucursal Central #104',
    phone: '+54 9 11 4892-3344',
    status: true,
    avatarInitials: 'CV',
    createdAt: '2024-02-14T09:30:00.000Z',
    updatedAt: '2024-10-20T14:10:00.000Z',
  },
  {
    id: '6a33c102-4411-4890-a33d-c7821901dd12',
    email: 'mateo.rossi@voltacc.pos',
    firstName: 'Mateo',
    lastName: 'Rossi',
    role: 'cashier',
    branchId: 'central-104',
    branchName: 'Sucursal Central #104',
    phone: '+54 9 11 5432-8899',
    status: true,
    avatarInitials: 'MR',
    createdAt: '2024-03-01T11:00:00.000Z',
    updatedAt: '2024-09-15T16:20:00.000Z',
  },
  {
    id: '7b44d213-5522-4901-b44e-d8932012ee23',
    email: 'c.gomez@voltacc.pos',
    firstName: 'Camila',
    lastName: 'Gomez',
    role: 'supervisor',
    branchId: 'norte-102',
    branchName: 'Flagship Norte #102',
    phone: '+54 9 11 8844-1290',
    status: true,
    avatarInitials: 'CG',
    createdAt: '2024-03-12T14:20:00.000Z',
    updatedAt: '2024-10-18T10:15:00.000Z',
  },
  {
    id: '9c55e324-6633-4012-c55f-e9043123ff34',
    email: 'lucas.p@voltacc.pos',
    firstName: 'Lucas',
    lastName: 'Perez',
    role: 'stock',
    branchId: 'mall-108',
    branchName: 'Express Mall #108',
    phone: '+54 9 11 3102-9988',
    status: true,
    avatarInitials: 'LP',
    createdAt: '2024-04-05T08:45:00.000Z',
    updatedAt: '2024-08-22T19:00:00.000Z',
  },
  {
    id: '1d66f435-7744-4123-d66a-fa1542340045',
    email: 's.benitez@voltacc.pos',
    firstName: 'Sofia',
    lastName: 'Benitez',
    role: 'cashier',
    branchId: 'norte-102',
    branchName: 'Flagship Norte #102',
    phone: '+54 9 11 7711-2233',
    status: false,
    avatarInitials: 'SB',
    createdAt: '2024-05-18T16:10:00.000Z',
    updatedAt: '2024-07-10T12:00:00.000Z',
  },
  {
    id: 'usr-seller-01',
    email: 'vendedor@voltacc.pos',
    firstName: 'Carlos',
    lastName: 'Vendedor',
    role: 'seller',
    branchId: 'central-104',
    branchName: 'Sucursal Central #104',
    phone: '+54 9 11 9988-7766',
    status: true,
    avatarInitials: 'CV',
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-10-25T17:40:00.000Z',
  },
];

function getStoredUsers(): UserProfileRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
      return SEED_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_USERS;
  }
}

function setStoredUsers(users: UserProfileRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to store users:', err);
  }
}

export function getBranchName(branchId: string | null): string {
  switch (branchId) {
    case 'central-104':
      return 'Sucursal Central #104';
    case 'norte-102':
      return 'Flagship Norte #102';
    case 'mall-108':
      return 'Express Mall #108';
    default:
      return 'Acceso Global / Todas';
  }
}

export function computeInitials(firstName?: string, lastName?: string, email?: string): string {
  const f = firstName?.trim() || '';
  const l = lastName?.trim() || '';
  if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
  if (f) return f.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return 'US';
}

export function useUsers() {
  const queryClient = useQueryClient();

  const query = useQuery<UserProfileRecord[]>({
    queryKey: ['user_profiles'],
    queryFn: async () => {
      return getStoredUsers();
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const current = getStoredUsers();
      const cleanEmail = input.email.trim().toLowerCase();

      const exists = current.some((u) => u.email.trim().toLowerCase() === cleanEmail);
      if (exists) {
        throw new Error(`Ya existe un usuario registrado con el correo: ${cleanEmail}`);
      }

      const now = new Date().toISOString();
      const newUser: UserProfileRecord = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        email: cleanEmail,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        role: input.role,
        branchId: input.branchId,
        branchName: getBranchName(input.branchId),
        phone: input.phone?.trim() || '',
        status: input.status,
        avatarInitials: computeInitials(input.firstName, input.lastName, cleanEmail),
        createdAt: now,
        updatedAt: now,
      };

      const updated = [newUser, ...current];
      setStoredUsers(updated);
      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (user: Partial<UserProfileRecord> & { id: string }) => {
      const current = getStoredUsers();
      const index = current.findIndex((u) => u.id === user.id);
      if (index === -1) {
        throw new Error('Usuario no encontrado');
      }

      const existing = current[index];
      if (user.email && user.email.trim().toLowerCase() !== existing.email.toLowerCase()) {
        const cleanEmail = user.email.trim().toLowerCase();
        const duplicate = current.some((u) => u.id !== user.id && u.email.toLowerCase() === cleanEmail);
        if (duplicate) {
          throw new Error(`El email ${cleanEmail} ya está en uso por otro usuario`);
        }
      }

      const updatedRecord: UserProfileRecord = {
        ...existing,
        ...user,
        branchName: user.branchId !== undefined ? getBranchName(user.branchId) : existing.branchName,
        avatarInitials: computeInitials(
          user.firstName !== undefined ? user.firstName : existing.firstName,
          user.lastName !== undefined ? user.lastName : existing.lastName,
          user.email || existing.email
        ),
        updatedAt: new Date().toISOString(),
      };

      current[index] = updatedRecord;
      setStoredUsers(current);
      return updatedRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      const current = getStoredUsers();
      const user = current.find((u) => u.id === id);
      if (!user) throw new Error('Usuario no encontrado');
      user.status = !user.status;
      user.updatedAt = new Date().toISOString();
      setStoredUsers(current);
      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
    },
  });

  return {
    users: query.data || [],
    isLoading: query.isLoading,
    createUser: createUserMutation.mutateAsync,
    isCreating: createUserMutation.isPending,
    updateUser: updateUserMutation.mutateAsync,
    isUpdating: updateUserMutation.isPending,
    toggleUserStatus: toggleStatusMutation.mutateAsync,
  };
}

