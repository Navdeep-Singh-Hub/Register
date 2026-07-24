export function workshopNote(): string;

export function razorpayAuthHeader(): {
  keyId: string;
  keySecret: string;
  header: string;
};

export function getAdminPassword(): string;
export function createAdminToken(): string;
export function verifyAdminToken(token: string): boolean;
export function passwordsMatch(provided: string, expected: string): boolean;
export function bearerToken(req: {
  headers?: Record<string, string | string[] | undefined>;
}): string;

export type RegistrationRow = {
  id: string;
  orderId: string;
  name: string;
  email: string;
  mobile: string;
  amountInr: number;
  currency: string;
  status: string;
  method: string;
  paidAt: string | null;
};

export function fetchWorkshopRegistrations(options?: {
  strict?: boolean;
}): Promise<RegistrationRow[]>;

export function getSeatAvailability(): Promise<{
  total: number;
  remaining: number;
  paid: number;
  sold: number;
}>;
