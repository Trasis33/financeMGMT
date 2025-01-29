import type { CreateBillInput, UpdateBillInput, BillWithParticipants, BillPayment, BillsFilterOptions, BillsSortOptions, BillStatistics } from '../types/Bill';
import type { NitroFetchRequest, NitroFetchOptions } from 'nitropack';

export const useBills = () => {
  const config = useRuntimeConfig();
  const { token, refreshSession, validateSession } = useAuth();

  const buildUrl = (path: string) => `${config.public.apiBaseUrl}${path}`;

  const fetchWithAuth = async <T>(path: string, options: Partial<NitroFetchOptions<NitroFetchRequest>> = {}): Promise<T> => {
    const makeRequest = async (retryCount = 0): Promise<T> => {
      // Validate session before making request
      if (!validateSession()) {
        console.log('Session invalid, attempting refresh');
        const refreshed = await refreshSession();
        if (!refreshed) {
          throw new Error('Session validation failed');
        }
      }

      // Ensure we have a valid token
      if (!token.value) {
        throw new Error('No valid token available');
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      const fetchOptions: NitroFetchOptions<NitroFetchRequest> = {
        ...options,
        headers,
        retry: 0, // Disable built-in retry to handle it ourselves
      };

      try {
        return await $fetch<T>(buildUrl(path), {
          ...fetchOptions,
          onResponse({ response }) {
            // Check both Authorization and authorization headers
            const authHeader = response.headers.get('Authorization') || response.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
              const newToken = authHeader.split(' ')[1];
              if (newToken && newToken !== token.value) {
                console.log('Received new token in response');
                token.value = newToken;
                if (process.client) {
                  localStorage.setItem('auth_token', newToken);
                  const expiryDate = new Date();
                  expiryDate.setDate(expiryDate.getDate() + 14);
                  localStorage.setItem('auth_token_expiry', expiryDate.toISOString());
                }
              }
            }
          },
          onResponseError({ response }) {
            if (response.status === 401) {
              throw new Error('Authentication failed');
            }
          }
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Authentication failed' && retryCount < 1) {
          console.log('Received 401, attempting session refresh');
          const refreshed = await refreshSession();
          if (refreshed) {
            console.log('Session refreshed, retrying request');
            return makeRequest(retryCount + 1);
          }
        }
        throw error;
      }
    };

    return makeRequest();
  };

  const getBills = async (filters?: BillsFilterOptions, sort?: BillsSortOptions) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString());
        if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString());
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.isRecurring !== undefined) queryParams.append('isRecurring', String(filters.isRecurring));
        if (filters.isPaid !== undefined) queryParams.append('isPaid', String(filters.isPaid));
      }
      
      if (sort) {
        queryParams.append('sortField', sort.field);
        queryParams.append('sortDirection', sort.direction);
      }

      const query = queryParams.toString();
      type BillsResponse = { data: BillWithParticipants[]; token?: string };
      const response = await fetchWithAuth<BillsResponse>(`/api/bills${query ? `?${query}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bills:', error);
      throw error;
    }
  };

  const getBill = async (id: number): Promise<BillWithParticipants> => {
    try {
      const response = await fetchWithAuth<{ data: BillWithParticipants; token?: string }>(`/api/bills/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bill:', error);
      throw error;
    }
  };

  const createBill = async (billData: CreateBillInput): Promise<BillWithParticipants> => {
    try {
      const response = await fetchWithAuth<{ data: BillWithParticipants; token?: string }>('/api/bills', {
        method: 'POST',
        body: billData,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  };

  const updateBill = async (id: number, updateData: UpdateBillInput): Promise<BillWithParticipants> => {
    try {
      const response = await fetchWithAuth<{ data: BillWithParticipants; token?: string }>(`/api/bills/${id}`, {
        method: 'PUT',
        body: updateData,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  };

  const deleteBill = async (id: number): Promise<void> => {
    try {
      await fetchWithAuth<void>(`/api/bills/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  };

  const addPayment = async (billId: number, amount: number, notes?: string): Promise<BillPayment> => {
    try {
      const response = await fetchWithAuth<{ data: BillPayment; token?: string }>(`/api/bills/${billId}/payments`, {
        method: 'POST',
        body: { amount, notes },
      });
      return response.data;
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  };

  const getBillStatistics = async (): Promise<BillStatistics | null> => {
    try {
      type StatsResponse = { data: BillStatistics; token?: string };
      const response = await fetchWithAuth<StatsResponse>('/api/bills/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching bill statistics:', error);
      // Don't throw, return null to allow graceful degradation
      return null;
    }
  };

  const calculateTotalPaid = (bill: BillWithParticipants) => {
    return bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const isFullyPaid = (bill: BillWithParticipants) => {
    const totalPaid = calculateTotalPaid(bill);
    return Math.abs(totalPaid - bill.amount) < 0.01;
  };

  const isOverdue = (bill: BillWithParticipants) => {
    return new Date(bill.dueDate) < new Date() && !isFullyPaid(bill);
  };

  const calculateRemainingAmount = (bill: BillWithParticipants) => {
    const totalPaid = calculateTotalPaid(bill);
    return Math.max(0, bill.amount - totalPaid);
  };

  const getUserShare = (bill: BillWithParticipants, userId: number) => {
    const participant = bill.participants.find(p => p.userId === userId);
    return participant ? bill.amount * participant.share : 0;
  };

  return {
    getBills,
    getBill,
    createBill,
    updateBill,
    deleteBill,
    addPayment,
    getBillStatistics,
    // Helper functions
    calculateTotalPaid,
    isFullyPaid,
    isOverdue,
    calculateRemainingAmount,
    getUserShare,
  };
};
