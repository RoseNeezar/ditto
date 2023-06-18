import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";

export const listRouter = createTRPCRouter({
  createList: protectedProcedure
    .input(z.object({ boardId: z.string(), title: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const { boardId, title } = input;
        const { prisma, session } = ctx;

        const board = await prisma.board.findFirst({
          where: {
            id: boardId,
          },
          select: {
            lists: true,
          },
        });

        if (!board) {
          throw new Error("error no board");
        }

        const newList = await prisma.list.create({
          data: {
            title,
            boardId,
          },
        });

        board.lists.push(newList);

        const newListOrder = board.lists;

        await prisma.board.update({
          where: {
            id: boardId,
          },
          data: {
            lists: {
              connect: newListOrder.map((s) => ({ id: s.id })),
            },
          },
        });

        return { list: newListOrder };
      } catch (error) {}
    }),
});
