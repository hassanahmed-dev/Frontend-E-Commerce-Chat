import { Product } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? `${API_URL}/graphql`;

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

export interface ChatParticipantNode {
  id: string;
  role: "user" | "admin";
  user: { id: string; name: string; email: string; role: "user" | "admin" };
}

export interface ConversationNode {
  id: string;
  name: string | null;
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  participants: ChatParticipantNode[];
}

export interface MessageNode {
  id: string;
  content: string;
  senderType: "user" | "admin" | "ai" | "system";
  createdAt: string;
  sender: { id: string; name: string; email: string } | null;
}

export interface AdminAiResponseNode {
  adminMessage: MessageNode;
  aiMessage: MessageNode;
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

async function graphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(GRAPHQL_URL, {
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

export async function getAdminConversations(input: {
  authorization: string;
  status?: "open" | "closed";
  search?: string;
}): Promise<ConversationNode[]> {
  const data = await graphqlRequest<{ adminConversations: ConversationNode[] }>(
    `query AdminConversations($authorization: String!, $filter: AdminChatFilterInput) {
      adminConversations(authorization: $authorization, filter: $filter) {
        id
        name
        status
        createdAt
        updatedAt
        lastMessageAt
        participants {
          id
          role
          user {
            id
            name
            email
            role
          }
        }
      }
    }`,
    {
      authorization: input.authorization,
      filter: {
        status: input.status,
        search: input.search
      }
    }
  );
  return data.adminConversations;
}

export async function getConversationMessages(input: {
  authorization: string;
  conversationId: string;
}): Promise<MessageNode[]> {
  const data = await graphqlRequest<{ conversationMessages: MessageNode[] }>(
    `query ConversationMessages($conversationId: String!, $authorization: String!) {
      conversationMessages(conversationId: $conversationId, authorization: $authorization) {
        id
        content
        senderType
        createdAt
        sender {
          id
          name
          email
        }
      }
    }`,
    input
  );
  return data.conversationMessages;
}

export async function sendAdminMessage(input: {
  authorization: string;
  conversationId: string;
  content: string;
}): Promise<MessageNode> {
  const data = await graphqlRequest<{ adminSendMessage: MessageNode }>(
    `mutation AdminSendMessage($authorization: String!, $input: AdminSendMessageInput!) {
      adminSendMessage(authorization: $authorization, input: $input) {
        id
        content
        senderType
        createdAt
        sender {
          id
          name
          email
        }
      }
    }`,
    {
      authorization: input.authorization,
      input: { conversationId: input.conversationId, content: input.content }
    }
  );
  return data.adminSendMessage;
}

export async function closeConversationById(input: {
  authorization: string;
  conversationId: string;
}): Promise<ConversationNode> {
  const data = await graphqlRequest<{ closeConversation: ConversationNode }>(
    `mutation CloseConversation($conversationId: String!, $authorization: String!) {
      closeConversation(conversationId: $conversationId, authorization: $authorization) {
        id
        status
        createdAt
        updatedAt
        lastMessageAt
        participants {
          id
          role
          user {
            id
            name
            email
            role
          }
        }
      }
    }`,
    input
  );
  return data.closeConversation;
}

export async function askAdminAi(input: {
  authorization: string;
  conversationId: string;
  prompt: string;
}): Promise<AdminAiResponseNode> {
  const data = await graphqlRequest<{ adminAskAi: AdminAiResponseNode }>(
    `mutation AdminAskAi($authorization: String!, $input: AdminAskAiInput!) {
      adminAskAi(authorization: $authorization, input: $input) {
        adminMessage {
          id
          content
          senderType
          createdAt
          sender {
            id
            name
            email
          }
        }
        aiMessage {
          id
          content
          senderType
          createdAt
          sender {
            id
            name
            email
          }
        }
      }
    }`,
    {
      authorization: input.authorization,
      input: { conversationId: input.conversationId, prompt: input.prompt }
    }
  );
  return data.adminAskAi;
}

export async function renameConversationById(input: {
  authorization: string;
  conversationId: string;
  chatName: string;
}): Promise<ConversationNode> {
  const data = await graphqlRequest<{ renameConversation: ConversationNode }>(
    `mutation RenameConversation($authorization: String!, $conversationId: String!, $chatName: String!) {
      renameConversation(authorization: $authorization, conversationId: $conversationId, chatName: $chatName) {
        id
        name
        status
        createdAt
        updatedAt
        lastMessageAt
        participants {
          id
          role
          user {
            id
            name
            email
            role
          }
        }
      }
    }`,
    input
  );
  return data.renameConversation;
}

export async function deleteConversationPermanentlyById(input: {
  authorization: string;
  conversationId: string;
}): Promise<boolean> {
  const data = await graphqlRequest<{ deleteConversationPermanently: boolean }>(
    `mutation DeleteConversationPermanently($authorization: String!, $conversationId: String!) {
      deleteConversationPermanently(authorization: $authorization, conversationId: $conversationId)
    }`,
    input
  );
  return data.deleteConversationPermanently;
}

export async function createSupportConversation(input: {
  authorization: string;
  userId?: string;
  userEmail?: string;
  initialMessage?: string;
}): Promise<ConversationNode> {
  const data = await graphqlRequest<{ createSupportConversation: ConversationNode }>(
    `mutation CreateSupportConversation($authorization: String!, $input: CreateSupportConversationInput!) {
      createSupportConversation(authorization: $authorization, input: $input) {
        id
        name
        status
        createdAt
        updatedAt
        lastMessageAt
        participants {
          id
          role
          user {
            id
            name
            email
            role
          }
        }
      }
    }`,
    {
      authorization: input.authorization,
      input: {
        userId: input.userId,
        userEmail: input.userEmail,
        initialMessage: input.initialMessage
      }
    }
  );
  return data.createSupportConversation;
}

export async function createAdminConversation(input: {
  authorization: string;
  chatName?: string;
  initialMessage?: string;
}): Promise<ConversationNode> {
  const data = await graphqlRequest<{ createAdminConversation: ConversationNode }>(
    `mutation CreateAdminConversation($authorization: String!, $input: CreateAdminConversationInput) {
      createAdminConversation(authorization: $authorization, input: $input) {
        id
        name
        status
        createdAt
        updatedAt
        lastMessageAt
        participants {
          id
          role
          user {
            id
            name
            email
            role
          }
        }
      }
    }`,
    {
      authorization: input.authorization,
      input: {
        chatName: input.chatName,
        initialMessage: input.initialMessage
      }
    }
  );
  return data.createAdminConversation;
}

// ── Booking types & API ────────────────────────────────────────────────────────

export interface BookingNode {
  id: string;
  serviceType: string;
  scheduledAt: string;
  status: string;
  userNote: string | null;
  adminNote: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export async function getBookings(authorization: string): Promise<BookingNode[]> {
  const data = await graphqlRequest<{ bookings: BookingNode[] }>(
    `query Bookings($authorization: String!) {
      bookings(authorization: $authorization) {
        id serviceType scheduledAt status userNote adminNote createdAt
        user { id name email }
      }
    }`,
    { authorization }
  );
  return data.bookings;
}

export async function getMyBookings(authorization: string): Promise<BookingNode[]> {
  const data = await graphqlRequest<{ myBookings: BookingNode[] }>(
    `query MyBookings($authorization: String!) {
      myBookings(authorization: $authorization) {
        id serviceType scheduledAt status userNote adminNote createdAt
        user { id name email }
      }
    }`,
    { authorization }
  );
  return data.myBookings;
}

export async function createBooking(input: {
  authorization: string;
  serviceType: string;
  scheduledAt: string;
  userNote?: string;
}): Promise<BookingNode> {
  const data = await graphqlRequest<{ createBooking: BookingNode }>(
    `mutation CreateBooking($authorization: String!, $input: CreateBookingInput!) {
      createBooking(authorization: $authorization, input: $input) {
        id serviceType scheduledAt status userNote adminNote createdAt
        user { id name email }
      }
    }`,
    {
      authorization: input.authorization,
      input: { serviceType: input.serviceType, scheduledAt: input.scheduledAt, userNote: input.userNote }
    }
  );
  return data.createBooking;
}

export async function updateBookingStatus(input: {
  authorization: string;
  id: string;
  status: string;
  adminNote?: string;
}): Promise<BookingNode> {
  const data = await graphqlRequest<{ updateBookingStatus: BookingNode }>(
    `mutation UpdateBookingStatus($authorization: String!, $input: UpdateBookingStatusInput!) {
      updateBookingStatus(authorization: $authorization, input: $input) {
        id serviceType scheduledAt status userNote adminNote createdAt
        user { id name email }
      }
    }`,
    {
      authorization: input.authorization,
      input: { id: input.id, status: input.status, adminNote: input.adminNote }
    }
  );
  return data.updateBookingStatus;
}

export async function cancelBooking(id: string, authorization: string): Promise<BookingNode> {
  const data = await graphqlRequest<{ cancelBooking: BookingNode }>(
    `mutation CancelBooking($id: String!, $authorization: String!) {
      cancelBooking(id: $id, authorization: $authorization) {
        id serviceType scheduledAt status userNote adminNote createdAt
        user { id name email }
      }
    }`,
    { id, authorization }
  );
  return data.cancelBooking;
}

// ── Admin order/product/user management ───────────────────────────────────────

export interface OrderDetailNode {
  id: string;
  status: string;
  total: number;
  user: { id: string; name: string; email: string };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product: { id: string; name: string; imageUrl: string };
  }>;
}

export async function getOrderDetail(id: string): Promise<OrderDetailNode | null> {
  const data = await graphqlRequest<{ order: OrderDetailNode | null }>(
    `query Order($id: String!) {
      order(id: $id) {
        id status total
        user { id name email }
        items { id quantity unitPrice product { id name imageUrl } }
      }
    }`,
    { id }
  );
  return data.order ? { ...data.order, total: Number(data.order.total) } : null;
}

export async function updateOrderStatus(input: {
  authorization: string;
  id: string;
  status: string;
}): Promise<OrderNode> {
  const data = await graphqlRequest<{ updateOrderStatus: OrderNode }>(
    `mutation UpdateOrderStatus($id: String!, $status: String!, $authorization: String!) {
      updateOrderStatus(id: $id, status: $status, authorization: $authorization) {
        id status total user { id name email }
      }
    }`,
    input
  );
  return { ...data.updateOrderStatus, total: Number(data.updateOrderStatus.total) };
}

export interface UserNode {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export async function getAllUsers(authorization: string): Promise<UserNode[]> {
  const data = await graphqlRequest<{ getAllUsers: UserNode[] }>(
    `query GetAllUsers($authorization: String!) {
      getAllUsers(authorization: $authorization) {
        id name email role isActive
      }
    }`,
    { authorization }
  );
  return data.getAllUsers;
}

export async function toggleUserActive(id: string, authorization: string): Promise<UserNode> {
  const data = await graphqlRequest<{ toggleUserActive: UserNode }>(
    `mutation ToggleUserActive($id: String!, $authorization: String!) {
      toggleUserActive(id: $id, authorization: $authorization) {
        id name email role isActive
      }
    }`,
    { id, authorization }
  );
  return data.toggleUserActive;
}

export interface ProductDetailNode {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  rating: number;
}

export async function getProductsDetail(): Promise<ProductDetailNode[]> {
  const data = await graphqlRequest<{ products: ProductDetailNode[] }>(
    `query ProductsDetail {
      products {
        id name description price stock category imageUrl rating
      }
    }`
  );
  return data.products.map((p) => ({ ...p, price: Number(p.price), rating: Number(p.rating) }));
}

export async function updateProduct(input: {
  authorization: string;
  id: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  imageUrl?: string;
  rating?: number;
}): Promise<ProductDetailNode> {
  const { authorization, id, ...fields } = input;
  const data = await graphqlRequest<{ updateProduct: ProductDetailNode }>(
    `mutation UpdateProduct($id: String!, $input: UpdateProductInput!, $authorization: String!) {
      updateProduct(id: $id, input: $input, authorization: $authorization) {
        id name description price stock category imageUrl rating
      }
    }`,
    { id, input: fields, authorization }
  );
  return { ...data.updateProduct, price: Number(data.updateProduct.price), rating: Number(data.updateProduct.rating) };
}

export async function deleteProduct(id: string, authorization: string): Promise<boolean> {
  const data = await graphqlRequest<{ deleteProduct: boolean }>(
    `mutation DeleteProduct($id: String!, $authorization: String!) {
      deleteProduct(id: $id, authorization: $authorization)
    }`,
    { id, authorization }
  );
  return data.deleteProduct;
}

// ── User support chat ──────────────────────────────────────────────────────────

export async function getUserConversationMessages(conversationId: string, authorization: string): Promise<MessageNode[]> {
  const data = await graphqlRequest<{ conversationMessages: MessageNode[] }>(
    `query ConversationMessages($conversationId: String!, $authorization: String!) {
      conversationMessages(conversationId: $conversationId, authorization: $authorization) {
        id content senderType createdAt
        sender { id name email }
      }
    }`,
    { conversationId, authorization }
  );
  return data.conversationMessages;
}

export async function userStartSupportChat(authorization: string, initialMessage?: string): Promise<ConversationNode> {
  const data = await graphqlRequest<{ userStartSupportChat: ConversationNode }>(
    `mutation UserStartSupportChat($authorization: String!, $initialMessage: String) {
      userStartSupportChat(authorization: $authorization, initialMessage: $initialMessage) {
        id name status createdAt updatedAt lastMessageAt
        participants { id role user { id name email role } }
      }
    }`,
    { authorization, initialMessage }
  );
  return data.userStartSupportChat;
}

export async function userSendMessage(input: {
  authorization: string;
  conversationId: string;
  content: string;
}): Promise<MessageNode> {
  const data = await graphqlRequest<{ userSendMessage: MessageNode }>(
    `mutation UserSendMessage($conversationId: String!, $content: String!, $authorization: String!) {
      userSendMessage(conversationId: $conversationId, content: $content, authorization: $authorization) {
        id content senderType createdAt
        sender { id name email }
      }
    }`,
    input
  );
  return data.userSendMessage;
}

export async function getUserConversations(authorization: string): Promise<ConversationNode[]> {
  const data = await graphqlRequest<{ userConversations: ConversationNode[] }>(
    `query UserConversations($authorization: String!) {
      userConversations(authorization: $authorization) {
        id name status createdAt updatedAt lastMessageAt
        participants { id role user { id name email role } }
      }
    }`,
    { authorization }
  );
  return data.userConversations;
}

export async function getUserChatMessages(conversationId: string, authorization: string): Promise<MessageNode[]> {
  const data = await graphqlRequest<{ userConversationMessages: MessageNode[] }>(
    `query UserConversationMessages($conversationId: String!, $authorization: String!) {
      userConversationMessages(conversationId: $conversationId, authorization: $authorization) {
        id content senderType createdAt
        sender { id name email }
      }
    }`,
    { conversationId, authorization }
  );
  return data.userConversationMessages;
}

