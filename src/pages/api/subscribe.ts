import type { APIRoute } from 'astro';
import { z } from 'zod';

import {
  subscribe,
  subscribeInputSchema,
  type SubscribeInput,
} from '../../lib/email-subscriptions';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const input = (await request.json()) as unknown;
    const parsedInput: SubscribeInput = subscribeInputSchema.parse(input);

    const result = await subscribe(parsedInput);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation error',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.error('Subscribe API error:', err);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          'An error occured when trying to subscribe to our newsletter. Please contact us to resolve this.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
