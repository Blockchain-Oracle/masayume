import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 font-sans">
      <h1 className="text-3xl font-semibold">Masayume</h1>
      <p className="text-center">
        Booting against Somnia Shannon. <Link href="/dev/boot">Run the boot check</Link>.
      </p>
    </main>
  );
}
