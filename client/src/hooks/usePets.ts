import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../config/api';

export interface Pet {
  id: string;
  referenceNumber: string;
  name: string;
  species: 'capybara' | 'guinea_pig' | 'rock_cavy' | 'chinchilla';
  age: number;
  size: 'small' | 'medium' | 'large' | 'extra_large_capybara';
  description: string;
  imageUrl: string;
  gallery: string;
  rescueId: string;
  isAdopted: boolean;
  isPromoted: boolean;
  dateListed: string;
  createdAt: string;
  updatedAt: string;
  internalNotes?: string;
  rescue: {
    id: string;
    name: string;
    location: string;
    contactEmail: string;
    websiteUrl?: string;
    logoUrl?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface PetFilters {
  species: string[];
  size: string[];
  ageRange: [number, number];
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  rescueId?: string;
  showAdopted?: boolean;
}

export const usePets = (page = 1, limit = 10, filters?: PetFilters) => {
  return useQuery<PaginatedResponse<Pet>>({
    queryKey: ['pets', page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort: filters?.sortBy || 'dateListed',
        order: filters?.sortOrder || 'desc',
      });

      if (filters) {
        if (filters.species.length > 0) {
          params.append('species', filters.species.join(','));
        }
        if (filters.size.length > 0) {
          params.append('size', filters.size.join(','));
        }
        if (filters.search) {
          params.append('search', filters.search);
        }
        if (filters.ageRange[0] > 0) {
          params.append('minAge', filters.ageRange[0].toString());
        }
        if (filters.ageRange[1] < 20) {
          params.append('maxAge', filters.ageRange[1].toString());
        }
        if (filters.rescueId) {
          params.append('rescueId', filters.rescueId);
        }
        if (filters.showAdopted) {
          params.append('showAdopted', 'true');
        }
      }

      const { data } = await axios.get(`${API_URL}/pets`, { params });
      return data;
    },
  });
};

export const useRecentPets = () => {
  return useQuery<PaginatedResponse<Pet>>({
    queryKey: ['recentPets'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/pets`, {
        params: { 
          page: 1, 
          limit: 3,
          sort: 'dateListed',
          order: 'desc'
        },
      });
      return data;
    },
  });
};

export const useLongStayPets = () => {
  return useQuery<PaginatedResponse<Pet>>({
    queryKey: ['longStayPets'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/pets`, {
        params: { 
          page: 1, 
          limit: 3,
          sort: 'dateListed',
          order: 'asc',
          filter: 'notAdopted'
        },
      });
      return data;
    },
  });
}; 