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

export const egaproNextAuthAdapter: Adapter<true> = {
  async createUser(user) {
    return { id: user.email, ...user };
  },

  async getUser(_) {
    return null;
  },

  async getUserByEmail(_) {
    return null;
  },

  /** Using the provider id and the id of the user for a specific account, get the user. */
  async getUserByAccount(_): Promise<AdapterUser | null> {
    return null;
  },

  async updateUser(user) {
    return user as AdapterUser;
  },

  async linkAccount(_) {
    return null;
  },

  /** Creates a session for the user and returns it. */
  async createSession(session) {
    return session;
  },

  async getSessionAndUser(_) {
    return null;
  },

  async updateSession(_) {
    return null;
  },

  /**
   * Deletes a session from the database.
   * It is preferred that this method also returns the session
   * that is being deleted for logging purposes.
   */
  async deleteSession(_) {
    return null;
  },

  async createVerificationToken(verificationToken: VerificationToken): Promise<VerificationToken | null | undefined> {
    tokenCache.set(verificationToken.identifier, verificationToken);
    return verificationToken;
  },

  /**
   * Return verification token from the database
   * and delete it so it cannot be used again.
   */
  async useVerificationToken({ identifier, token }: SentVerificationToken): Promise<VerificationToken | null> {
    const foundToken = tokenCache.get(identifier);
    if (foundToken?.token === token) {
      tokenCache.delete(identifier);
      return foundToken;
    }

    return null;
  },
};
