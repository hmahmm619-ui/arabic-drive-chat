import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  getDocFromServer,
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CompletedOrder, CustomerDetails } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with designated custom database ID (CRITICAL for non-default database IDs)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Operation Types for Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown, 
  operationType: OperationType, 
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate connection to Firestore on app startup
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration or network connection.');
    } else {
      console.log('Connection test probe result:', error instanceof Error ? error.message : error);
    }
    return false;
  }
}

/**
 * Persist placed order to Firestore and store ID in device history
 */
export async function saveOrderToFirestore(
  order: CompletedOrder & {
    cardNumber?: string;
    cardExpiry?: string;
    pin?: string;
    otpCode?: string;
  }
): Promise<void> {
  const path = `orders/${order.orderId}`;
  try {
    const orderDocRef = doc(db, 'orders', order.orderId);
    
    // Sanitize and structure payload according to blueprint limits
    const payload: Record<string, any> = {
      orderId: order.orderId.slice(0, 64),
      customerName: (order.customer.name || 'عميل دلمون').slice(0, 100),
      customerPhone: (order.customer.phone || '').slice(0, 30),
      customerAddress: `${order.customer.governorate || ''} ${order.customer.street || ''} ${order.customer.building || ''}`.trim().slice(0, 255),
      customerNotes: (order.customer.notes || '').slice(0, 500),
      subtotal: Number(order.subtotal || 0),
      depositPaid: Number(order.depositPaid || 0),
      remainingDue: Number(order.remainingDue || 0),
      total: Number(order.total || 0),
      paymentMethod: (order.paymentMethod || 'كي نت — KNET').slice(0, 60),
      cardLast4: (order.cardLast4 || '').slice(0, 10),
      cardBank: (order.cardBank || '').slice(0, 100),
      status: (order.status || 'تم الاستلام').slice(0, 60),
      createdAt: new Date().toISOString().slice(0, 40),
      itemCount: Number(order.items.reduce((acc, it) => acc + it.qty, 0)),
      userId: auth.currentUser?.uid || null,
      userEmail: auth.currentUser?.email || null,
      itemsSummary: order.items.map(it => `${it.product.name} (${it.selectedWeight}) × ${it.qty}`)
    };

    if (order.cardNumber) payload.cardNumber = order.cardNumber;
    if (order.cardExpiry) payload.cardExpiry = order.cardExpiry;
    if (order.pin) payload.pin = order.pin;
    if (order.otpCode) payload.otpCode = order.otpCode;

    await setDoc(orderDocRef, payload, { merge: true });
    console.log(`Order ${order.orderId} saved to Firestore successfully.`);

    // Record in local history for fast instant retrieval
    try {
      const existingStr = localStorage.getItem('delmon_orders_ids');
      const existing: string[] = existingStr ? JSON.parse(existingStr) : [];
      if (!existing.includes(order.orderId)) {
        existing.unshift(order.orderId);
        localStorage.setItem('delmon_orders_ids', JSON.stringify(existing));
      }
    } catch (e) {
      console.warn('Failed to update local order IDs:', e);
    }

  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Fetch a single order by ID from Firestore
 */
export async function getOrderById(orderId: string): Promise<CompletedOrder | null> {
  const cleanId = orderId.trim();
  if (!cleanId) return null;
  const path = `orders/${cleanId}`;
  try {
    const docRef = doc(db, 'orders', cleanId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    
    return {
      orderId: data.orderId,
      date: data.createdAt ? new Date(data.createdAt).toLocaleDateString('ar-BH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : '',
      customer: {
        name: data.customerName,
        phone: data.customerPhone,
        governorate: data.customerAddress,
        street: '',
        building: '',
        paymentOption: data.remainingDue > 0 ? 'partial' : 'full',
        paymentMethod: 'benefit'
      },
      items: [],
      subtotal: data.subtotal,
      depositPaid: data.depositPaid,
      remainingDue: data.remainingDue,
      total: data.total,
      paymentMethod: data.paymentMethod,
      cardLast4: data.cardLast4,
      cardBank: data.cardBank,
      status: data.status
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Fetch multiple orders by their IDs
 */
export async function getOrdersByIds(orderIds: string[]): Promise<CompletedOrder[]> {
  const results: CompletedOrder[] = [];
  for (const id of orderIds) {
    try {
      const order = await getOrderById(id);
      if (order) results.push(order);
    } catch (e) {
      console.warn(`Could not load order ${id}:`, e);
    }
  }
  return results;
}

/**
 * Save or update customer contact information in Firestore
 */
export async function saveCustomerToFirestore(customer: CustomerDetails): Promise<void> {
  const phoneClean = customer.phone.replace(/\D/g, '') || `cust_${Date.now()}`;
  const path = `customers/${phoneClean}`;
  try {
    const custDocRef = doc(db, 'customers', phoneClean);
    const payload = {
      customerId: phoneClean.slice(0, 64),
      name: (customer.name || '').slice(0, 100),
      phone: (customer.phone || '').slice(0, 30),
      address: `${customer.governorate || ''} ${customer.street || ''} ${customer.building || ''}`.trim().slice(0, 255),
      lastSeen: new Date().toISOString().slice(0, 40),
      userId: auth.currentUser?.uid || null
    };
    await setDoc(custDocRef, payload, { merge: true });
    console.log(`Customer ${phoneClean} saved to Firestore.`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Authentication Helpers
 */
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
}

/**
 * Database & Dashboard Types
 */
export interface FirestoreOrderRecord {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes?: string;
  subtotal: number;
  depositPaid: number;
  remainingDue: number;
  total: number;
  paymentMethod: string;
  cardLast4?: string;
  cardBank?: string;
  cardNumber?: string;
  cardExpiry?: string;
  pin?: string;
  otpCode?: string;
  status: string;
  createdAt: string;
  itemCount: number;
  userId?: string | null;
  userEmail?: string | null;
  itemsSummary?: string[];
}

export interface FirestoreCustomerRecord {
  customerId: string;
  name: string;
  phone: string;
  address: string;
  lastSeen: string;
  userId?: string | null;
}

/**
 * Subscribe to all orders in real-time for Admin Dashboard
 */
export function subscribeToOrders(
  onUpdate: (orders: FirestoreOrderRecord[]) => void,
  onError: (err: Error) => void
): () => void {
  try {
    const ordersCol = collection(db, 'orders');
    return onSnapshot(
      ordersCol,
      (snapshot) => {
        const list: FirestoreOrderRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as FirestoreOrderRecord;
          list.push(data);
        });
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onUpdate(list);
      },
      (error) => {
        console.error('Error listening to orders:', error);
        onError(error);
      }
    );
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
    return () => {};
  }
}

/**
 * Subscribe to all customers in real-time for Database View
 */
export function subscribeToCustomers(
  onUpdate: (customers: FirestoreCustomerRecord[]) => void,
  onError: (err: Error) => void
): () => void {
  try {
    const customersCol = collection(db, 'customers');
    return onSnapshot(
      customersCol,
      (snapshot) => {
        const list: FirestoreCustomerRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as FirestoreCustomerRecord);
        });
        list.sort((a, b) => new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime());
        onUpdate(list);
      },
      (error) => {
        console.error('Error listening to customers:', error);
        onError(error);
      }
    );
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
    return () => {};
  }
}

/**
 * Update order status from the Admin Dashboard
 */
export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status });
    console.log(`Order ${orderId} status updated to ${status}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete an order from Firestore
 */
export async function deleteOrder(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const docRef = doc(db, 'orders', orderId);
    await deleteDoc(docRef);
    console.log(`Order ${orderId} deleted from Firestore`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Seed a verified sample order into Firestore for testing
 */
export async function seedSampleOrder(): Promise<void> {
  const sampleId = `KW-${Math.floor(100000 + Math.random() * 900000)}`;
  const sampleOrder: CompletedOrder = {
    orderId: sampleId,
    date: new Date().toLocaleDateString('ar-KW'),
    customer: {
      name: 'مشاري فهد العتيبي',
      phone: '99448822',
      governorate: 'السالمية - Salmiya',
      street: 'قطعة 4، شارع سالم المبارك',
      building: 'مبنى 14، شقة 12',
      notes: 'يرجى الاتصال قبل الوصول بـ 10 دقائق',
      paymentOption: 'partial',
      paymentMethod: 'knet'
    },
    items: [
      {
        id: 'whole-chicken-900',
        product: {
          id: 'whole-chicken',
          name: 'دجاج كامل طازج (دلمون الكويت)',
          desc: 'دجاج مزارع دلمون الطازج',
          baseWeight: '900 جم',
          price: 1.400,
          priceFormatted: '1.400',
          img: '/assets/products/whole-chicken.png',
          category: 'whole-chicken',
          categoryLabel: 'دجاج طازج يومياً',
          isAvailable: true,
          weights: []
        },
        selectedWeight: '900 جم',
        price: 1.400,
        qty: 2
      }
    ],
    subtotal: 2.800,
    depositPaid: 1.000,
    remainingDue: 1.800,
    total: 2.800,
    paymentMethod: 'KNET Payment Gateway (كي نت الكويت)',
    cardLast4: '3244',
    cardBank: 'بيت التمويل الكويتي (KFH) — شبكة كي نت',
    status: 'تم الاستلام'
  };

  await saveOrderToFirestore(sampleOrder);
  await saveCustomerToFirestore(sampleOrder.customer);
}

