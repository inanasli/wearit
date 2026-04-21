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

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  color: string;
  season: Season;
  imageUrl: string;
  createdAt: string;
}