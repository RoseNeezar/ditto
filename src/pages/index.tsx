import { NextPage } from "next";
import dynamic from "next/dynamic";
import Kanban from "../views/kanban/Kanban.view";
import { columns, tasks } from "../views/kanban/mock";
const LazyGameContainerView = dynamic(() => Promise.resolve(Kanban), {
  ssr: false,
});

const Home: NextPage = () => {
  return (
    <div className="flex w-full flex-1 ">
      <LazyGameContainerView Tasks={tasks} List={columns} />
    </div>
  );
};

export default Home;
