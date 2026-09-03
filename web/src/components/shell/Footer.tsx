import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-row">
          <Link href="/docs" data-cursor="hover">
            Docs
          </Link>
        </div>
      </div>
    </footer>
  );
}
