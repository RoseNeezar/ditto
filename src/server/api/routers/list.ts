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
  updateListTitle: protectedProcedure
    .input(z.object({ listId: z.string(), title: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const { listId, title } = input;
        const { prisma, session } = ctx;

        const list = await prisma.list.update({
          where: {
            id: listId,
          },
          data: {
            title,
          },
        });

        if (!list) {
          throw new Error("error no board");
        }

        return list;
      } catch (error) {}
    }),
  getListDetails: protectedProcedure
    .input(z.object({ listId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const { listId } = input;
        const { prisma } = ctx;

        const list = await prisma.list.findFirst({
          where: {
            id: listId,
          },
          select: {
            tasks: true,
            title: true,
            id: true,
            board: true,
          },
        });

        if (!list) {
          throw new Error("error no board");
        }

        return list;
      } catch (error) {}
    }),
  getListOfKanban: protectedProcedure
    .input(z.object({ boardId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const { boardId } = input;
        const { prisma } = ctx;

        const board = await prisma.board.findFirst({
          where: {
            id: boardId,
          },
        });

        const list = await prisma.list.findMany({
          where: {
            boardId,
          },
          select: {
            tasks: true,
            title: true,
            id: true,
            board: true,
          },
        });

        if (!list) {
          throw new Error("error no board");
        }

        return { list, board };
      } catch (error) {}
    }),
  deleteList: protectedProcedure
    .input(z.object({ listId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const { listId } = input;
        const { prisma } = ctx;

        const removedList = await prisma.list.findFirst({
          where: {
            id: listId,
          },
          select: {
            tasks: true,
            boardId: true,
            id: true,
          },
        });

        const taskIds = removedList?.tasks.map((s) => s.id);
        await prisma.list.delete({
          where: {
            id: listId,
          },
        });

        if (taskIds) {
          await prisma.task.deleteMany({
            where: {
              id: {
                in: taskIds,
              },
            },
          });
        }

        await prisma.board.update({
          where: {
            id: removedList!.boardId,
          },
          data: {
            lists: {
              disconnect: {
                id: removedList!.id,
              },
            },
          },
        });

        return null;
      } catch (error) {}
    }),
});
