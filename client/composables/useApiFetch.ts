interface FetchError extends Error {
  response?: Response;
  data?: any;
}

export const useApiFetch = async <T>(path: string, options: any = {}) => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || 'http://localhost:3333'
  const token = useState('token')

  const defaults: RequestInit = {
    credentials: 'include', // Always include credentials
    mode: 'cors',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token.value ? { Authorization: `Bearer ${token.value}` } : {})
    }
  }

  console.log('Making fetch request:', {
    url: `${baseURL}${path}`,
    method: options.method || 'GET',
    credentials: 'include',
    headers: {
      ...defaults.headers,
      ...(options.headers || {})
    }
  })

  try {
    const response = await $fetch<T>(path, {
      baseURL,
      ...defaults,
      ...options,
      headers: {
        ...defaults.headers,
        ...(options.headers || {})
      }
    })
    return response
  } catch (err) {
    const error = err as FetchError
    console.error('API Request failed:', {
      path,
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText
    })
    throw error
  }
}