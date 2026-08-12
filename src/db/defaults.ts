import type { Category, PaymentMethod } from '../types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-akaryakit', name: 'Akaryakıt', isDefault: true },
  { id: 'cat-yemek', name: 'Yemek', isDefault: true },
  { id: 'cat-market', name: 'Market', isDefault: true },
  { id: 'cat-ofis', name: 'Ofis', isDefault: true },
  { id: 'cat-konaklama', name: 'Konaklama', isDefault: true },
  { id: 'cat-ulasim', name: 'Ulaşım', isDefault: true },
  { id: 'cat-arac', name: 'Araç', isDefault: true },
  { id: 'cat-temizlik', name: 'Temizlik', isDefault: true },
  { id: 'cat-malzeme', name: 'Malzeme', isDefault: true },
  { id: 'cat-hizmet', name: 'Hizmet', isDefault: true },
  { id: 'cat-diger', name: 'Diğer', isDefault: true },
]

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm-nakit', name: 'Nakit', isDefault: true },
  { id: 'pm-kredi-karti', name: 'Kredi Kartı', isDefault: true },
  { id: 'pm-banka-karti', name: 'Banka Kartı', isDefault: true },
  { id: 'pm-havale', name: 'Havale / EFT', isDefault: true },
  { id: 'pm-sirket-karti', name: 'Şirket Kartı', isDefault: true },
  { id: 'pm-diger', name: 'Diğer', isDefault: true },
]
