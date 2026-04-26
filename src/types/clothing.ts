export type ClothingCategory =
  | "Tshirt"
  | "Shirt"
  | "Pants"
  | "Skirt"
  | "Dress"
  | "Jacket"
  | "Shoes"
  | "Bag"
  | "Accessory";

export type Season = "Spring" | "Summer" | "Autumn" | "Winter" | "All";

export type ClothingStyle =
  | "Minimal"
  | "Casual"
  | "Smart Casual"
  | "Sport"
  | "Elegant"
  | "Streetwear";

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  color: string;
  season: Season;
  style: ClothingStyle;
  imageUrl: string;
  createdAt: string;
}
