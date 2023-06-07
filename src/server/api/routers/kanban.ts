import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";

export const kanbanRouter = createTRPCRouter({
  createBoard: protectedProcedure
    .input(z.object({ title: z.string() }))
    .query(async ({ input, ctx }) => {
      const { title } = input;
      const { prisma, session } = ctx;
      const existingBoard = await prisma.board.findFirst({
        where: {
          title,
        },
      });

      if (existingBoard) {
        throw new Error("Board already existed !");
      }

      try {
        const board = await prisma.board.create({
          data: {
            title,
            userId: session.user.id,
            lists: [] as any,
          },
        });

        return { board };
      } catch (error: any) {
        throw new Error(error);
      }
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.board;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
