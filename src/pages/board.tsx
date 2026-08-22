import { type NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";

import Kanban from "@/views/kanban/Kanban.view";
import { columns, tasks } from "@/views/kanban/mock";

const KanbanView = dynamic(() => Promise.resolve(Kanban), {
  ssr: false,
});

const Board: NextPage = () => {
  return (
    <>
      <Head>
        <title>Ditto — board</title>
      </Head>
      <div className="flex w-full flex-1 ">
        <KanbanView Tasks={tasks} List={columns} />
      </div>
    </>
  );
};

export default Board;
