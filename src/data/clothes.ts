import { ClothingItem } from "@/types/clothing";

export const clothes: ClothingItem[] = [
  {
    id: "1",
    name: "Beyaz Basic Tişört",
    category: "Tshirt",
    color: "Beyaz",
    season: "Summer",
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Kiremit Ceket",
    category: "Jacket",
    color: "Kiremit",
    season: "Winter",
    imageUrl:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1200&auto=format&fit=crop",
    createdAt: new Date().toISOString(),
  },
];