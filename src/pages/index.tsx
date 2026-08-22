import { type NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";

import Landing from "@/views/landing/Landing.view";

/* the sketchbook measures itself against the viewport, so it renders in the
   browser rather than being guessed at on the server */
const LandingView = dynamic(() => Promise.resolve(Landing), { ssr: false });

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Ditto — a board that feels like paper</title>
        <meta
          name="description"
          content="A small kanban board built on the T3 stack: lists you can pick up, cards you can slide across the table."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <LandingView />
    </>
  );
};

export default Home;
