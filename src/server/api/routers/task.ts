import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";

export const taskRouter = createTRPCRouter({
  createTask: protectedProcedure
    .input(z.object({ listId: z.string(), title: z.string() }))
    .query(async ({ input: { listId, title }, ctx: { prisma, session } }) => {
      try {
        const task = await prisma.task.create({
          data: {
            title,
            listId,
          },
        });

        const list = await prisma.list.update({
          where: {
            id: listId,
          },
          data: {
            tasks: {
              connect: task,
            },
          },
        });

        return {
          task,
          list,
        };
      } catch (error) {}
    }),
});
