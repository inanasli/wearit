import { ClothingItem } from "@/types/clothing";

export interface Outfit {
  id: string;
  name: string;
  occasion: string;
  weather: string;
  matchScore: number;
  items: ClothingItem[];
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  outfitCount: number;
  coverImage: string;
  tags: string[];
}

export const clothes: ClothingItem[] = [
  {
    id: "1",
    name: "Beyaz Basic Tişört",
    category: "Tshirt",
    color: "Beyaz",
    season: "Summer",
    style: "Casual",
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop",
    createdAt: "2026-04-20T10:00:00.000Z",
  },
  {
    id: "2",
    name: "Kiremit Oversize Ceket",
    category: "Jacket",
    color: "Kiremit",
    season: "Autumn",
    style: "Smart Casual",
    imageUrl:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1200&auto=format&fit=crop",
    createdAt: "2026-04-21T10:00:00.000Z",
  },
  {
    id: "3",
    name: "Lacivert Kumaş Pantolon",
    category: "Pants",
    color: "Lacivert",
    season: "All",
    style: "Minimal",
    imageUrl:
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1200&auto=format&fit=crop",
    createdAt: "2026-04-22T10:00:00.000Z",
  },
  {
    id: "4",
    name: "Siyah Deri Bot",
    category: "Shoes",
    color: "Siyah",
    season: "Winter",
    style: "Elegant",
    imageUrl:
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=1200&auto=format&fit=crop",
    createdAt: "2026-04-23T10:00:00.000Z",
  },
  {
    id: "5",
    name: "Yeşil Trençkot",
    category: "Jacket",
    color: "Yeşil",
    season: "Spring",
    style: "Smart Casual",
    imageUrl:
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=1200&auto=format&fit=crop",
    createdAt: "2026-04-24T10:00:00.000Z",
  },
  {
    id: "6",
    name: "Kanvas Omuz Çantası",
    category: "Bag",
    color: "Bej",
    season: "All",
    style: "Streetwear",
    imageUrl:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1200&auto=format&fit=crop",
    createdAt: "2026-04-25T10:00:00.000Z",
  },
];

export const outfits: Outfit[] = [
  {
    id: "outfit-1",
    name: "Yağmurlu Ofis",
    occasion: "İş günü",
    weather: "14°C, hafif yağmur",
    matchScore: 92,
    items: [clothes[4], clothes[2], clothes[3]],
  },
  {
    id: "outfit-2",
    name: "Hafta Sonu Kahve",
    occasion: "Günlük plan",
    weather: "21°C, parçalı bulutlu",
    matchScore: 88,
    items: [clothes[0], clothes[5], clothes[2]],
  },
  {
    id: "outfit-3",
    name: "Akşam Buluşması",
    occasion: "Akşam",
    weather: "18°C, serin",
    matchScore: 95,
    items: [clothes[1], clothes[2], clothes[3]],
  },
];

export const collections: Collection[] = [
  {
    id: "collection-1",
    name: "İş Günleri",
    description: "Toplantı, ofis ve şehir içi planlar için düzenli parçalar.",
    itemCount: 12,
    outfitCount: 5,
    coverImage: clothes[2].imageUrl,
    tags: ["Minimal", "Smart Casual", "All season"],
  },
  {
    id: "collection-2",
    name: "Hafta Sonu",
    description: "Rahat, hafif ve hızlı hazırlanmayı sağlayan kombinler.",
    itemCount: 18,
    outfitCount: 7,
    coverImage: clothes[0].imageUrl,
    tags: ["Casual", "Streetwear", "Spring"],
  },
  {
    id: "collection-3",
    name: "Serin Havalar",
    description: "Katmanlı giyinme, dış giyim ve yağmura uygun seçimler.",
    itemCount: 9,
    outfitCount: 4,
    coverImage: clothes[4].imageUrl,
    tags: ["Autumn", "Winter", "Outerwear"],
  },
];
