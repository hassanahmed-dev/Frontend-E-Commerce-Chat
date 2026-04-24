export type Category = "electronics" | "fashion" | "home" | "beauty";

export interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  category: Category;
  image: string;
  isFeatured?: boolean;
}

export interface NavItem {
  label: string;
  href: string;
}