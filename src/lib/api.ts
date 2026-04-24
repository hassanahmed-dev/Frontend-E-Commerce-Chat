import { Product } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

interface ProductNode {
  id: string;
  name: string;
  price: number;
  rating?: number;
  category: Product["category"] | string;
  imageUrl?: string;
}

export interface OrderNode {
  id: string;
  status: string;
  total: number;
  user?: { id: string; name: string; email: string };
}

export interface CartItemNode {
  id: string;
  quantity: number;
  product: ProductNode;
}

export interface WishlistItemNode {
  id: string;
  product: ProductNode;
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

async function graphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store"
  });

  const json = (await response.json()) as GraphqlResponse<T>;
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  if (!json.data) {
    throw new Error("No data returned from server");
  }

  return json.data;
}

function toProduct(node: ProductNode): Product {
  const allowedCategories = ["electronics", "fashion", "home", "beauty"] as const;
  const category = allowedCategories.includes(node.category as (typeof allowedCategories)[number])
    ? (node.category as Product["category"])
    : "electronics";

  return {
    id: node.id,
    name: node.name,
    price: Number(node.price),
    rating: Number(node.rating ?? 0),
    category,
    image: node.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80"
  };
}

export async function getProducts(): Promise<Product[]> {
  const data = await graphqlRequest<{ products: ProductNode[] }>(
    `query Products {
      products {
        id
        name
        price
        rating
        category
        imageUrl
      }
    }`
  );

  return data.products.map(toProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  const data = await graphqlRequest<{ product: ProductNode | null }>(
    `query Product($id: String!) {
      product(id: $id) {
        id
        name
        price
        rating
        category
        imageUrl
      }
    }`,
    { id }
  );

  return data.product ? toProduct(data.product) : null;
}

export async function getOrders(): Promise<OrderNode[]> {
  const data = await graphqlRequest<{ orders: OrderNode[] }>(
    `query Orders {
      orders {
        id
        status
        total
        user {
          id
          name
          email
        }
      }
    }`
  );

  return data.orders.map((order) => ({ ...order, total: Number(order.total) }));
}

export async function getUsersCount(): Promise<number> {
  const data = await graphqlRequest<{ users: Array<{ id: string }> }>(
    `query Users { users { id } }`
  );
  return data.users.length;
}

export async function getCartItems(userId: string): Promise<CartItemNode[]> {
  const data = await graphqlRequest<{ cartItems: CartItemNode[] }>(
    `query CartItems($userId: String!) {
      cartItems(userId: $userId) {
        id
        quantity
        product {
          id
          name
          price
          rating
          category
          imageUrl
        }
      }
    }`,
    { userId }
  );
  return data.cartItems;
}

export async function getWishlistItems(userId: string): Promise<WishlistItemNode[]> {
  const data = await graphqlRequest<{ wishlistItems: WishlistItemNode[] }>(
    `query WishlistItems($userId: String!) {
      wishlistItems(userId: $userId) {
        id
        product {
          id
          name
          price
          rating
          category
          imageUrl
        }
      }
    }`,
    { userId }
  );
  return data.wishlistItems;
}

export async function createOrder(input: { userId: string; items: CreateOrderItemInput[] }): Promise<OrderNode> {
  const data = await graphqlRequest<{ createOrder: OrderNode }>(
    `mutation CreateOrder($input: CreateOrderInput!) {
      createOrder(input: $input) {
        id
        status
        total
        user {
          id
          name
          email
        }
      }
    }`,
    { input }
  );

  return { ...data.createOrder, total: Number(data.createOrder.total) };
}

