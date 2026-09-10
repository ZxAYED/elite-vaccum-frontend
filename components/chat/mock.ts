import type { ChatMessage, ChatParticipant, Conversation } from "./types";

/**
 * Placeholder content so the surfaces render before the API exists. Delete
 * this file at integration time; nothing but the demo page imports it.
 *
 * Timestamps are relative to render so the day separators, "Active 20m ago"
 * and "Yesterday" states all stay truthful without anyone editing dates.
 */

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

export const CURRENT_USER_ID = "me";

const PARTICIPANTS: ChatParticipant[] = [
  {
    id: "tech-marisol",
    name: "Marisol Okonkwo",
    role: "Senior Technician",
    presence: "online",
  },
  {
    id: "care-support",
    name: "Elite Support",
    role: "Customer Care",
    presence: "online",
  },
  {
    id: "tech-devraj",
    name: "Devraj Bhattacharya",
    role: "Installation Lead",
    presence: "away",
    lastActiveAt: minutesAgo(24),
  },
  {
    id: "billing-annike",
    name: "Annike Sorensen",
    role: "Billing",
    presence: "offline",
    lastActiveAt: minutesAgo(60 * 19),
  },
  {
    id: "tech-yusuf",
    name: "Yusuf Bekele",
    role: "Field Technician",
    presence: "offline",
    lastActiveAt: minutesAgo(60 * 24 * 3),
  },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "c-1",
    participant: PARTICIPANTS[0],
    subject: "SR-4482 · Motor inspection",
    isPinned: true,
    unreadCount: 2,
    lastMessage: {
      body: "I can be at the property by 09:30 tomorrow if that still works.",
      sentAt: minutesAgo(4),
      authorId: "tech-marisol",
    },
  },
  {
    id: "c-2",
    participant: PARTICIPANTS[1],
    subject: "ORD-19204",
    unreadCount: 0,
    lastMessage: {
      body: "Your replacement hose has been dispatched.",
      sentAt: minutesAgo(95),
      authorId: "care-support",
    },
  },
  {
    id: "c-3",
    participant: PARTICIPANTS[2],
    subject: "SR-4390 · New install",
    unreadCount: 5,
    lastMessage: {
      body: "Sending the revised duct layout across shortly.",
      sentAt: minutesAgo(60 * 6),
      authorId: "tech-devraj",
    },
  },
  {
    id: "c-4",
    participant: PARTICIPANTS[3],
    subject: "INV-8821",
    unreadCount: 0,
    lastMessage: {
      body: "You: Paid, thanks for sorting the adjustment.",
      sentAt: minutesAgo(60 * 26),
      authorId: CURRENT_USER_ID,
    },
  },
  {
    id: "c-5",
    participant: PARTICIPANTS[4],
    subject: "SR-4102 · Annual service",
    unreadCount: 0,
    lastMessage: {
      body: "Filter replaced and the system tested clean.",
      sentAt: minutesAgo(60 * 24 * 4),
      authorId: "tech-yusuf",
    },
  },
];

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  "c-1": [
    {
      id: "m-1",
      conversationId: "c-1",
      authorId: "tech-marisol",
      body: "Morning. I've had a look at the diagnostic report from the visit on Tuesday.",
      sentAt: minutesAgo(60 * 26),
    },
    {
      id: "m-2",
      conversationId: "c-1",
      authorId: "tech-marisol",
      body: "The motor bearing is worn rather than failed, so we can replace it without pulling the whole unit out.",
      sentAt: minutesAgo(60 * 26 - 1),
    },
    {
      id: "m-3",
      conversationId: "c-1",
      authorId: CURRENT_USER_ID,
      body: "That's a relief. Roughly what does that change on the quote?",
      sentAt: minutesAgo(60 * 25),
      status: "read",
    },
    {
      id: "m-4",
      conversationId: "c-1",
      authorId: "tech-marisol",
      body: "Around a third less, and it takes an afternoon instead of two days. I've attached the revised figures.",
      sentAt: minutesAgo(150),
      attachments: [
        {
          id: "a-1",
          name: "revised-quotation-SR-4482.pdf",
          size: 284_160,
          kind: "file",
        },
      ],
    },
    {
      id: "m-5",
      conversationId: "c-1",
      authorId: CURRENT_USER_ID,
      body: "Looks good. Let's go ahead.",
      sentAt: minutesAgo(24),
      status: "read",
    },
    {
      id: "m-6",
      conversationId: "c-1",
      authorId: "tech-marisol",
      body: "I can be at the property by 09:30 tomorrow if that still works.",
      sentAt: minutesAgo(4),
    },
  ],
  "c-2": [
    {
      id: "m-7",
      conversationId: "c-2",
      authorId: CURRENT_USER_ID,
      body: "The hose that came with order ORD-19204 has a split near the cuff.",
      sentAt: minutesAgo(140),
      status: "read",
    },
    {
      id: "m-8",
      conversationId: "c-2",
      authorId: "care-support",
      body: "Sorry about that. A replacement is going out today at no charge, and you can keep the original for parts.",
      sentAt: minutesAgo(112),
    },
    {
      id: "m-9",
      conversationId: "c-2",
      authorId: "care-support",
      body: "Your replacement hose has been dispatched.",
      sentAt: minutesAgo(95),
    },
  ],
  "c-3": [
    {
      id: "m-10",
      conversationId: "c-3",
      authorId: "tech-devraj",
      body: "The survey is done. Two of the planned inlet positions clash with the joists on the first floor.",
      sentAt: minutesAgo(60 * 7),
    },
    {
      id: "m-11",
      conversationId: "c-3",
      authorId: "tech-devraj",
      body: "Sending the revised duct layout across shortly.",
      sentAt: minutesAgo(60 * 6),
    },
  ],
  "c-4": [
    {
      id: "m-12",
      conversationId: "c-4",
      authorId: "billing-annike",
      body: "The credit for the duplicate charge is on invoice INV-8821 now.",
      sentAt: minutesAgo(60 * 27),
    },
    {
      id: "m-13",
      conversationId: "c-4",
      authorId: CURRENT_USER_ID,
      body: "Paid, thanks for sorting the adjustment.",
      sentAt: minutesAgo(60 * 26),
      status: "delivered",
    },
  ],
  "c-5": [
    {
      id: "m-14",
      conversationId: "c-5",
      authorId: "tech-yusuf",
      body: "Filter replaced and the system tested clean.",
      sentAt: minutesAgo(60 * 24 * 4),
    },
  ],
};
