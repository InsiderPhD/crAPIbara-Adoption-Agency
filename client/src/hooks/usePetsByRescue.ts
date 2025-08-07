import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../config/api';
import type { Pet, PaginatedResponse } from './usePets';

export const usePetsByRescue = (rescueId: string, limit: number = 3) => {
  return useQuery<PaginatedResponse<Pet>>({
    queryKey: ['petsByRescue', rescueId, limit],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/pets`, {
        params: {
          rescueId,
          limit,
          page: 1,
          sort: 'dateListed',
          order: 'desc',
        },
      });
      return data;
    },
    enabled: !!rescueId,
  });
}; 