import { type SuccessResult, type ErrorResult } from '../result';

export type Subscriber = {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  unsubscribeToken: string;
  createdAt: string;
  unsubscribedAt: string | null;
};

export type SubscribeResult =
  | (SuccessResult & { alreadySubscribed?: boolean })
  | ErrorResult;

export type UnsubscribeResult =
  | (SuccessResult & { alreadyUnsubscribed?: boolean })
  | ErrorResult;

export type GetSubscribersResult =
  | SuccessResult<Pick<Subscriber, 'email' | 'unsubscribeToken'>[]>
  | ErrorResult;
