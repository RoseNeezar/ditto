import { NextPage } from "next";
import dynamic from "next/dynamic";
import Tasks from "../views/kanban/Kanban";
import { columns, tasks } from "../views/kanban/mock";
const LazyGameContainerView = dynamic(() => Promise.resolve(Tasks), {
  ssr: false,
});

const Home: NextPage = () => {
  return (
    <div className="flex w-full flex-1 ">
      <LazyGameContainerView tasks={tasks} columns={columns} />
    </div>
  );
};

export default Home;
