import Link from "next/link";

export default function Home() {
  return (
    <section className="hero">
      <div>
        <h1>Wear It MVP</h1>
        <p>
          A working wardrobe and outfit recommendation flow. The app runs without paid API access and switches to real AI classification only when OPENAI_API_KEY is available.
        </p>
      </div>
      <div className="grid three">
        <Link className="button" href="/add-clothing">Add clothing</Link>
        <Link className="button secondary" href="/outfits">Create outfits</Link>
        <Link className="button secondary" href="/recommend">Recommend outfit</Link>
      </div>
    </section>
  );
}
