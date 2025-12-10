import { LRUCache } from "lru-cache";
import { type Adapter, type AdapterUser, type VerificationToken } from "next-auth/adapters";

type SentVerificationToken = Omit<VerificationToken, "expires">;

const tokenCache = new LRUCache<string, VerificationToken>({
  max: 1000,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
  allowStale: false,
  noDeleteOnStaleGet: false,
  ttl: 24 * 60 * 60 * 1000,
});

export const egaproNextAuthAdapter: Adapter = {
  async createUser(user) {
    return { id: user.email, ...user };
  },

  async getUser(_) {
    return null;
  },

  async getUserByEmail(_) {
    return null;
  },

  async getUserByAccount(_): Promise<AdapterUser | null> {
    return null;
  },

  async updateUser(user) {
    return user as AdapterUser;
  },

  async linkAccount(_) {
    return _;
  },

  async createSession(session) {
    return session;
  },

  async getSessionAndUser(_) {
    return null;
  },

  async updateSession(_) {
    return null;
  },

  async deleteSession(_) {
    return null;
  },

  async createVerificationToken(verificationToken: VerificationToken): Promise<VerificationToken | null | undefined> {
    tokenCache.set(verificationToken.identifier, verificationToken);
    return verificationToken;
  },

  async useVerificationToken({ identifier, token }: SentVerificationToken): Promise<VerificationToken | null> {
    const foundToken = tokenCache.get(identifier);
    if (foundToken?.token === token) {
      tokenCache.delete(identifier);
      return foundToken;
    }

    return null;
  },
};
