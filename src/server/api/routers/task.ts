import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";

export const taskRouter = createTRPCRouter({
  createTask: protectedProcedure
    .input(z.object({ boardId: z.string(), title: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
      } catch (error) {}
    }),
});
