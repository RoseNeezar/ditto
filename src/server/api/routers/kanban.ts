import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";

export const boardRouter = createTRPCRouter({
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
          include: {
            lists: true,
          },
        });

        return { board };
      } catch (error: any) {
        throw new Error(error);
      }
    }),

  getBoard: protectedProcedure
    .input(z.object({ boardId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const board = await ctx.prisma.board.findFirst({
          where: {
            id: input.boardId,
          },
          include: {
            lists: true,
          },
        });

        return { board };
      } catch (error) {}
      return ctx.prisma.board;
    }),

  getAllBoard: protectedProcedure.query(async ({ ctx }) => {
    try {
      const boards = await ctx.prisma.board.findFirst({
        where: {
          userId: ctx.session.user.id,
        },
        include: {
          lists: true,
        },
      });

      return { boards };
    } catch (error) {}
    return ctx.prisma.board;
  }),

  updateListOrder: protectedProcedure
    .input(z.object({ boardId: z.string(), newListorder: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      try {
        const boards = await ctx.prisma.board.update({
          where: {
            id: input.boardId,
          },
          data: {
            lists: {
              connect: input.newListorder.map((s) => ({ id: s })),
            },
          },
          include: {
            lists: true,
          },
        });

        return { boards };
      } catch (error) {}
      return ctx.prisma.board;
    }),

  deleteBoard: protectedProcedure
    .input(z.object({ boardId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        // await ctx.prisma.board.delete({
        //   where: { id: input.boardId },
        //   include: { lists: { include: { tasks: true } } },
        // });
        const board = await ctx.prisma.board.findUnique({
          where: { id: input.boardId },
          include: { lists: { include: { tasks: true } } },
        });

        if (!board) {
          throw new Error("Board not found");
        }

        // Collect all the list IDs within the board
        const listIds = board.lists.map((list) => list.id);

        // Collect all the task IDs within the lists
        const taskIds = board.lists.flatMap((list) =>
          list.tasks.map((task) => task.id)
        );

        // Delete the tasks
        await ctx.prisma.task.deleteMany({ where: { id: { in: taskIds } } });

        // Delete the lists
        await ctx.prisma.list.deleteMany({ where: { id: { in: listIds } } });

        // Delete the board
        await ctx.prisma.board.delete({ where: { id: input.boardId } });
      } catch (error) {}
      return ctx.prisma.board;
    }),
});
