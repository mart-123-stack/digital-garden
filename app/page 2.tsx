export default function Home() {
  return (
    <main className="relative z-10 flex min-h-dvh items-center justify-center px-6 text-center">
      <section className="max-w-6xl">
        <p className="mb-5 text-xs uppercase tracking-[0.42em] text-comet/80">
          Flight Deck 001
        </p>
        <h1 className="whitespace-nowrap font-display text-2xl leading-tight text-starlight sm:text-5xl md:text-6xl lg:text-7xl">
          一座正在醒来的个人宇宙
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-8 text-starlight/62 sm:text-lg">
          星球还在远处成形。现在你看到的是飞船视角、星光视差和深空外壳。
        </p>
      </section>
    </main>
  );
}
