const sectionNames: Record<string, string> = {
  profile: "Profile 星球",
  blog: "Blog 星球",
  about: "About Me 星球",
  notes: "Notes 星球",
  games: "Game 星球"
};

export default async function SectionPage({
  params
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const title = sectionNames[section] ?? "未知星球";

  return (
    <main className="relative z-10 flex min-h-dvh items-center justify-center px-6 text-center">
      <section>
        <p className="mb-4 text-xs uppercase tracking-[0.42em] text-comet/80">
          Docking Complete
        </p>
        <h1 className="font-display text-5xl text-starlight sm:text-7xl">{title}</h1>
        <p className="mx-auto mt-6 max-w-lg text-starlight/60">
          这里先保留为停靠占位页，后续会扩展成对应星球的完整内容生态。
        </p>
      </section>
    </main>
  );
}
