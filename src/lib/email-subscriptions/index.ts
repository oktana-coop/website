import pg from 'pg';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import {
  type Subscriber,
  type SubscribeResult,
  type UnsubscribeResult,
  type GetSubscribersResult,
} from './types';

const { Client } = pg;

export const subscribeInputSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
});

export type SubscribeInput = z.infer<typeof subscribeInputSchema>;

export const unsubscribeInputSchema = z.object({
  token: z.string().min(10, 'Invalid token'),
});

export type UnsubscribeInput = z.infer<typeof unsubscribeInputSchema>;

type DBSubscriber = {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  unsubscribe_token: string;
  created_at: string;
  unsubscribed_at: string | null;
};

const toSubscriber = (row: DBSubscriber): Subscriber => {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    unsubscribeToken: row.unsubscribe_token,
    createdAt: row.created_at,
    unsubscribedAt: row.unsubscribed_at,
  };
};

async function getClient() {
  const client = new Client({
    connectionString: import.meta.env.DATABASE_URL,
    ssl:
      import.meta.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
  });

  await client.connect();

  return client;
}

export function generateUnsubscribeToken(): string {
  return randomBytes(32).toString('hex');
}

export async function subscribe({
  email,
}: SubscribeInput): Promise<SubscribeResult> {
  const client = await getClient();

  try {
    const alreadyExistingResult = await client.query<
      Pick<DBSubscriber, 'id' | 'status'>
    >('SELECT id, status FROM subscribers WHERE email = $1', [email]);

    if (alreadyExistingResult.rows.length > 0) {
      const existing = alreadyExistingResult.rows[0];

      if (existing.status === 'active') {
        return { success: true, alreadySubscribed: true };
      }

      // Re-subscbription
      await client.query(
        'UPDATE subscribers SET status = $1, unsubscribed_at = NULL WHERE email = $2',
        ['active', email]
      );

      return { success: true };
    }

    // New subscriber
    const unsubscribeToken = generateUnsubscribeToken();
    await client.query(
      `INSERT INTO subscribers (email, status, unsubscribe_token) 
       VALUES ($1, $2, $3)`,
      [email, 'active', unsubscribeToken]
    );

    return { success: true };
  } catch (error) {
    console.error('Error in subscribe:', error);
    return { success: false, error: 'Database error' };
  } finally {
    await client.end();
  }
}

export async function unsubscribe({
  token,
}: UnsubscribeInput): Promise<UnsubscribeResult> {
  const client = await getClient();

  try {
    const result = await client.query<
      Pick<DBSubscriber, 'id' | 'email' | 'status'>
    >(
      'SELECT id, email, status FROM subscribers WHERE unsubscribe_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Invalid or expired unsubscribe link' };
    }

    const subscriber = result.rows[0];

    if (subscriber.status === 'unsubscribed') {
      return {
        success: true,
        alreadyUnsubscribed: true,
      };
    }

    await client.query(
      `UPDATE subscribers 
       SET status = $1, unsubscribed_at = NOW() 
       WHERE unsubscribe_token = $2`,
      ['unsubscribed', token]
    );

    return { success: true };
  } catch (error) {
    console.error('Error in unsubscribe:', error);
    return { success: false, error: 'Database error' };
  } finally {
    await client.end();
  }
}

export async function getActiveSubscribers(): Promise<GetSubscribersResult> {
  const client = await getClient();

  try {
    const result = await client.query<DBSubscriber>(
      'SELECT email, unsubscribe_token FROM subscribers WHERE status = $1 ORDER BY created_at DESC',
      ['active']
    );

    const subscribers = result.rows.map(toSubscriber);
    const data = subscribers.map(({ email, unsubscribeToken }) => ({
      email,
      unsubscribeToken,
    }));

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return { success: false, error: 'Database error' };
  } finally {
    await client.end();
  }
}

export * from './types';
