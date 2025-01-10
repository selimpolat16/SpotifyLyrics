'use client'

import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key)
        return item ? JSON.parse(item) : initialValue
      }
      return initialValue
    } catch (error) {
      console.error('Local storage error:', error)
      return initialValue
    }
  })

  const updateLocalStorage = useCallback((value: T) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (error) {
      console.error('Local storage error:', error)
    }
  }, [key])

  useEffect(() => {
    updateLocalStorage(storedValue)
  }, [storedValue, updateLocalStorage])

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      if (JSON.stringify(valueToStore) !== JSON.stringify(storedValue)) {
        setStoredValue(valueToStore)
      }
    } catch (error) {
      console.error('Local storage error:', error)
    }
  }, [storedValue])

  return [storedValue, setValue] as const
} 