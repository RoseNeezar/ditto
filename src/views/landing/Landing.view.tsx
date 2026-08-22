import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import Sketchbook from "./components/Sketchbook";
import { PLATES } from "./plates";
import { type Sketchbook as Engine } from "./sketchbookEngine";

const REPO = "https://github.com/RoseNeezar/ditto";

/**
 * The landing page: a workbook of nine plates, one per part of the board,
 * and the plain words underneath it.
 */
const Landing = () => {
  const engine = useRef<Engine | null>(null);
  const [plate, setPlate] = useState(0);

  const openPlate = useCallback((i: number) => {
    engine.current?.goTo(i);
    document
      .getElementById("sketchbook")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <div className="paper-theme relative min-h-screen w-full overflow-x-hidden bg-paper font-book text-ink">
      {/* the painted ground the whole page sits on */}
      <div
        aria-hidden="true"
        className="after:from-paper/25 after:via-paper/70 pointer-events-none fixed inset-0 -z-10 bg-[url('/sketchbook/paper-wash.svg')] bg-cover bg-top opacity-90 after:absolute after:inset-0 after:bg-gradient-to-b after:to-paper"
      />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4 pb-16 pt-4 text-center before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-b before:from-[rgba(240,236,226,.94)] before:via-[rgba(240,236,226,.7)] before:to-transparent before:backdrop-blur-md before:[mask-image:linear-gradient(180deg,#000_46%,transparent)] sm:px-8 sm:pt-5">
        <Link
          href="/"
          className="pointer-events-auto font-display text-2xl leading-none sm:text-[30px]"
        >
          Ditto
        </Link>
        <nav className="pointer-events-auto flex items-center gap-3 text-[13px] tracking-[0.06em] sm:gap-6 sm:text-[15px]">
          <a
            href="#plates"
            className="text-ink-soft transition-colors hover:text-ink"
          >
            Plates
          </a>
          <a
            href="#about"
            className="text-ink-soft transition-colors hover:text-ink"
          >
            About
          </a>
          <Link
            href="/board"
            className="text-ink-soft transition-colors hover:text-ink"
          >
            Board
          </Link>
          <span className="flex items-center gap-3 border-l border-hairline pl-3 sm:pl-4">
            <a
              href={REPO}
              className="p-1 text-ink-soft transition-colors hover:text-ink"
              aria-label="Ditto on GitHub"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className="h-4 w-4"
              >
                <path d="M12 2.2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85l-.01 2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2.2Z" />
              </svg>
            </a>
          </span>
        </nav>
      </header>

      <main>
        <section
          id="sketchbook"
          className="relative grid min-h-[100svh] select-none scroll-mt-24 content-center justify-items-center pb-20 pt-28 sm:pb-28 sm:pt-36"
        >
          {/* botany in the margins, painted on rather than placed */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[2%] left-0 z-0 hidden aspect-[420/900] w-[clamp(120px,15vw,250px)] bg-[url('/sketchbook/sprig-left.svg')] bg-contain bg-bottom bg-no-repeat opacity-50 lg:block"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-2%] right-0 z-0 hidden aspect-[420/900] w-[clamp(100px,12vw,200px)] bg-[url('/sketchbook/sprig-right.svg')] bg-contain bg-bottom bg-no-repeat opacity-50 lg:block"
          />

          <p className="mb-6 px-5 text-center text-[10.5px] uppercase tracking-[0.16em] text-ink-soft sm:mb-8 sm:text-xs sm:tracking-[0.24em]">
            Kanban / Drag &amp; drop / tRPC + Prisma / For teams of a few
          </p>

          <Sketchbook
            onPlate={setPlate}
            onReady={(e) => (engine.current = e)}
          />

          <button
            className="absolute bottom-7 left-1/2 z-[3] -translate-x-1/2 animate-cue px-3 py-2 text-ink motion-reduce:animate-none"
            aria-label="scroll to about"
            onClick={() =>
              document
                .getElementById("about")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            <svg
              viewBox="0 0 44 22"
              width="34"
              height="17"
              fill="none"
              aria-hidden="true"
            >
              <polyline
                points="3,3 22,11 41,3"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="3,11 22,19 41,11"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </section>

        <Rule />

        <section
          id="about"
          className="mx-auto grid max-w-[1080px] scroll-mt-28 grid-cols-1 items-start gap-8 px-5 sm:px-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-14"
        >
          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-ink-faint">
              About
            </p>
            <p className="max-w-[56ch] text-[17px] font-light leading-[1.74] sm:text-lg lg:text-xl">
              Ditto is a small board for people who liked the paper version.
              Lists you can pick up, cards you can slide across the table, and
              nothing between you and the work. It runs on the{" "}
              <BioLink href="https://create.t3.gg/">T3 stack</BioLink> —
              Next.js, tRPC, Prisma and NextAuth — with{" "}
              <BioLink href="https://dndkit.com/">dnd-kit</BioLink> doing the
              lifting, so a card that moves under your hand has already moved in
              the database by the time you let go.
            </p>
            <p className="mt-5 max-w-[56ch] text-[17px] font-light leading-[1.74] sm:text-lg lg:text-xl">
              The sketchbook above is the manual: nine plates, one for each part
              of the board — the columns, the card, the gesture, the round trip
              to the database. Turn the pages, or pick up the glass and read the
              small print.
            </p>
            <Link
              href="/board"
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-hairline bg-[rgba(250,246,238,.62)] px-5 py-2.5 text-[13px] uppercase tracking-[0.18em] text-ink transition-colors hover:bg-[rgba(255,252,244,.9)]"
            >
              Open the board
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div
            aria-hidden="true"
            className="aspect-square w-[170px] select-none justify-self-center bg-[url('/sketchbook/bloom.svg')] bg-contain bg-center bg-no-repeat opacity-90 md:w-[clamp(150px,17vw,260px)] md:self-center"
          />
        </section>

        <Rule short />

        <section
          id="plates"
          className="mx-auto max-w-[1080px] scroll-mt-28 px-5 sm:px-8"
        >
          <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-ink-faint">
            Plates
          </p>
          <ol className="m-0 list-none border-t border-hairline p-0">
            {PLATES.map((p, i) => (
              <li key={p.file}>
                <button
                  aria-current={i === plate}
                  onClick={() => openPlate(i)}
                  className="group grid w-full grid-cols-[3.4em_minmax(0,1fr)_auto] items-baseline gap-4 border-b border-hairline px-1 py-4 text-left transition-[background-color,padding] duration-200 hover:bg-[rgba(255,252,244,.5)] hover:pl-3 aria-[current=true]:bg-[rgba(255,252,244,.5)] aria-[current=true]:pl-3"
                >
                  <span className="text-xs tracking-[0.06em] text-ink-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-xl sm:text-2xl">
                    {p.title}
                  </span>
                  <span className="text-right text-[12.5px] uppercase tracking-[0.08em] text-ink-faint group-aria-[current=true]:text-earth">
                    {p.place}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <Rule short />

        <footer
          id="contact"
          className="pb-11 text-center text-[11.5px] uppercase tracking-[0.24em] text-ink-faint"
        >
          Ditto · A board that feels like paper ·{" "}
          <a
            href={REPO}
            className="text-ink underline decoration-[rgba(43,39,33,.28)] underline-offset-4 transition-colors hover:decoration-ink"
          >
            Source
          </a>
        </footer>
      </main>
    </div>
  );
};

const Rule = ({ short = false }: { short?: boolean }) => (
  <div
    aria-hidden="true"
    className={`mx-auto my-8 block h-[clamp(26px,4vw,46px)] bg-[url('/sketchbook/divider.svg')] bg-[length:100%_auto] bg-center bg-no-repeat sm:my-12 ${
      short
        ? "w-[min(420px,52vw)] opacity-60"
        : "w-[min(1080px,86vw)] opacity-75"
    }`}
  />
);

const BioLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <a
    href={href}
    className="text-ink underline decoration-[rgba(43,39,33,.28)] underline-offset-4 transition-colors hover:decoration-ink"
  >
    {children}
  </a>
);

export default Landing;
