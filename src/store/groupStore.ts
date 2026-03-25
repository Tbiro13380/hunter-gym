import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Group, FeedEvent, Dungeon } from '../lib/types'

type GroupStore = {
  group: Group | null
  createGroup: (name: string, userId: string, userName: string) => Group
  joinGroup: (inviteCode: string) => Group | null
  addFeedEvent: (event: FeedEvent) => void
  addReaction: (eventId: string, userId: string, emoji: string) => void
  addDungeon: (dungeon: Dungeon) => void
  completeDungeon: (dungeonId: string, userId: string) => void
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export const useGroupStore = create<GroupStore>()(
  persist(
    (set, get) => ({
      group: null,

      createGroup: (name, userId, userName) => {
        const group: Group = {
          id: crypto.randomUUID(),
          name,
          inviteCode: generateInviteCode(),
          members: [
            {
              userId,
              name: userName,
              rank: 'E',
              activeTitle: '',
              streakDays: 0,
              weeklyVolume: 0,
              weeklyDays: 0,
            },
          ],
          dungeons: [],
          feed: [],
        }
        set({ group })
        return group
      },

      joinGroup: (inviteCode) => {
        const { group } = get()
        if (group && group.inviteCode === inviteCode) return group
        return null
      },

      addFeedEvent: (event) =>
        set((state) => {
          if (!state.group) return state
          return {
            group: {
              ...state.group,
              feed: [event, ...state.group.feed].slice(0, 100),
            },
          }
        }),

      addReaction: (eventId, userId, emoji) =>
        set((state) => {
          if (!state.group) return state
          return {
            group: {
              ...state.group,
              feed: state.group.feed.map((e) =>
                e.id === eventId
                  ? {
                      ...e,
                      reactions: e.reactions.some((r) => r.userId === userId && r.emoji === emoji)
                        ? e.reactions.filter((r) => !(r.userId === userId && r.emoji === emoji))
                        : [...e.reactions, { userId, emoji }],
                    }
                  : e
              ),
            },
          }
        }),

      addDungeon: (dungeon) =>
        set((state) => {
          if (!state.group) return state
          return {
            group: {
              ...state.group,
              dungeons: [...state.group.dungeons, dungeon],
            },
          }
        }),

      completeDungeon: (dungeonId, userId) =>
        set((state) => {
          if (!state.group) return state
          return {
            group: {
              ...state.group,
              dungeons: state.group.dungeons.map((d) =>
                d.id === dungeonId
                  ? {
                      ...d,
                      participants: d.participants.map((p) =>
                        p.userId === userId ? { ...p, completed: true } : p
                      ),
                    }
                  : d
              ),
            },
          }
        }),
    }),
    { name: 'hunter-gym-group' }
  )
)
